const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String },

    email: { type: String, required: true, unique: true, trim: true },
    password: { type: String, required: true },
    // randomly generated token sent to the user's email when they request a password reset
    resetPasswordToken: { type: String, default: null },
    // Stores the expiration timestamp for the reset token
    resetPasswordExpires: { type: Date, default: null },

    image: { type: Object, default: {} },

    level: { type: String, default: "" },
    courses: { type: [String], default: [] },
    role: {
      type: String,
      enum: ["student", "instructor"],
      default: "student",
    },
    
    createdAt: { type: Date, default: Date.now },
  },
  // removes the auto-generated __v field that Mongoose adds to track document revisions.
  { versionKey: false }
);

module.exports = mongoose.model("User", userSchema);