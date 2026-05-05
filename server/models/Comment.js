const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema({
  postId: { type: mongoose.Schema.Types.ObjectId, ref: "Post" },
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    image: { type: Object, default: {} },
  },
  body: String,
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Comment", commentSchema);
