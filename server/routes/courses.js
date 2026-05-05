const express = require("express");
const router = express.Router();
const courseController = require("../services/course");
const { auth } = require("../middleware/auth");

router.get("/", courseController.getAllCourses);
router.get("/enrolled", courseController.getEnrolledCourses);
router.get("/:id", courseController.getCourseById);
router.post("/", auth, courseController.createCourse);
router.put("/:id", auth, courseController.updateCourse);
router.delete("/:id", auth, courseController.deleteCourse);
router.post("/:id/enroll", auth, courseController.enrollStudent);
router.post("/:id/unenroll", auth, courseController.unenrollStudent);

module.exports = router;
