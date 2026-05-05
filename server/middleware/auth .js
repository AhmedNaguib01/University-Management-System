const jwt = require("jsonwebtoken");

// Verifies if it is the user or not. 
const auth = (req, res, next) => {
  try {
    // Grabs token. 
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ error: "Authentication required" });

    // Verifies the JWT token. 
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // Extracting data from the token. 
    req.userId = decoded.userId;
    req.userEmail = decoded.email;
    req.userRole = decoded.role;
    next();
    
  } catch (error) {
    res.status(401).json({ error: "Invalid or expired token" });
  }
};

// Verifies if user is an instructor or not. 
const isInstructor = (req, res, next) => {
  if (req.userRole !== "instructor") {
    return res.status(403).json({ error: "Instructor access required" });
  }
  next();
};

module.exports = { auth, isInstructor };