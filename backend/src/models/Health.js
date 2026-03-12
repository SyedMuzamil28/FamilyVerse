const mongoose = require("mongoose");

const MedicineSchema = new mongoose.Schema({
  familyCode: { type: String, required: true },
  name: { type: String, required: true },
  time: { type: String, required: true },
  member: { type: String, required: true },
  taken: { type: Boolean, default: false },
  color: { type: String, default: "#F59E0B" },
  takenAt: { type: Date },
}, { timestamps: true });

const HealthLogSchema = new mongoose.Schema({
  familyCode: { type: String, required: true },
  member: { type: String, required: true },
  text: { type: String, required: true },
  category: { type: String, default: "general" },
  reportUrl: { type: String },
  aiAnalysis: { type: String },
  bloodSugar: { type: Number },
  bloodPressure: { type: String },
  date: { type: Date, default: Date.now },
}, { timestamps: true });

const AppointmentSchema = new mongoose.Schema({
  familyCode: { type: String, required: true },
  member: { type: String, required: true },
  doctorName: { type: String, required: true },
  specialty: { type: String },
  date: { type: String, required: true },
  notes: { type: String },
}, { timestamps: true });

module.exports = {
  Medicine: mongoose.model("Medicine", MedicineSchema),
  HealthLog: mongoose.model("HealthLog", HealthLogSchema),
  Appointment: mongoose.model("Appointment", AppointmentSchema),
};
