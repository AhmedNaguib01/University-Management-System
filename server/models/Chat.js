const mongoose = require("mongoose");

const chatSchema = new mongoose.Schema({
  user1: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    image: { type: Object, default: {} },
  },
  user2: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    image: { type: Object, default: {} },
  },
  lastMessage: String,
  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Chat", chatSchema);
