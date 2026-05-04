const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const { sendPasswordResetEmail } = require("./email");

const register = async (req, res) => {
  try {
    const { name, email, password, level, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) return res.status(409).json({ error: "Email already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      level: level || "",
      role: role || "student",
    });

    await user.save();

    // creating a JWT (JSON Web Token) for authentication.
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { 
        expiresIn: "24h" 
      }
    );

    res.status(201).json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        image: user.image,
        courses: user.courses,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ error: "Server error during registration" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
    
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return res.status(401).json({ error: "Invalid credentials" });
   
    const token = jwt.sign(
      { 
        userId: user._id, 
        email: user.email, 
        role: user.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    res.json({
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        level: user.level,
        image: user.image,
        courses: user.courses,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Server error during login" });
  }
};

const getCurrentUser = async (req, res) => {
  try {
    // Find the user by their ID without including their password. 
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ error: "User not found" });
    // No password is displayed. 
    res.json({ user });
  } catch (error) {
    console.error("Get current user error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });
  
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({
        message: "If an account exists, a reset email has been sent",
      });
    }

    // RAW token sent to user's email. 
    const resetToken = crypto.randomBytes(32).toString("hex");
    // Hashes the token to be stored in database. 
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");

    // Saves hashed token to user's document. 
    user.resetPasswordToken = hashedToken;
    // Saves when the hashed token expires. 
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Calls the function that sends emails. Sends over the RAW token.
    await sendPasswordResetEmail(email, resetToken);

    res.json({ message: "If an account exists, a reset email has been sent" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: "Error sending reset email" });
  }
};

const resetPassword = async (req, res) => {
  try {
    // Recieves the RAW token + new password. 
    const { token, password } = req.body;
    if (!token || !password) return res.status(400).json({ error: "Token and password are required" });
    
    // Hashes the token recieved from the user.
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    // Searches for the user containing that hash + not expired. 
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ error: "Invalid or expired reset token" });
    
    user.password = await bcrypt.hash(password, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: "Error resetting password" });
  }
};

module.exports = {
  register,
  login,
  getCurrentUser,
  forgotPassword,
  resetPassword,
};