const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chatController");
const auth = require("../middleware/auth");

router.get("/", auth, chatController.getChats);
router.post("/", auth, chatController.getOrCreateChat);
router.post("/by-phone", auth, chatController.getOrCreateChatByPhone);

module.exports = router;

