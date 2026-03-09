const mongoose = require("mongoose");

const memorySchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: "Family", required: true },
  title: { type: String, required: true },
  emoji: { type: String, default: "⭐" },
  type: { type: String, enum: ["note","photo","voice","capsule"], default: "note" },
  content: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  locked: { type: Boolean, default: false },
  lockedUntil: { type: String, default: null },
  hearts: { type: Number, default: 0 },
  likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  addedBy: { type: String, default: "" },
  addedById: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

module.exports = mongoose.model("Memory", memorySchema);
