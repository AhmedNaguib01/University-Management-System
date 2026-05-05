import { useState } from "react";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowLeft, Mail } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/form-elements";
import { Card, CardContent, CardHeader } from "../components/ui/display";
import { forgotPassword } from "../api/auth";
import { toast } from "sonner";
import "../styles/auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);
      setSent(true);
      toast.success("Reset email sent! Check your inbox.");
    } catch (error) {
      toast.error("Failed to send reset email");
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
              {sent ? "Check your email" : "Reset your password"}
            </p>
          </CardHeader>

          <CardContent>
            {sent ? (
              <div className="reset-sent">
                <div className="sent-icon">
                  <Mail size={48} />
                </div>
                <p>We've sent a password reset link to <strong>{email}</strong></p>
                <p className="sent-note">Check your spam folder if you don't see it.</p>
                <Link to="/auth" className="back-to-login">
                  <ArrowLeft size={16} /> Back to login
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="auth-form">
                <div className="form-group">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="btn-full" disabled={loading}>
                  {loading ? "Sending..." : "Send Reset Link"}
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

export default ForgotPassword;
