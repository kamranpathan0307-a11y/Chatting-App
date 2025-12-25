const Chat = require("../models/Chat");
const Message = require("../models/Message");

// Get all chats for the current user
exports.getChats = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const chats = await Chat.find({
      members: userId,
    })
      .populate("members", "name email avatar")
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get or create a chat between two users
exports.getOrCreateChat = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { otherUserId } = req.body;

    if (!userId || !otherUserId) {
      return res.status(400).json({ message: "User IDs required" });
    }

    // Check if chat already exists (one-on-one chat with exactly 2 members)
    let chat = await Chat.findOne({
      $and: [
        { members: { $all: [userId, otherUserId] } },
        { members: { $size: 2 } }
      ]
    })
      .populate("members", "name email avatar")
      .populate("lastMessage");

    if (!chat) {
      // Create new chat
      chat = new Chat({
        members: [userId, otherUserId],
      });
      await chat.save();
      await chat.populate("members", "name email avatar");
    }

    res.status(200).json(chat);
  } catch (error) {
    console.error("Error getting/creating chat:", error);
    res.status(500).json({ message: "Server error" });
  }
};

