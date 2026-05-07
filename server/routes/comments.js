const express = require("express");
const router = express.Router();
const commentController = require("../services/comment");
const { auth } = require("../middleware/auth");

router.get("/", commentController.getComments);
router.post("/", auth, commentController.createComment);
router.delete("/:id", auth, commentController.deleteComment);

module.exports = router;
