const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const Family = require("../models/Family");
const auth = require("../middleware/auth");
const router = express.Router();

const genInviteCode = () => "FAM-" + Math.random().toString(36).substring(2,5).toUpperCase() + Math.random().toString(36).substring(2,4).toUpperCase();
const genToken = (userId) => jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: "30d" });
const ROLE_EMOJI = { Father:"👨‍💼",Mother:"👩‍🦱",Son:"👦",Daughter:"👧",Brother:"👦",Sister:"👧",Grandfather:"👴",Grandmother:"👵",Uncle:"👨",Aunt:"👩",Other:"👤" };

// REGISTER + CREATE FAMILY
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, role, city, familyName } = req.body;
    if (!name || !email || !password || !familyName) return res.status(400).json({ error: "All fields required" });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const inviteCode = genInviteCode();
    const family = new Family({ name: familyName, inviteCode, city: city || "" });
    await family.save();

    const user = new User({ name, email, password, role: role || "Other", emoji: ROLE_EMOJI[role] || "👤", city: city || "", familyId: family._id });
    await user.save();

    family.createdBy = user._id;
    family.members = [user._id];
    await family.save();

    const token = genToken(user._id);
    res.json({ token, user, family });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// JOIN FAMILY
router.post("/join", async (req, res) => {
  try {
    const { name, email, password, role, inviteCode } = req.body;
    if (!name || !email || !password || !inviteCode) return res.status(400).json({ error: "All fields required" });

    const family = await Family.findOne({ inviteCode: inviteCode.trim().toUpperCase() });
    if (!family) return res.status(404).json({ error: "Family not found! Check the invite code." });

    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ error: "Email already registered" });

    const user = new User({ name, email, password, role: role || "Other", emoji: ROLE_EMOJI[role] || "👤", familyId: family._id });
    await user.save();

    family.members.push(user._id);
    await family.save();

    const token = genToken(user._id);
    const populatedFamily = await Family.findById(family._id).populate("members", "-password");
    res.json({ token, user, family: populatedFamily });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "No account found with this email" });
    const valid = await user.comparePassword(password);
    if (!valid) return res.status(400).json({ error: "Incorrect password" });
    const family = await Family.findById(user.familyId).populate("members", "-password");
    const token = genToken(user._id);
    user.online = true;
    await user.save();
    res.json({ token, user, family });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ME
router.get("/me", auth, async (req, res) => {
  try {
    const family = await Family.findById(req.user.familyId).populate("members", "-password");
    res.json({ user: req.user, family });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// UPDATE MOOD
router.patch("/mood", auth, async (req, res) => {
  try {
    req.user.mood = req.body.mood;
    await req.user.save();
    res.json({ mood: req.user.mood });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
