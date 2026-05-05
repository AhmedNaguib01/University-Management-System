const Course = require("../models/Course");
const User = require("../models/User");

const getAllCourses = async (req, res) => {
  try {
    const { limit = 100, skip = 0 } = req.query;
    const courses = await Course.find()
      // Diplay the following fields ONLY. 
      .select("_id name description creditHours capacity enrolled instructorId")
      // Replace the id inside instructorId with name, email & profilePicture. 
      .populate("instructorId", "name email profilePicture")
      .limit(parseInt(limit))
      .skip(parseInt(skip))
      .lean();

    res.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({ error: "Failed to fetch courses" });
  }
};

const getCourseById = async (req, res) => {
  try {
    const { id } = req.params;
    const course = await Course.findById(id)
      .select("_id name description creditHours capacity enrolled instructorId")
      .populate("instructorId", "name email profilePicture")
      .lean();

    if (!course) {
      return res.status(404).json({ error: "Course not found" });
    }

    res.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({ error: "Failed to fetch course" });
  }
};

const createCourse = async (req, res) => {
  try {
    const { _id, name, creditHours, description } = req.body;

    if (!req.userId) return res.status(401).json({ error: "Authentication required" });
    
    if (req.userRole !== "instructor" && req.userRole !== "admin") {
      return res.status(403).json({ error: "Only instructors can create courses" });
    }

    const course = new Course({
      _id,
      name,
      creditHours,
      description,
      instructorId: [req.userId],
    });

    await course.save();
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ error: "Failed to create course" });
  }
};

const updateCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, creditHours, description } = req.body;

    const course = await Course.findById(id);

    if (!course) return res.status(404).json({ error: "Course not found" });
    
    if (req.user && !course.instructorId.some((instId) => instId.toString() === req.user._id.toString())) {
      return res.status(403).json({ error: "Not authorized to update this course" });
    }

    if (name !== undefined) course.name = name;
    if (creditHours !== undefined) course.creditHours = creditHours;
    if (description !== undefined) course.description = description;

    await course.save();
    res.json(course);
  } catch (error) {
    console.error("Error updating course:", error);
    res.status(500).json({ error: "Failed to update course" });
  }
};

const deleteCourse = async (req, res) => {
  try {
    const { id } = req.params;
    if (!req.userId) return res.status(401).json({ error: "Authentication required" });
    
    if (req.userRole !== "instructor" && req.userRole !== "admin") {
      return res.status(403).json({ error: "Only instructors can delete courses" });
    }

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });

    const isInstructor = course.instructorId.some(
      (instId) => instId.toString() === req.userId.toString()
    );
    if (!isInstructor && req.userRole !== "admin") {
      return res.status(403).json({ error: "Not authorized to delete this course" });
    }

    await Course.findByIdAndDelete(id);
    res.json({ message: "Course deleted successfully" });

  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ error: "Failed to delete course" });
  }
};

const enrollStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.body.userId;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    
    if (course.enrolled >= course.capacity) return res.status(400).json({ error: "Course is full" });
    
    const student = await User.findById(userId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    if (student.courses.includes(id)) return res.status(400).json({ error: "Already enrolled in this course" });
    student.courses.push(id);
    await student.save();
    course.enrolled = (course.enrolled || 0) + 1;
    await course.save();

    res.json({ success: true, message: "Enrolled successfully" });
  } catch (error) {
    console.error("Error enrolling student:", error);
    res.status(500).json({ error: "Failed to enroll student" });
  }
};

const unenrollStudent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId || req.body.userId;

    const course = await Course.findById(id);
    if (!course) return res.status(404).json({ error: "Course not found" });
    
    const student = await User.findById(userId);
    if (!student) return res.status(404).json({ error: "Student not found" });
  
    student.courses = student.courses.filter((courseId) => courseId !== id);
    await student.save();

    if (course.enrolled > 0) {
      course.enrolled -= 1;
      await course.save();
    }

    res.json({ success: true, message: "Unenrolled successfully" });
  } catch (error) {
    console.error("Error unenrolling student:", error);
    res.status(500).json({ error: "Failed to unenroll student" });
  }
};

const getEnrolledCourses = async (req, res) => {
  try {
    const { userId } = req.query;
    if (!userId) return res.status(400).json({ error: "userId is required" });
    
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });
    
    const courses = await Course.find({ _id: { $in: user.courses } }).populate(
      "instructorId",
      "name email"
    );

    res.json(courses);
  } catch (error) {
    console.error("Error fetching enrolled courses:", error);
    res.status(500).json({ error: "Failed to fetch enrolled courses" });
  }
};

module.exports = {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  enrollStudent,
  unenrollStudent,
  getEnrolledCourses
};