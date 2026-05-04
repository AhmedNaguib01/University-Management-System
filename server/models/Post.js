const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  sender: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    name: String,
    image: Object,
  },
  courseId: String,
  title: String,
  body: String,
  attachmentsId: [{ type: mongoose.Schema.Types.ObjectId, ref: "File" }],
  type: {
    type: String,
    enum: ["question", "announcement", "discussion"],
  },
  deadline: Date, // For announcements with deadlines
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Post", postSchema);
