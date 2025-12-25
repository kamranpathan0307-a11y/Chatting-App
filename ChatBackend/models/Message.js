const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    chatId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chat",
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    text: String,
    fileUrl: String,
    messageType: {
      type: String,
      enum: ["text", "image", "video"],
      default: "text",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
