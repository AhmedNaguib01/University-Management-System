const Chat = require("../models/Chat");
const Message = require("../models/Message");
const User = require("../models/User");

const isValidObjectId = (id) => {
  if (!id) return false;
  const str = String(id);
  return /^[a-fA-F0-9]{24}$/.test(str);
};

const getAllChats = async (req, res) => {
  try {
    const userId = req.userId;
    
    if (!isValidObjectId(userId)) return res.status(400).json({ error: "Invalid user ID" });
    
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;
    const limitNum = Math.min(parseInt(limit), 100);

    const [chats, total] = await Promise.all([
      Chat.find({ $or: [{ "user1.id": userId }, { "user2.id": userId }],})
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Chat.countDocuments({$or: [{ "user1.id": userId }, { "user2.id": userId }], }),
    ]);

    const userIds = new Set();
    chats.forEach((chat) => {
      if (chat.user1?.id) userIds.add(chat.user1.id.toString());
      if (chat.user2?.id) userIds.add(chat.user2.id.toString());
    });

    const validUserIds = Array.from(userIds).filter(isValidObjectId);
    
    const users = validUserIds.length > 0 ? await User.find({ _id: { $in: validUserIds } }).select("_id name profilePicture").lean() : [];
    const userMap = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const updatedChats = chats.map((chat) => {
      const user1Data = userMap[chat.user1.id.toString()];
      const user2Data = userMap[chat.user2.id.toString()];
      return {
        ...chat,
        user1: {
          ...chat.user1,
          name: user1Data?.name || chat.user1.name,
          profilePicture: user1Data?.profilePicture,
        },
        user2: {
          ...chat.user2,
          name: user2Data?.name || chat.user2.name,
          profilePicture: user2Data?.profilePicture,
        },
      };
    });

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");

    res.json({
      chats: updatedChats,
      pagination: {
        page: parseInt(page),
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    console.error("Get all chats error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const getChatById = async (req, res) => {
  try {
    const chat = await Chat.findById(req.params.id).lean();
    if (!chat) return res.status(404).json({ error: "Chat not found" });
    
    if ( chat.user1.id.toString() !== req.userId && chat.user2.id.toString() !== req.userId ) {
      return res.status(403).json({ error: "Access denied" });
    }

    const [user1Data, user2Data] = await Promise.all([
      User.findById(chat.user1.id).select("_id name profilePicture").lean(),
      User.findById(chat.user2.id).select("_id name profilePicture").lean(),
    ]);

    const updatedChat = {
      ...chat,
      user1: {
        ...chat.user1,
        name: user1Data?.name || chat.user1.name,
        profilePicture: user1Data?.profilePicture,
      },
      user2: {
        ...chat.user2,
        name: user2Data?.name || chat.user2.name,
        profilePicture: user2Data?.profilePicture,
      },
    };

    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.json(updatedChat);
  } catch (error) {
    console.error("Get chat by ID error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

const createChat = async (req, res) => {
  try {
    const { user2Id } = req.body;
    const user1Id = req.userId;

    if (!user2Id) return res.status(400).json({ error: "user2Id is required" });
    if (!isValidObjectId(user1Id) || !isValidObjectId(user2Id)) return res.status(400).json({ error: "Invalid user ID format" });

    if (user1Id === user2Id) {
      return res
        .status(400)
        .json({ error: "Cannot create chat with yourself" });
    }

    const existingChat = await Chat.findOne({
      $or: [
        { "user1.id": user1Id, "user2.id": user2Id },
        { "user1.id": user2Id, "user2.id": user1Id },
      ],
    }).lean();

    if (existingChat) {
      const [user1Data, user2Data] = await Promise.all([
        User.findById(existingChat.user1.id)
          .select("_id name profilePicture")
          .lean(),
        User.findById(existingChat.user2.id)
          .select("_id name profilePicture")
          .lean(),
      ]);

      const updatedChat = {
        ...existingChat,
        user1: {
          ...existingChat.user1,
          name: user1Data?.name || existingChat.user1.name,
          profilePicture: user1Data?.profilePicture,
        },
        user2: {
          ...existingChat.user2,
          name: user2Data?.name || existingChat.user2.name,
          profilePicture: user2Data?.profilePicture,
        },
      };

      return res.json(updatedChat);
    }

    const user1 = await User.findById(user1Id);
    const user2 = await User.findById(user2Id);

    if (!user2) return res.status(404).json({ error: "User not found" });

    const chat = new Chat({
      user1: {
        id: user1._id,
        name: user1.name,
        image: user1.image || {},
      },
      user2: {
        id: user2._id,
        name: user2.name,
        image: user2.image || {},
      },
      lastMessage: "",
    });

    await chat.save();
    res.status(201).json(chat);
  } catch (error) {
    console.error("Create chat error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = { getAllChats, getChatById, createChat,};