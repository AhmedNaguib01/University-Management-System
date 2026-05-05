const mongoose = require("mongoose");

const courseSchema = new mongoose.Schema({
  _id: String,
  name: String,
  creditHours: Number,
  description: String,
  // Stores the _id of a user from the User collection. 
  instructorId: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  enrolled: { type: Number, default: 0 },
  capacity: { type: Number, default: 80 },
});

module.exports = mongoose.model("Course", courseSchema);