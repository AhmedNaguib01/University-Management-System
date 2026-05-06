const express = require("express");
const router = express.Router();
const { register, login, getCurrentUser, forgotPassword, resetPassword, } = require("../services/auth");
const { getUserProfile, updateUserProfile, getUserPosts, getUserCourses, searchUsers, getUserStats } = require("../services/user");
const { instructorReport, instructorReport2, instructorReport3, instructorReport4 } = require("../services/report");
const { auth } = require("../middleware/auth");

router.post("/register", register);
router.post("/login", login);
router.get("/me", auth, getCurrentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

router.get("/search", auth, searchUsers);
router.get("/report", auth, instructorReport);
router.get("/report2", auth, instructorReport2);
router.get("/report3", auth, instructorReport3);
router.get("/report4", auth, instructorReport4);
router.put("/profile", auth, async (req, res) => {
  req.params.id = req.userId;
  return updateUserProfile(req, res);
});
router.get("/:id/stats", getUserStats);
router.get("/:id/posts", getUserPosts);
router.get("/:id/courses", getUserCourses);
router.get("/:id", getUserProfile);
router.put("/:id", auth, updateUserProfile);

module.exports = router;