import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import { Card } from "../components/ui/display";
import LoadingSpinner from "../components/common/LoadingSpinner";
import { getSession } from "../api/session";
import { getInstructorReport } from "../api/users";
import { Trophy, MessageSquare, ThumbsUp, FileText, Medal, Award } from "lucide-react";
import { toast } from "sonner";
import "../styles/instructor-report.css";

const InstructorReport = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [reportData, setReportData] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const session = getSession();
    if (session && session.user) {
      setCurrentUser(session.user);
      
      // Check if user is an instructor
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
      const data = await getInstructorReport();
      setReportData(data.report || []);
    } catch (error) {
      console.error("Error loading instructor report:", error);
      toast.error(error.response?.data?.error || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index) => {
    switch (index) {
      case 0:
        return <Trophy className="rank-icon gold" />;
      case 1:
        return <Medal className="rank-icon silver" />;
      case 2:
        return <Award className="rank-icon bronze" />;
      default:
        return <div className="rank-number">{index + 1}</div>;
    }
  };

  const getRankClass = (index) => {
    switch (index) {
      case 0:
        return "rank-1";
      case 1:
        return "rank-2";
      case 2:
        return "rank-3";
      default:
        return "";
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
          <Trophy className="header-icon" />
          <h1>Top Contributors Leaderboard</h1>
          <p>Top instructors ranked by their contributions and engagement</p>
        </div>

        {reportData.length === 0 ? (
          <Card className="empty-state">
            <p>No data available yet</p>
          </Card>
        ) : (
          <div className="leaderboard">
            {reportData.map((instructor, index) => (
              <Card 
                key={instructor._id} 
                className={`leaderboard-card ${getRankClass(index)}`}
              >
                <div className="rank-badge">
                  {getRankIcon(index)}
                </div>
                
                <div className="instructor-info">
                  <h2 className="instructor-name">{instructor.name}</h2>
                  <div className="score-display">
                    <span className="score-label">Total Score:</span>
                    <span className="score-value">{instructor.score}</span>
                  </div>
                </div>

                <div className="stats-grid">
                  <div className="stat-item">
                    <FileText className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">{instructor.posts_count}</span>
                      <span className="stat-label">Posts</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <MessageSquare className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">{instructor.comments_count}</span>
                      <span className="stat-label">Comments Made</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <ThumbsUp className="stat-icon" />
                    <div className="stat-details">
                      <span className="stat-value">{instructor.reactions_count}</span>
                      <span className="stat-label">Reactions Given</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <MessageSquare className="stat-icon comments-received" />
                    <div className="stat-details">
                      <span className="stat-value">{instructor.comments_on_posts_count}</span>
                      <span className="stat-label">Comments Received</span>
                    </div>
                  </div>

                  <div className="stat-item">
                    <ThumbsUp className="stat-icon reactions-received" />
                    <div className="stat-details">
                      <span className="stat-value">{instructor.reactions_on_posts_count}</span>
                      <span className="stat-label">Reactions Received</span>
                    </div>
                  </div>
                </div>

                <div className="scoring-note">
                  <small>
                    Score = (Posts × 3) + (Comments × 2) + (Reactions × 1) + 
                    (Comments Received × 2) + (Reactions Received × 1)
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

export default InstructorReport;
