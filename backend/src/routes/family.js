const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Family = require("../models/Family");

const ROLE_EMOJI = {
  Father:"👨‍💼",Mother:"👩‍🦱",Son:"👦",Daughter:"👧",
  Brother:"👦",Sister:"👧",Grandfather:"👴",Grandmother:"👵",
  Uncle:"👨",Aunt:"👩",Other:"👤"
};

const genCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "FAM-";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

// Create family
router.post("/create", async (req, res) => {
  try {
    const { familyName, userName, role, password, city } = req.body;
    if (!familyName || !userName || !password) 
      return res.status(400).json({ error: "Missing fields" });

    let inviteCode;
    let exists = true;
    while (exists) {
      inviteCode = genCode();
      exists = await Family.findOne({ inviteCode });
    }

    const hashedPw = await bcrypt.hash(password, 10);
    const member = {
      name: userName, role, emoji: ROLE_EMOJI[role] || "👤",
      password: hashedPw, mood: "happy", online: true,
    };

    const family = new Family({ 
      familyName, inviteCode, city: city || "Hyderabad", members: [member] 
    });
    await family.save();

    const me = family.members[0];
    const token = jwt.sign(
      { familyCode: inviteCode, memberId: me._id.toString(), memberName: userName },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "30d" }
    );

    res.json({
      token,
      family: { familyName, inviteCode, city: family.city },
      member: { id: me._id, name: me.name, role: me.role, emoji: me.emoji, mood: me.mood },
    });
  } catch (err) {
    console.error("Create family error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Join family
router.post("/join", async (req, res) => {
  try {
    const { inviteCode, userName, role, password } = req.body;
    if (!inviteCode || !userName || !password) 
      return res.status(400).json({ error: "Missing fields" });

    const family = await Family.findOne({ inviteCode: inviteCode.toUpperCase().trim() });
    if (!family) return res.status(404).json({ error: "Family not found! Check the invite code." });

    const existingMember = family.members.find(
      m => m.name.toLowerCase() === userName.toLowerCase()
    );
    
    if (existingMember) {
      const valid = await bcrypt.compare(password, existingMember.password);
      if (!valid) return res.status(401).json({ error: "Wrong password!" });
      const token = jwt.sign(
        { familyCode: inviteCode, memberId: existingMember._id.toString(), memberName: userName },
        process.env.JWT_SECRET || "secret123",
        { expiresIn: "30d" }
      );
      return res.json({
        token,
        family: { familyName: family.familyName, inviteCode: family.inviteCode, city: family.city },
        member: { id: existingMember._id, name: existingMember.name, role: existingMember.role, emoji: existingMember.emoji, mood: existingMember.mood },
      });
    }

    const hashedPw = await bcrypt.hash(password, 10);
    const newMember = {
      name: userName, role, emoji: ROLE_EMOJI[role] || "👤",
      password: hashedPw, mood: "happy", online: true,
    };
    family.members.push(newMember);
    await family.save();

    const me = family.members[family.members.length - 1];
    const token = jwt.sign(
      { familyCode: family.inviteCode, memberId: me._id.toString(), memberName: userName },
      process.env.JWT_SECRET || "secret123",
      { expiresIn: "30d" }
    );

    res.json({
      token,
      family: { familyName: family.familyName, inviteCode: family.inviteCode, city: family.city },
      member: { id: me._id, name: me.name, role: me.role, emoji: me.emoji, mood: me.mood },
    });
  } catch (err) {
    console.error("Join family error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Get family members
router.get("/members", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ error: "No token" });
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const family = await Family.findOne({ inviteCode: decoded.familyCode });
    if (!family) return res.status(404).json({ error: "Family not found" });

    const members = family.members.map(m => ({
      id: m._id, name: m.name, role: m.role,
      emoji: m.emoji, mood: m.mood, online: m.online,
      lastSeen: m.lastSeen,
    }));

    res.json({ 
      members, 
      familyName: family.familyName, 
      inviteCode: family.inviteCode, 
      city: family.city 
    });
  } catch (err) {
    console.error("Get members error:", err);
    res.status(500).json({ error: err.message });
  }
});

// Update mood
router.post("/mood", async (req, res) => {
  try {
    const auth = req.headers.authorization;
    const token = auth.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
    const { mood } = req.body;
    await Family.updateOne(
      { inviteCode: decoded.familyCode, "members._id": decoded.memberId },
      { $set: { "members.$.mood": mood } }
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
