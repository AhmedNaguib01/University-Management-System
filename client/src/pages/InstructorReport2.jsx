import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card } from "../components/ui/display";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getSession } from "../api/session";
import { getInstructorReport2 } from "../api/users";
import {
  BarChart3,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";
import "../styles/instructor-report.css";

const InstructorReport2 = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [reportData, setReportData] = useState([]);
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
      const data = await getInstructorReport2();
      setReportData(data.report || []);
    } catch (error) {
      console.error("Error loading report:", error);
      toast.error(error.response?.data?.error || "Failed to load report");
    } finally {
      setLoading(false);
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
          <BarChart3 className="header-icon" />
          <h1>Course Engagement Analytics</h1>
          <p>
            Analyze engagement metrics per course including posts, comments, and
            reactions
          </p>
        </div>

        {reportData.length === 0 ? (
          <Card className="empty-state">
            <p>No data available yet</p>
          </Card>
        ) : (
          <div className="leaderboard">
            {reportData.map((course, index) => (
              <Card key={course.courseId || index} className="leaderboard-card">
                <div className="rank-badge">
                  <div className="rank-number">{index + 1}</div>
                </div>

                <div className="instructor-info">
                  <h2 className="instructor-name">{course.courseName}</h2>
                  <div className="score-display">
                    <span className="score-label">Engagement Score:</span>
                    <span className="score-value">
                      {course.engagementScore}
                    </span>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <FileText className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">{course.totalPosts}</span>
                      <span className="stat-label">Total Posts</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <BookOpen className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">{course.announcements}</span>
                      <span className="stat-label">Announcements</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <MessageSquare className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">{course.questions}</span>
                      <span className="stat-label">Questions</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <MessageSquare className="stat-icon comments-received" />
                    <div className="stat-details">
                      <span className="stat-value">{course.totalComments}</span>
                      <span className="stat-label">Comments</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <ThumbsUp className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">
                        {course.totalReactions}
                      </span>
                      <span className="stat-label">Reactions</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <Users className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">
                        {course.uniqueContributors}
                      </span>
                      <span className="stat-label">Contributors</span>
                    </div>
                  </div>
                </div>

                <div className="scoring-note">
                  <small>
                    Enrolled: {course.enrolled} | Avg Comments/Post:{" "}
                    {course.avgCommentsPerPost}
                  </small>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default InstructorReport2;
