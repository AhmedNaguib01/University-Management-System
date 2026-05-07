import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card } from "../components/ui/display";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getSession } from "../api/session";
import { getInstructorReport4 } from "../api/users";
import {
  GraduationCap,
  Users,
  FileText,
  MessageSquare,
  ThumbsUp,
  TrendingUp,
} from "lucide-react";
import { toast } from "sonner";
import "../styles/instructor-report.css";

const InstructorReport4 = () => {
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
      const data = await getInstructorReport4();
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
          <GraduationCap className="header-icon" />
          <h1>Course Performance Report</h1>
          <p>Detailed analytics for courses with student engagement metrics</p>
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
                    <span className="score-label">Enrollment Rate:</span>
                    <span className="score-value">
                      {course.enrollmentRate}%
                    </span>
                  </div>
                  {course.instructors?.length > 0 && (
                    <div className="score-display">
                      <span className="score-label">Instructor:</span>
                      <span className="score-value">
                        {course.instructors.map((i) => i.name).join(", ")}
                      </span>
                    </div>
                  )}
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <Users className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">
                        {course.enrolled}/{course.capacity}
                      </span>
                      <span className="stat-label">Enrolled</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <FileText className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">{course.totalPosts}</span>
                      <span className="stat-label">Total Posts</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <MessageSquare className="stat-icon" />
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
                    <Users className="stat-icon comments-received" />
                    <div className="stat-details">
                      <span className="stat-value">
                        {course.uniqueContributors}
                      </span>
                      <span className="stat-label">Contributors</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <TrendingUp className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">
                        {course.avgEngagementPerPost}
                      </span>
                      <span className="stat-label">Avg Engagement</span>
                    </div>
                  </div>
                </div>

                <div className="scoring-note">
                  <small>
                    Posts: {course.postsByType?.questions || 0} Questions |{" "}
                    {course.postsByType?.announcements || 0} Announcements |{" "}
                    {course.postsByType?.discussions || 0} Discussions
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

export default InstructorReport4;
