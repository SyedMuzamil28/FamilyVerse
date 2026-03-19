const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema({
  familyCode: { type: String, required: true },
  chatId: { type: String, required: true, default: "group" },
  sender: { type: String, required: true },
  senderEmoji: { type: String, default: "👤" },
  text: { type: String },
  type: { type: String, default: "text" },
  imageUrl: { type: String },
  read: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now },
});

MessageSchema.index({ familyCode: 1, chatId: 1 });
module.exports = mongoose.model("Message", MessageSchema);
