const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const fileCleanupService = require("./services/fileCleanupService");
require("dotenv").config();

const app = express();
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Routes
const authRoutes = require("./routes/authRoutes");
const chatRoutes = require("./routes/chatRoutes");
const messageRoutes = require("./routes/messageRoutes");
const contactRoutes = require("./routes/contactRoutes");
const mediaRoutes = require("./routes/mediaRoutes");

app.use("/api/auth", authRoutes);
app.use("/api/chats", chatRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/contacts", contactRoutes);
app.use("/api/media", mediaRoutes);

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  transports: ["websocket", "polling"]
});

// Socket.IO authentication middleware
io.use((socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) {
      console.log("No token provided in socket connection");
      return next(new Error("Authentication error: No token provided"));
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    console.log("Socket authenticated for user:", decoded.userId);
    next();
  } catch (err) {
    console.error("Socket authentication error:", err.message);
    next(new Error("Authentication error: Invalid token"));
  }
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id, "User ID:", socket.userId);

  socket.on("joinChat", (chatId) => {
    socket.join(chatId);
    console.log("User joined chat:", chatId);
  });

  socket.on("leaveChat", (chatId) => {
    socket.leave(chatId);
    console.log("User left chat:", chatId);
  });

  socket.on("sendMessage", (data) => {
    io.to(data.chatId).emit("receiveMessage", data);
  });

  // Media upload progress events
  socket.on("mediaUploadProgress", (data) => {
    // Broadcast upload progress to chat participants
    socket.to(data.chatId).emit("mediaUploadProgress", {
      messageId: data.messageId,
      uploadId: data.uploadId,
      progress: data.progress,
      senderId: socket.userId,
    });
  });

  socket.on("mediaUploadComplete", (data) => {
    // Broadcast upload completion to chat participants
    io.to(data.chatId).emit("mediaUploadComplete", {
      messageId: data.messageId,
      uploadId: data.uploadId,
      mediaUrl: data.mediaUrl,
      senderId: socket.userId,
    });
  });

  socket.on("mediaUploadFailed", (data) => {
    // Broadcast upload failure to chat participants
    socket.to(data.chatId).emit("mediaUploadFailed", {
      messageId: data.messageId,
      uploadId: data.uploadId,
      error: data.error,
      senderId: socket.userId,
    });
  });

  // Media message delivery status updates
  socket.on("updateMessageStatus", (data) => {
    // Update message delivery status (sent, delivered, read)
    socket.to(data.chatId).emit("messageStatusUpdate", {
      messageId: data.messageId,
      status: data.status,
      timestamp: Date.now(),
    });
  });

  // Typing indicators for media composition
  socket.on("mediaComposing", (data) => {
    // Notify others that user is composing media (e.g., recording audio, taking photo)
    socket.to(data.chatId).emit("userMediaComposing", {
      userId: socket.userId,
      mediaType: data.mediaType, // 'photo', 'video', 'audio', 'document'
      action: data.action, // 'start', 'stop'
    });
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.log(err));

app.get("/", (req, res) => {
  res.send("Chat backend running");
});

const PORT = 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Initialize file cleanup service
  console.log("File cleanup service initialized");
  
  // Log cleanup stats periodically
  setInterval(() => {
    const stats = fileCleanupService.getCleanupStats();
    if (stats.totalTempFiles > 0 || stats.totalProcessingFiles > 0) {
      console.log("Cleanup stats:", stats);
    }
  }, 5 * 60 * 1000); // Every 5 minutes
});
