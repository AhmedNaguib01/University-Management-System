import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { Button } from "../components/ui/button";
import { Input, Label } from "../components/ui/form-elements";
import { Card, CardContent, CardHeader } from "../components/ui/display";
import { login, register } from "../api/auth";
import { toast } from "sonner";
import "../styles/auth.css";

const Auth = () => {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    level: "",
    role: "student",
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
        toast.success("Logged in successfully!");
      } else {
        await register(
          formData.name,
          formData.email,
          formData.password,
          formData.level,
          formData.role
        );
        toast.success("Account created successfully!");
      }
      navigate("/");
    } catch (error) {
      console.error("Auth error:", error);
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
              {isLogin
                ? "Welcome back! Sign in to continue"
                : "Join our educational community"}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="auth-form">
              {!isLogin && (
                <div className="form-group">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={handleChange}
                    required={!isLogin}
                  />
                </div>
              )}

              <div className="form-group">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
              </div>

              {!isLogin && (
                <>
                  <div className="form-group">
                    <Label htmlFor="level">Level (Optional)</Label>
                    <Input
                      id="level"
                      name="level"
                      type="text"
                      placeholder="e.g., Freshman, Sophomore"
                      value={formData.level}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <Label htmlFor="role">Role</Label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="input"
                    >
                      <option value="student">Student</option>
                      <option value="instructor">Instructor</option>
                    </select>
                  </div>
                </>
              )}

              <Button type="submit" className="btn-full" disabled={loading}>
                {loading
                  ? "Please wait..."
                  : isLogin
                  ? "Sign In"
                  : "Create Account"}
              </Button>

              {isLogin && (
                <div className="forgot-password-link">
                  <a href="/forgot-password">Forgot password?</a>
                </div>
              )}
            </form>

            <div className="auth-toggle">
              <p>
                {isLogin
                  ? "Don't have an account?"
                  : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(!isLogin)}
                  className="toggle-link"
                >
                  {isLogin ? "Sign up" : "Sign in"}
                </button>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
