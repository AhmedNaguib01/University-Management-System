const express = require("express");
const router = express.Router();
const postController = require("../services/post");
const { auth } = require("../middleware/auth");

router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.post("/", auth, postController.createPost);
router.put("/:id", auth, postController.updatePost);
router.delete("/:id", auth, postController.deletePost);

module.exports = router;
