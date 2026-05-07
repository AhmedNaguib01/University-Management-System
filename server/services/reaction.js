const Reaction = require("../models/Reaction");
const mongoose = require("mongoose");

// Helper to validate ObjectId - must be exactly 24 hex characters
const isValidObjectId = (id) => {
  if (!id) return false;
  const str = String(id);
  return /^[a-fA-F0-9]{24}$/.test(str);
};

exports.getReactions = async (req, res) => {
  try {
    const { postId } = req.query;
    if (!postId) return res.status(400).json({ error: "postId is required" });
    if (!isValidObjectId(postId)) return res.status(400).json({ error: "Invalid postId format" });

    const ObjectId = mongoose.Types.ObjectId;

    const reactions = await Reaction.aggregate([
      { $match: { postId: new ObjectId(postId) } },
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
    if (req.userId) {
      const reaction = await Reaction.findOne({
        postId: new ObjectId(postId),
        senderId: new ObjectId(req.userId),
      });
      userReaction = reaction ? reaction.type : null;
    }

    res.json({
      reactions: reactionSummary,
      userReaction,
    });
  } catch (error) {
    console.error("Error fetching reactions:", error);
    res.status(500).json({ error: "Failed to fetch reactions" });
  }
};

exports.upsertReaction = async (req, res) => {
  try {
    const { postId, type } = req.body;
    const ObjectId = mongoose.Types.ObjectId;
    
    if (!req.userId) return res.status(401).json({ error: "Authentication required" });
    if (!postId || !type) return res.status(400).json({ error: "postId and type are required" });
    if (!isValidObjectId(postId)) return res.status(400).json({ error: "Invalid postId format" });

    const validTypes = ["like", "love", "shocked", "laugh", "sad"];
    if (!validTypes.includes(type.toLowerCase())) {
      return res.status(400).json({ error: "Invalid reaction type" });
    }

    let reaction = await Reaction.findOne({
      postId: new ObjectId(postId),
      senderId: new ObjectId(req.userId),
    });

    if (reaction) {
      reaction.type = type.toLowerCase();
      await reaction.save();
    } else {
      reaction = new Reaction({
        postId: new ObjectId(postId),
        senderId: new ObjectId(req.userId),
        type: type.toLowerCase(),
        createdAt: new Date(),
      });
      await reaction.save();
    }

    res.json(reaction);
  } catch (error) {
    console.error("Error upserting reaction:", error);
    res.status(500).json({ error: "Failed to save reaction" });
  }
};

exports.deleteReaction = async (req, res) => {
  try {
    const { postId } = req.params;
    const ObjectId = mongoose.Types.ObjectId;

    if (!req.userId) return res.status(401).json({ error: "Authentication required" });
    if (!isValidObjectId(postId)) return res.status(400).json({ error: "Invalid postId format" });

    const result = await Reaction.findOneAndDelete({
      postId: new ObjectId(postId),
      senderId: new ObjectId(req.userId),
    });

    if (!result) return res.status(404).json({ error: "Reaction not found" });

    res.json({ success: true, message: "Reaction deleted successfully" });
  } catch (error) {
    console.error("Error deleting reaction:", error);
    res.status(500).json({ error: "Failed to delete reaction" });
  }
};
