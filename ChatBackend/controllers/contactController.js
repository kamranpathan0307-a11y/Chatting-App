const User = require("../models/User");

// Check which phone numbers are registered users
exports.checkPhoneNumbers = async (req, res) => {
  try {
    const { phoneNumbers } = req.body;
    const userId = req.user?.id || req.user?._id;

    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!phoneNumbers || !Array.isArray(phoneNumbers)) {
      return res.status(400).json({ message: "Phone numbers array required" });
    }

    // Normalize phone numbers (remove spaces, dashes, etc.)
    const normalizePhone = (phone) => {
      return phone.replace(/[\s\-\(\)\+]/g, "").replace(/^0+/, "");
    };

    const normalizedNumbers = phoneNumbers.map(normalizePhone).filter(n => n.length > 0);

    // Get all users (we'll match manually to handle different phone formats)
    const allUsers = await User.find({
      phone: { $exists: true, $ne: null, $ne: "" },
      _id: { $ne: userId }, // Exclude current user
    }).select("_id name email phone avatar");

    // Create a map of normalized phone -> user
    const phoneToUserMap = {};
    allUsers.forEach((user) => {
      const normalized = normalizePhone(user.phone || "");
      if (normalized && normalized.length > 0) {
        // Store multiple variations for better matching
        phoneToUserMap[normalized] = {
          _id: user._id,
          name: user.name,
          email: user.email,
          phone: user.phone,
          avatar: user.avatar,
        };
      }
    });

    // Separate registered and non-registered contacts
    const registered = [];
    const nonRegistered = [];

    // Match original phone numbers with normalized ones
    phoneNumbers.forEach((originalPhone) => {
      const normalized = normalizePhone(originalPhone);
      
      // Try to find match (exact or partial)
      let matchedUser = null;
      for (const [normalizedPhone, user] of Object.entries(phoneToUserMap)) {
        // Check if normalized numbers match (handle different formats)
        if (normalized === normalizedPhone || 
            normalized.endsWith(normalizedPhone) || 
            normalizedPhone.endsWith(normalized)) {
          matchedUser = user;
          break;
        }
      }
      
      if (matchedUser) {
        registered.push({
          phone: originalPhone,
          user: matchedUser,
        });
      } else {
        nonRegistered.push({
          phone: originalPhone,
        });
      }
    });

    res.status(200).json({
      registered,
      nonRegistered,
    });
  } catch (error) {
    console.error("Error checking phone numbers:", error);
    res.status(500).json({ message: "Server error" });
  }
};

