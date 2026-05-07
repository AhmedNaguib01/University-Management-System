const Message = require("../models/Message");
const Chat = require("../models/Chat");

const isValidObjectId = (id) => {
  if (!id) return false;
  const str = String(id);
  return /^[a-fA-F0-9]{24}$/.test(str);
};

const getMessages = async (req, res) => {
  try {
    const { chatId } = req.query;

    if (!chatId) {
      return res.status(400).json({ error: "chatId is required" });
    }

    if (!isValidObjectId(chatId)) {
      return res.status(400).json({ error: "Invalid chatId format" });
    }

    const chat = await Chat.findById(chatId);
    if (!chat) {
      return res.status(404).json({ error: "Chat not found" });
    }

    if (
      chat.user1.id.toString() !== req.userId &&
      chat.user2.id.toString() !== req.userId
    ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const messages = await Message.find({
      $or: [
        { senderId: chat.user1.id, receiverId: chat.user2.id },
        { senderId: chat.user2.id, receiverId: chat.user1.id },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (error) {
    console.error("Get messages error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createMessage = async (req, res) => {
  try {
    const { chatId, receiverId, text, attachmentsId, replyTo } = req.body;
    const senderId = req.userId;

    if (!receiverId || !text) {
      return res
        .status(400)
        .json({ error: "receiverId and text are required" });
    }

    const message = new Message({
      senderId,
      receiverId,
      text,
      attachmentsId: attachmentsId || [],
      replyTo: replyTo || null,
    });

    await message.save();

    const User = require("../models/User");
    const [sender, receiver] = await Promise.all([
      User.findById(senderId),
      User.findById(receiverId),
    ]);

    let chat;
    if (chatId) {
      chat = await Chat.findByIdAndUpdate(
        chatId,
        {
          lastMessage: text.substring(0, 100),
          updatedAt: new Date(),
        },
        { new: true }
      );
    } else {
      const existingChat = await Chat.findOne({
        $or: [
          { "user1.id": senderId, "user2.id": receiverId },
          { "user1.id": receiverId, "user2.id": senderId },
        ],
      });

      if (existingChat) {
        chat = await Chat.findByIdAndUpdate(
          existingChat._id,
          {
            lastMessage: text.substring(0, 100),
            updatedAt: new Date(),
          },
          { new: true }
        );
      } else {
        chat = new Chat({
          user1: {
            id: sender._id,
            name: sender.name,
            image: sender.image || {},
          },
          user2: {
            id: receiver._id,
            name: receiver.name,
            image: receiver.image || {},
          },
          lastMessage: text.substring(0, 100),
        });
        await chat.save();
      }
    }

    res.status(201).json(message);
  } catch (error) {
    console.error("Create message error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    const message = await Message.findById(id);

    if (!message) {
      return res.status(404).json({ error: "Message not found" });
    }

    if (message.senderId.toString() !== userId) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this message" });
    }

    await Message.findByIdAndDelete(id);
    res.json({ success: true, message: "Message deleted successfully" });
  } catch (error) {
    console.error("Delete message error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  getMessages,
  createMessage,
  deleteMessage,
};
