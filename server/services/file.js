const File = require("../models/File");

const uploadFile = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { courseId } = req.body;

    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(415).json({
        error:
          "Unsupported file type. Only images, PDFs, and Word documents are allowed",
      });
    }

    const maxSize = 10 * 1024 * 1024;
    if (req.file.size > maxSize)
      return res.status(413).json({ error: "File size exceeds 10MB limit" });

    let fileType = "image";
    if (req.file.mimetype === "application/pdf") {
      fileType = "pdf";
    } else if (
      req.file.mimetype === "application/msword" ||
      req.file.mimetype ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      fileType = "word";
    }

    const fileData = {
      fileName: req.file.originalname,
      fileType,
      fileData: req.file.buffer,
      fileSize: req.file.size,
    };

    // Only add courseId if it's provided and not empty
    if (courseId && courseId.trim() !== "") {
      fileData.courseId = courseId;
    }

    const file = new File(fileData);

    await file.save();

    res.status(201).json({
      _id: file._id,
      fileName: file.fileName,
      fileType: file.fileType,
      fileSize: file.fileSize,
      createdAt: file.createdAt,
    });
  } catch (error) {
    console.error("Upload file error:", error);
    res
      .status(500)
      .json({ error: "Server error during file upload: " + error.message });
  }
};

const downloadFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    let contentType = "application/octet-stream";
    if (file.fileType === "image") {
      contentType = "image/jpeg";
    } else if (file.fileType === "pdf") {
      contentType = "application/pdf";
    } else if (file.fileType === "word") {
      contentType =
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    }

    res.set({
      "Content-Type": contentType,
      "Content-Disposition": `attachment; filename="${file.fileName}"`,
    });

    res.send(file.fileData);
  } catch (error) {
    console.error("Download file error:", error);
    res.status(500).json({ error: "Server error during file download" });
  }
};

const getFilesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const files = await File.find({ courseId }).select(
      "_id fileName fileType fileSize createdAt"
    );

    const filesWithSize = files.map((file) => ({
      _id: file._id,
      fileName: file.fileName,
      fileType: file.fileType,
      createdAt: file.createdAt,
      fileSize: file.fileSize || 0,
    }));

    res.json(filesWithSize);
  } catch (error) {
    console.error("Get files by course error:", error);
    res.status(500).json({ error: "Server error fetching files" });
  }
};

const deleteFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);
    if (!file) return res.status(404).json({ error: "File not found" });

    if (req.userRole !== "instructor" && req.userRole !== "admin") {
      return res
        .status(403)
        .json({ error: "Only instructors can delete files" });
    }

    await File.findByIdAndDelete(req.params.id);

    res.json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete file error:", error);
    res.status(500).json({ error: "Server error during file deletion" });
  }
};

module.exports = {
  uploadFile,
  downloadFile,
  getFilesByCourse,
  deleteFile,
};
