const User = require("../models/User");
const {
  getTopContributorsLeaderboard,
  getCourseEngagementAnalytics,
  getReactionDistributionAnalysis,
  getInstructorCoursePerformanceReport,
} = require("../dummy-data/aggregation-pipelines");

const instructorReport = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "instructor")
      return res.status(403).json({ error: "Unauthorized" });

    const report = await getTopContributorsLeaderboard();
    res.json({ report });
  } catch (error) {
    console.error("Instructor report error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const instructorReport2 = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "instructor")
      return res.status(403).json({ error: "Unauthorized" });

    const report = await getCourseEngagementAnalytics();
    res.json({ report });
  } catch (error) {
    console.error("Instructor report2 error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const instructorReport3 = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "instructor")
      return res.status(403).json({ error: "Unauthorized" });

    const report = await getReactionDistributionAnalysis();
    res.json({ report });
  } catch (error) {
    console.error("Instructor report3 error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const instructorReport4 = async (req, res) => {
  try {
    const userId = req.userId;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const user = await User.findById(userId).select("-password").lean();
    if (!user) return res.status(404).json({ error: "User not found" });
    if (user.role !== "instructor")
      return res.status(403).json({ error: "Unauthorized" });

    const report = await getInstructorCoursePerformanceReport();
    res.json({ report });
  } catch (error) {
    console.error("Instructor report4 error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  instructorReport,
  instructorReport2,
  instructorReport3,
  instructorReport4,
};
