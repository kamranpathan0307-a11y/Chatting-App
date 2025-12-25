const Message = require("../models/Message");
const Chat = require("../models/Chat");

// Get messages for a chat
exports.getMessages = async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Verify user is a member of the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Check if user is a member (handle both ObjectId and string comparison)
    const isMember = chat.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await Message.find({ chatId })
      .populate("senderId", "name email avatar")
      .populate("chatId")
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Create a new message
exports.createMessage = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;
    const { chatId, text, messageType = "text", fileUrl } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!chatId || !text) {
      return res.status(400).json({ message: "Chat ID and text required" });
    }

    // Verify user is a member of the chat
    const chat = await Chat.findById(chatId);
    
    if (!chat) {
      return res.status(404).json({ message: "Chat not found" });
    }
    
    // Check if user is a member (handle both ObjectId and string comparison)
    const isMember = chat.members.some(
      (memberId) => memberId.toString() === userId.toString()
    );
    
    if (!isMember) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Create message
    const message = new Message({
      chatId,
      senderId: userId,
      text,
      messageType,
      fileUrl,
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = message._id;
    await chat.save();

    // Populate before sending
    await message.populate("senderId", "name email avatar");
    await message.populate("chatId");

    res.status(201).json(message);
  } catch (error) {
    console.error("Error creating message:", error);
    res.status(500).json({ message: "Server error" });
  }
};

