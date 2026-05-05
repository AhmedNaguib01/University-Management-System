const User = require("../models/User");
const Post = require("../models/Post");
const Course = require("../models/Course");
const {
  getTopContributorsLeaderboard,
} = require("../dummy-data/aggregation-pipelines");

// Must be exactly 24 hex characters.
const isValidObjectId = (id) => {
  if (!id) return false;
  const str = String(id);
  return /^[a-fA-F0-9]{24}$/.test(str);
};

const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "Invalid user ID format" });

    // Excludes the addition of the password field.
    const user = await User.findById(id).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });

    // Casches data for 5 minutes incase of a repeated request.
    res.setHeader("Cache-Control", "private, max-age=300");
    res.json(user);
  } catch (error) {
    console.error("Get user profile error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const updateUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    if (req.userId !== id) {
      return res
        .status(403)
        .json({ error: "You can only update your own profile" });
    }

    const { name, email, level, image, bio, profilePicture, password } =
      req.body;

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (level) updateData.level = level;
    if (image) updateData.image = image;
    if (profilePicture) updateData.profilePicture = profilePicture;
    if (bio !== undefined) updateData.bio = bio;

    if (password) {
      const bcrypt = require("bcrypt");
      updateData.password = await bcrypt.hash(password, 10);
    }

    // Reflect these changes into the database.
    await User.findByIdAndUpdate(id, updateData, { runValidators: true });

    const user = await User.findById(id).select("-password");

    if (!user) return res.status(404).json({ error: "User not found" });

    const newImage = image || profilePicture;
    if (newImage || name) {
      const userId = new mongoose.Types.ObjectId(id);
      const updateFields = {};
      if (newImage) updateFields["sender.image"] = newImage;
      if (name) updateFields["sender.name"] = name;

      // Update Posts and Comments in parallel
      await Promise.all([
        Post.updateMany({ "sender.id": userId }, { $set: updateFields }),
        Comment.updateMany({ "sender.id": userId }, { $set: updateFields }),
      ]);

      // Update Chats (user can be user1 or user2)
      const chatUpdateFields1 = {};
      const chatUpdateFields2 = {};
      if (newImage) {
        chatUpdateFields1["user1.image"] = newImage;
        chatUpdateFields2["user2.image"] = newImage;
      }
      if (name) {
        chatUpdateFields1["user1.name"] = name;
        chatUpdateFields2["user2.name"] = name;
      }

      await Promise.all([
        Chat.updateMany({ "user1.id": userId }, { $set: chatUpdateFields1 }),
        Chat.updateMany({ "user2.id": userId }, { $set: chatUpdateFields2 }),
      ]);
    }

    res.json(user);
  } catch (error) {
    console.error("Update user profile error:", error);
    if (error.code === 11000) {
      return res.status(409).json({ error: "Email already exists" });
    }
    res.status(500).json({ error: "Server error" });
  }
};

const getUserPosts = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "Invalid user ID format" });

    // Defaults to page 1 with 20 items if not provided.
    const { page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), 50);

    const [posts, total, userData] = await Promise.all([
      Post.find({ "sender.id": id })
        .select("title body type courseId createdAt attachmentsId sender")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments({ "sender.id": id }),
      // Returns user's name + profile picture
      User.findById(id).select("name profilePicture").lean(),
    ]);

    // Incase of any user profile picture/name updates.
    const updatedPosts = posts.map((post) => ({
      ...post,
      sender: {
        ...post.sender,
        name: userData?.name || post.sender?.name,
        profilePicture: userData?.profilePicture || post.sender?.profilePicture,
      },
    }));

    res.json({
      posts: updatedPosts,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get user posts error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserCourses = async (req, res) => {
  try {
    const { id } = req.params;
    if (!isValidObjectId(id))
      return res.status(400).json({ error: "Invalid user ID format" });

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ error: "User not found" });

    let courses = [];

    if (user.role === "instructor") {
      courses = await Course.find({
        instructorId: user._id,
        // Change instructorId so it contains name & email.
      }).populate("instructorId", "name email");
    } else {
      // Find all courses whose IDs are in the user's courses array.
      courses = await Course.find({ _id: { $in: user.courses } }).populate(
        "instructorId",
        "name email",
      );
    }

    res.json(courses);
  } catch (error) {
    console.error("Get user courses error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query, role, limit = 20 } = req.query;

    const searchQuery = {};
    if (role) searchQuery.role = role;

    if (query && query.trim().length >= 2) {
      searchQuery.$or = [
        { name: { $regex: query, $options: "i" } },
        { email: { $regex: query, $options: "i" } },
      ];
    }

    if (req.userId) searchQuery._id = { $ne: req.userId };

    const limitNum = Math.min(parseInt(limit), 50);
    const users = await User.find(searchQuery)
      .select("name email role profilePicture level")
      .limit(limitNum)
      .lean();

    res.setHeader("Cache-Control", "private, max-age=60");
    res.json(users);
  } catch (error) {
    console.error("Search users error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getUserStats = async (req, res) => {
  try {
    const userId = req.params.id;
    if (!isValidObjectId(userId))
      return res.status(400).json({ error: "Invalid user ID format" });

    const Comment = require("../models/Comment");
    const Reaction = require("../models/Reaction");

    const [postsCount, commentsCount, reactionsCount] = await Promise.all([
      Post.countDocuments({ "sender.id": userId }),
      Comment.countDocuments({ "sender.id": userId }),
      Reaction.countDocuments({ senderId: userId }),
    ]);

    const stats = {
      posts: postsCount,
      comments: commentsCount,
      reactions: reactionsCount,
    };

    res.setHeader("Cache-Control", "private, max-age=300");
    res.json(stats);
  } catch (error) {
    console.error("Get user stats error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const instructorReport = async (req, res) => {
  try {
    const userId = req.userId; // req.userId is set by auth middleware
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "instructor")
      return res.status(403).json({ error: "Unauthorized" });

    const report = await getTopContributorsLeaderboard();
    res.json({ report });
  } catch (error) {
    console.error("Instructor report error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getUserProfile,
  updateUserProfile,
  getUserPosts,
  getUserCourses,
  searchUsers,
  getUserStats,
  instructorReport,
};
