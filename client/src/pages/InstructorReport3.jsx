import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card } from "../components/ui/display";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getSession } from "../api/session";
import { getInstructorReport3 } from "../api/users";
import { Heart, ThumbsUp, Laugh, Frown, Zap, PieChart } from "lucide-react";
import { toast } from "sonner";
import "../styles/instructor-report.css";

const InstructorReport3 = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (session && session.user) {
      setCurrentUser(session.user);

      if (session.user.role !== "instructor") {
        toast.error("Access denied. Only instructors can view this page.");
        navigate("/");
        return;
      }

      loadReport();
    } else {
      navigate("/auth");
    }
  }, [navigate]);

  const loadReport = async () => {
    try {
      setLoading(true);
      const data = await getInstructorReport3();
      setReportData(data.report?.[0] || null);
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error(error.response?.data?.error || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const getReactionIcon = (type) => {
    switch (type) {
      case "like":
        return <ThumbsUp className="stat-icon" />;
      case "love":
        return <Heart className="stat-icon" style={{ color: "#e74c3c" }} />;
      case "laugh":
        return <Laugh className="stat-icon" style={{ color: "#f39c12" }} />;
      case "sad":
        return <Frown className="stat-icon" style={{ color: "#3498db" }} />;
      case "shocked":
        return <Zap className="stat-icon" style={{ color: "#9b59b6" }} />;
      default:
        return <ThumbsUp className="stat-icon" />;
    }
  };

  if (loading) {
    return (
      <div className="instructor-report-page">
        <Navbar />
        <div className="loading-container">
          <LoadingSpinner />
        </div>
      </div>
    );
  }

  return (
    <div className="instructor-report-page">
      <Navbar />

      <div className="report-container">
        <div className="report-header">
          <PieChart className="header-icon" />
          <h1>Reaction Distribution Analysis</h1>
          <p>Analyze reaction types distribution across posts and users</p>
        </div>

        {!reportData ? (
          <Card className="empty-state">
            <p>No data available yet</p>
          </Card>
        ) : (
          <>
            <Card className="leaderboard-card rank-1">
              <div className="instructor-info">
                <h2 className="instructor-name">Overall Statistics</h2>
                <div className="score-display">
                  <span className="score-label">Total Reactions:</span>
                  <span className="score-value">{reportData.grandTotal}</span>
                </div>
                <div className="score-display">
                  <span className="score-label">Most Popular:</span>
                  <span
                    className="score-value"
                    style={{ textTransform: "capitalize" }}
                  >
                    {reportData.mostPopularReaction}
                  </span>
                </div>
              </div>
            </Card>

            <div className="leaderboard">
              {reportData.reactionBreakdown?.map((reaction, index) => (
                <Card key={reaction.reactionType} className="leaderboard-card">
                  <div className="rank-badge">
                    {getReactionIcon(reaction.reactionType)}
                  </div>

                  <div className="instructor-info">
                    <h2
                      className="instructor-name"
                      style={{ textTransform: "capitalize" }}
                    >
                      {reaction.reactionType}
                    </h2>
                    <div className="score-display">
                      <span className="score-label">Total Count:</span>
                      <span className="score-value">{reaction.totalCount}</span>
                    </div>
                  </div>

                  <div className="stats-grid">
                    <div className="stat-item">
                      <div className="stat-details">
                        <span className="stat-value">
                          {reaction.uniqueUsersCount}
                        </span>
                        <span className="stat-label">Unique Users</span>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-details">
                        <span className="stat-value">
                          {reaction.uniquePostsCount}
                        </span>
                        <span className="stat-label">Posts Reacted</span>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-details">
                        <span className="stat-value">
                          {reaction.coursesReached}
                        </span>
                        <span className="stat-label">Courses Reached</span>
                      </div>
                    </div>

                    <div className="stat-item">
                      <div className="stat-details">
                        <span className="stat-value">
                          {reaction.avgReactionsPerUser}
                        </span>
                        <span className="stat-label">Avg per User</span>
                      </div>
                    </div>
                  </div>

                  <div className="scoring-note">
                    <small>
                      {(
                        (reaction.totalCount / reportData.grandTotal) *
                        100
                      ).toFixed(1)}
                      % of all reactions
                    </small>
                  </div>
                </Card>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default InstructorReport3;
