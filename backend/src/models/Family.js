const mongoose = require("mongoose");

const MemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  role: { type: String, required: true },
  emoji: { type: String, default: "👤" },
  password: { type: String, required: true },
  mood: { type: String, default: "happy" },
  online: { type: Boolean, default: false },
  lastSeen: { type: Date, default: Date.now },
  socketId: { type: String, default: null },
}, { timestamps: true });

const FamilySchema = new mongoose.Schema({
  familyName: { type: String, required: true },
  inviteCode: { type: String, required: true, unique: true },
  city: { type: String, default: "Hyderabad" },
  members: [MemberSchema],
}, { timestamps: true });

module.exports = mongoose.model("Family", FamilySchema);
