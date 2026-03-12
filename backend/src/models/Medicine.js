const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: "Family", required: true },
  name: { type: String, required: true },
  time: { type: String, required: true },
  member: { type: String, required: true },
  memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  taken: { type: Boolean, default: false },
  takenAt: { type: Date },
  color: { type: String, default: "#4A90D9" },
  notes: { type: String, default: "" },
  frequency: { type: String, default: "daily" },
}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);
