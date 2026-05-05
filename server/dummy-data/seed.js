require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const User = require("../models/User");
const Course = require("../models/Course");
const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Chat = require("../models/Chat");
const Message = require("../models/Message");
const File = require("../models/File");
const Reaction = require("../models/Reaction");

// Import dummy data from external files
const usersData = require("./users");
const coursesData = require("./courses");
const postsData = require("./posts");
const commentsData = require("./comments");
const chatsData = require("./chats");
const messagesData = require("./messages");
const filesData = require("./files");
const reactionsData = require("./reactions");

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB");

    console.log("Clearing existing data...");
    await Promise.all([
      User.deleteMany({}),
      Course.deleteMany({}),
      Post.deleteMany({}),
      Comment.deleteMany({}),
      Chat.deleteMany({}),
      Message.deleteMany({}),
      File.deleteMany({}),
      Reaction.deleteMany({}),
    ]);

    const hashedPassword = await bcrypt.hash("password123", 10);

    // Prepare users with hashed password
    const preparedUsers = usersData.map(({ _id, password, ...user }) => ({
      ...user,
      password: hashedPassword,
    }));

    console.log("Inserting dummy data...");
    const users = await User.insertMany(preparedUsers);
    console.log(`✓ Inserted ${users.length} users`);

    // Create user map by name for reference
    const userMap = {};
    users.forEach((user) => {
      userMap[user.name] = user._id;
    });


    // Prepare courses with proper instructor IDs
    const instructorNames = [
      "Dr. Ahmed Hassan",
      "Dr. Sarah Mohamed",
      "Dr. Ahmed Fahmy",
      "Dr. Karim Nasser",
    ];
    const preparedCourses = coursesData.map(({ instructorId, ...course }) => ({
      ...course,
      instructorId: [userMap[instructorNames[instructorId - 1]] || userMap["Dr. Ahmed Hassan"]],
    }));

    const courses = await Course.insertMany(preparedCourses);
    console.log(`✓ Inserted ${courses.length} courses`);

    // Prepare files (remove _id to let MongoDB generate)
    const preparedFiles = filesData.map(({ _id, ...file }) => ({
      ...file,
      fileData: Buffer.from(file.fileName),
    }));

    const files = await File.insertMany(preparedFiles);
    console.log(`✓ Inserted ${files.length} files`);

    // Prepare posts with proper sender IDs
    const preparedPosts = postsData.map(({ _id, sender, ...post }) => ({
      ...post,
      sender: {
        id: userMap[sender.name] || users[0]._id,
        name: sender.name,
        image: sender.image || {},
      },
    }));

    const posts = await Post.insertMany(preparedPosts);
    console.log(`✓ Inserted ${posts.length} posts`);

    // Prepare comments with proper IDs
    const preparedComments = commentsData.map(({ _id, postId, sender, ...comment }) => ({
      ...comment,
      postId: posts[parseInt(postId) - 1]?._id || posts[0]._id,
      sender: {
        id: userMap[sender.name] || users[0]._id,
        name: sender.name,
        image: sender.image || {},
      },
    }));

    const comments = await Comment.insertMany(preparedComments);
    console.log(`✓ Inserted ${comments.length} comments`);

    // Prepare chats with proper user IDs
    const preparedChats = chatsData.map(({ _id, user1, user2, ...chat }) => ({
      ...chat,
      user1: {
        id: userMap[user1.name] || users[0]._id,
        name: user1.name,
        image: user1.image || {},
      },
      user2: {
        id: userMap[user2.name] || users[0]._id,
        name: user2.name,
        image: user2.image || {},
      },
    }));

    const chats = await Chat.insertMany(preparedChats);
    console.log(`✓ Inserted ${chats.length} chats`);

    // Prepare messages with proper user IDs
    const usersByIndex = users.reduce((acc, user, idx) => {
      acc[idx + 1] = user._id;
      return acc;
    }, {});

    const preparedMessages = messagesData.map(({ _id, senderId, receiverId, attachmentsId, ...message }) => ({
      ...message,
      senderId: usersByIndex[senderId] || users[0]._id,
      receiverId: usersByIndex[receiverId] || users[0]._id,
      attachmentsId: attachmentsId?.length ? attachmentsId.map(id => files[id - 1]?._id).filter(Boolean) : [],
    }));

    const messages = await Message.insertMany(preparedMessages);
    console.log(`✓ Inserted ${messages.length} messages`);

    // Prepare reactions with proper IDs
    const preparedReactions = reactionsData.map(({ _id, postId, senderId, ...reaction }) => ({
      ...reaction,
      postId: posts[postId - 1]?._id || posts[0]._id,
      senderId: usersByIndex[senderId] || users[0]._id,
    }));

    const reactions = await Reaction.insertMany(preparedReactions);
    console.log(`✓ Inserted ${reactions.length} reactions`);

    console.log("\n✅ Database seeded successfully!");
    console.log("\nYou can login with any user using:");
    console.log("Email: [any email from above]");
    console.log("Password: password123");
  } catch (error) {
    console.error("Error seeding database:", error);
  } finally {
    await mongoose.connection.close();
    console.log("Database connection closed");
  }
};

seedDatabase();
