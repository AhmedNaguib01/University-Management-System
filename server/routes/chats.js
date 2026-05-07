const express = require("express");
const router = express.Router();
const {getAllChats, getChatById, createChat,} = require("../services/chat");
const { auth } = require("../middleware/auth");

router.get("/", auth, getAllChats);
router.get("/:id", auth, getChatById);
router.post("/", auth, createChat);

module.exports = router;
