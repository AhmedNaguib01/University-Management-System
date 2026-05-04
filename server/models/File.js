const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  fileName: String,
  fileType: { type: String, enum: ["image", "pdf", "word"], required: true },
  fileData: { type: Buffer, required: true },
  fileSize: { type: Number, default: 0 },
  courseId: { type: String, ref: "Course" },
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("File", fileSchema);