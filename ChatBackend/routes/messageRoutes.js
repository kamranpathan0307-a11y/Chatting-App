const express = require("express");
const router = express.Router();
const messageController = require("../controllers/messageController");
const auth = require("../middleware/auth");

router.get("/:chatId", auth, messageController.getMessages);
router.post("/", auth, messageController.createMessage);

module.exports = router;

