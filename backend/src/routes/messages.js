const express = require("express");
const Message = require("../models/Message");
const auth = require("../middleware/auth");
const router = express.Router();

// GET family group messages
router.get("/family", auth, async (req, res) => {
  try {
    const messages = await Message.find({ familyId: req.user.familyId, isPrivate: false })
      .sort({ createdAt: -1 }).limit(100).lean();
    res.json(messages.reverse());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET private messages between two users
router.get("/private/:userId", auth, async (req, res) => {
  try {
    const messages = await Message.find({
      familyId: req.user.familyId, isPrivate: true,
      $or: [
        { sender: req.user._id, to: req.params.userId },
        { sender: req.params.userId, to: req.user._id }
      ]
    }).sort({ createdAt: -1 }).limit(100).lean();
    res.json(messages.reverse());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// SEND message (REST fallback)
router.post("/", auth, async (req, res) => {
  try {
    const { text, to, isPrivate, type, fileUrl } = req.body;
    const msg = new Message({
      familyId: req.user.familyId,
      sender: req.user._id,
      senderName: req.user.name,
      senderEmoji: req.user.emoji,
      text, to: to || null, isPrivate: !!to,
      type: type || "text", fileUrl: fileUrl || "",
      readBy: [req.user._id]
    });
    await msg.save();
    res.json(msg);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
