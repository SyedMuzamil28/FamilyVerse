const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: "Family", required: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String },
  senderEmoji: { type: String, default: "👤" },
  text: { type: String, default: "" },
  type: { type: String, enum: ["text","image","voice","system"], default: "text" },
  fileUrl: { type: String, default: "" },
  to: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  isPrivate: { type: Boolean, default: false },
  readBy: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  replyTo: { type: mongoose.Schema.Types.ObjectId, ref: "Message", default: null },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);
