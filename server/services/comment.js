const Comment = require("../models/Comment");
const mongoose = require("mongoose");

const isValidObjectId = (id) => {
  if (!id) return false;
  const str = String(id);
  return /^[a-fA-F0-9]{24}$/.test(str);
};

exports.getComments = async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) return res.status(400).json({ error: "postId is required" });
    if (!isValidObjectId(postId)) return res.status(400).json({ error: "Invalid postId format" });

    const comments = await Comment.find({ postId })
      .sort({ createdAt: 1 })
      .lean();

    const User = require("../models/User");
    const userIds = [
      ...new Set(comments.map((c) => c.sender?.id?.toString()).filter(Boolean)),
    ].filter(isValidObjectId);

    const users =
      userIds.length > 0
        ? await User.find({ _id: { $in: userIds } })
            .select("_id name image")
            .lean()
        : [];

    const userMap = {};
    users.forEach((u) => {
      userMap[u._id.toString()] = u;
    });

    const updatedComments = comments.map((comment) => {
      if (comment.sender?.id) {
        const userData = userMap[comment.sender.id.toString()];
        if (userData) {
          return {
            ...comment,
            sender: {
              ...comment.sender,
              name: userData.name,
              image: userData.image,
            },
          };
        }
      }
      return comment;
    });

    res.json(updatedComments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ error: "Failed to fetch comments" });
  }
};

exports.createComment = async (req, res) => {
  try {
    const { postId, body, parentCommentId } = req.body;

    if (!req.userId)
      return res.status(401).json({ error: "Authentication required" });
    if (!postId || !body)
      return res.status(400).json({ error: "postId and body are required" });
    if (!isValidObjectId(postId))
      return res.status(400).json({ error: "Invalid postId format" });

    const User = require("../models/User");
    const user = await User.findById(req.userId);

    if (!user) return res.status(404).json({ error: "User not found" });

    const comment = new Comment({
      postId,
      sender: {
        id: user._id,
        name: user.name,
        image: user.image || (user.profilePicture ? { fileId: user.profilePicture } : {}),
      },
      body,
      parentCommentId: parentCommentId || null,
      createdAt: new Date(),
    });

    await comment.save();
    res.status(201).json(comment);
  } catch (error) {
    console.error("Error creating comment:", error);
    res.status(500).json({ error: "Failed to create comment" });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await Comment.findById(id);

    if (!comment) return res.status(404).json({ error: "Comment not found" });

    if (req.userId && comment.sender.id.toString() !== req.userId.toString()) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(id);
    res.json({ success: true, message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
};