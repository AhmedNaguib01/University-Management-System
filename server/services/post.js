const Post = require("../models/Post");
const Comment = require("../models/Comment");
const Reaction = require("../models/Reaction");
const User = require("../models/User");
const mongoose = require("mongoose");

exports.getAllPosts = async (req, res) => {
  try {
    const { courseId, type, limit = 50, skip = 0 } = req.query;
    const filter = {};

    if (courseId) filter.courseId = courseId;
    if (type) filter.type = type.toLowerCase();

    const posts = await Post.find(filter)
      .select(
        "title body type courseId sender attachmentsId deadline createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id));

    const userIds = [
      ...new Set(posts.map((p) => p.sender?.id?.toString()).filter(Boolean)),
    ].filter(isValidObjectId);

    const users =
      userIds.length > 0
        ? await User.find({ _id: { $in: userIds } })
            .select("_id name profilePicture")
            .lean()
        : [];

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const updatedPosts = posts.map((post) => {
      if (post.sender?.id) {
        const userData = userMap[post.sender.id.toString()];
        if (userData) {
          return {
            ...post,
            sender: {
              ...post.sender,
              name: userData.name,
              profilePicture: userData.profilePicture,
            },
          };
        }
      }
      return post;
    });

    res.json(updatedPosts);
  } catch (error) {
    console.error("Error fetching posts:", error);
    res.status(500).json({ error: "Failed to fetch posts" });
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const ObjectId = mongoose.Types.ObjectId;

    const post = await Post.findById(id)
      .select(
        "title body type courseId sender attachmentsId deadline eventDate eventLocation createdAt"
      )
      .lean();

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    const comments = await Comment.find({ postId: id })
      .select("body sender createdAt")
      .sort({ createdAt: 1 })
      .lean();

    const userIds = new Set();
    if (post.sender?.id) userIds.add(post.sender.id.toString());
    comments.forEach((c) => {
      if (c.sender?.id) userIds.add(c.sender.id.toString());
    });

    const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(String(id));

    const validUserIds = Array.from(userIds).filter(isValidObjectId);

    const users =
      validUserIds.length > 0
        ? await User.find({ _id: { $in: validUserIds } })
            .select("_id name profilePicture")
            .lean()
        : [];

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const updatedPost = { ...post };
    if (post.sender?.id) {
      const userData = userMap[post.sender.id.toString()];
      if (userData) {
        updatedPost.sender = {
          ...post.sender,
          name: userData.name,
          profilePicture: userData.profilePicture,
        };
      }
    }

    const updatedComments = comments.map((comment) => {
      if (comment.sender?.id) {
        const userData = userMap[comment.sender.id.toString()];
        if (userData) {
          return {
            ...comment,
            sender: {
              ...comment.sender,
              name: userData.name,
              profilePicture: userData.profilePicture,
            },
          };
        }
      }
      return comment;
    });

    const reactions = await Reaction.aggregate([
      { $match: { postId: new ObjectId(id) } },
      { $group: { _id: "$type", count: { $sum: 1 } } },
    ]);

    const reactionSummary = {
      like: 0,
      love: 0,
      shocked: 0,
      laugh: 0,
      sad: 0,
    };

    reactions.forEach((r) => {
      reactionSummary[r._id] = r.count;
    });

    let userReaction = null;
    if (req.user) {
      const reaction = await Reaction.findOne({
        postId: new ObjectId(id),
        senderId: new ObjectId(req.user._id),
      })
        .select("type")
        .lean();
      userReaction = reaction ? reaction.type : null;
    }

    res.json({
      post: updatedPost,
      comments: updatedComments,
      reactions: reactionSummary,
      userReaction,
    });
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
};

exports.createPost = async (req, res) => {
  try {
    const { courseId, title, body, type, attachmentsId, image } = req.body;

    if (!req.userId) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const post = new Post({
      sender: {
        id: user._id,
        name: user.name,
        image:
          user.image ||
          (user.profilePicture ? { fileId: user.profilePicture } : {}),
      },
      courseId,
      title,
      body,
      attachmentsId: attachmentsId || [],
      image: image || null,
      type: type ? type.toLowerCase() : "discussion",
      answered: false,
      deadline: req.body.deadline || null,
      eventDate: req.body.eventDate || null,
      eventLocation: req.body.eventLocation || null,
      createdAt: new Date(),
    });

    await post.save();
    res.status(201).json(post);
  } catch (error) {
    console.error("Error creating post:", error);
    res.status(500).json({ error: "Failed to create post" });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, answered } = req.body;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (req.user && post.sender.id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to update this post" });
    }

    if (title !== undefined) post.title = title;
    if (body !== undefined) post.body = body;
    if (answered !== undefined) post.answered = answered;

    await post.save();
    res.json(post);
  } catch (error) {
    console.error("Error updating post:", error);
    res.status(500).json({ error: "Failed to update post" });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;

    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    if (req.user && post.sender.id.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this post" });
    }

    await Comment.deleteMany({ postId: id });
    await Reaction.deleteMany({ postId: id });

    await Post.findByIdAndDelete(id);
    res.json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    console.error("Error deleting post:", error);
    res.status(500).json({ error: "Failed to delete post" });
  }
};
