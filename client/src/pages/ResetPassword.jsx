import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, CheckCircle } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/form-elements";
import { Card, CardContent, CardHeader } from "../components/ui/display";
import { resetPassword } from "../api/auth";
import { toast } from "sonner";
import "../styles/auth.css";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      await resetPassword(token, password);
      setSuccess(true);
      toast.success("Password reset successful!");
      setTimeout(() => navigate("/auth"), 3000);
    } catch (error) {
      toast.error(error.response?.data?.error || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-container">
        <Card className="auth-card">
          <CardHeader className="auth-header">
            <div className="auth-logo">
              <div className="logo-icon">
                <GraduationCap size={32} />
              </div>
              <h1 className="logo-text">EduVerse</h1>
            </div>
            <p className="auth-subtitle">
              {success ? "Password reset!" : "Create new password"}
            </p>
          </CardHeader>

          <CardContent>
            {success ? (
              <div className="reset-sent">
                <div className="sent-icon success">
                  <CheckCircle size={48} />
                </div>
                <p>Your password has been reset successfully.</p>
                <p className="sent-note">Redirecting to login...</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <Label htmlFor="password">New Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="form-group">
                  <Label htmlFor="confirmPassword">Confirm Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="btn-full" disabled={loading}>
                  {loading ? "Resetting..." : "Reset Password"}
                </Button>
              </form>
            )}

            <div className="auth-toggle">
              <Link to="/auth" className="toggle-link">
                <ArrowLeft size={14} style={{ marginRight: 4 }} />
                Back to login
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ResetPassword;
