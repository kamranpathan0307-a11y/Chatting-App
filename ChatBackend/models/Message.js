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
    messageType: {
      type: String,
      enum: ["text", "image", "video", "audio", "document"],
      default: "text",
    },
    // Media-specific fields
    mediaUrl: String,
    thumbnailUrl: String,
    fileName: String,
    fileSize: Number,
    mimeType: String,
    duration: Number, // For audio/video in seconds
    width: Number, // For images/videos
    height: Number, // For images/videos
    // Upload status tracking
    uploadStatus: {
      type: String,
      enum: ["uploading", "uploaded", "failed"],
      default: "uploaded",
    },
    uploadProgress: {
      type: Number,
      default: 100,
      min: 0,
      max: 100,
    },
    // Message delivery status
    deliveryStatus: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Message", messageSchema);
