const express = require("express");
const router = express.Router();
const multer = require("multer");
const { uploadFile, downloadFile, getFilesByCourse, deleteFile,} = require("../services/file");
const { auth } = require("../middleware/auth");

const storage = multer.memoryStorage();
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024, }, });

router.post("/", auth, upload.single("file"), uploadFile);
router.get("/course/:courseId", auth, getFilesByCourse);
router.get("/:id", downloadFile);
router.delete("/:id", auth, deleteFile);

module.exports = router;
