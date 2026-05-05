const mongoose = require("mongoose");

const reactionSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  type: { type: String, enum: ["like", "love", "shocked", "laugh", "sad"] },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Reaction", reactionSchema);
