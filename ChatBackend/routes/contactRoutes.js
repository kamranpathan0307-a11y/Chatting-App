const express = require("express");
const router = express.Router();
const contactController = require("../controllers/contactController");
const auth = require("../middleware/auth");

router.post("/check", auth, contactController.checkPhoneNumbers);

module.exports = router;

