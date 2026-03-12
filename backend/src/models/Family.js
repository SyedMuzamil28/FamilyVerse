const mongoose = require("mongoose");

const familySchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  inviteCode: { type: String, required: true, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  city: { type: String, default: "" },
  happinessScore: { type: Number, default: 0 },
  avatar: { type: String, default: "🏠" },
}, { timestamps: true });

module.exports = mongoose.model("Family", familySchema);
