const mongoose = require("mongoose");

const healthLogSchema = new mongoose.Schema({
  familyId: { type: mongoose.Schema.Types.ObjectId, ref: "Family", required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  member: { type: String, required: true },
  type: { type: String, enum: ["note","report","measurement","appointment"], default: "note" },
  title: { type: String, default: "" },
  content: { type: String, default: "" },
  fileUrl: { type: String, default: "" },
  measurements: {
    bloodPressure: { type: String, default: "" },
    bloodSugar: { type: String, default: "" },
    weight: { type: String, default: "" },
    temperature: { type: String, default: "" },
    heartRate: { type: String, default: "" },
  },
  aiAnalysis: { type: String, default: "" },
}, { timestamps: true });

module.exports = mongoose.model("HealthLog", healthLogSchema);
