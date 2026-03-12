const express = require("express");
const axios = require("axios");
const HealthLog = require("../models/HealthLog");
const Medicine = require("../models/Medicine");
const auth = require("../middleware/auth");
const router = express.Router();

// GET all medicines for family
router.get("/medicines", auth, async (req, res) => {
  try {
    const meds = await Medicine.find({ familyId: req.user.familyId }).sort({ createdAt: -1 });
    res.json(meds);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADD medicine
router.post("/medicines", auth, async (req, res) => {
  try {
    const med = new Medicine({ ...req.body, familyId: req.user.familyId, memberId: req.user._id });
    await med.save();
    res.json(med);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// MARK medicine taken
router.patch("/medicines/:id/taken", auth, async (req, res) => {
  try {
    const med = await Medicine.findByIdAndUpdate(req.params.id, { taken: true, takenAt: new Date() }, { new: true });
    res.json(med);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// DELETE medicine
router.delete("/medicines/:id", auth, async (req, res) => {
  try {
    await Medicine.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET health logs
router.get("/logs", auth, async (req, res) => {
  try {
    const logs = await HealthLog.find({ familyId: req.user.familyId }).sort({ createdAt: -1 }).limit(50);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ADD health log
router.post("/logs", auth, async (req, res) => {
  try {
    const log = new HealthLog({ ...req.body, familyId: req.user.familyId, userId: req.user._id });
    await log.save();
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// AI HEALTH ANALYSIS
router.post("/analyze", auth, async (req, res) => {
  try {
    const { measurements, symptoms, member, reportText } = req.body;
    if (!process.env.ANTHROPIC_API_KEY) return res.status(400).json({ error: "AI not configured" });

    const prompt = `You are a compassionate family health assistant. A family member named ${member} has shared the following health information:

${measurements?.bloodPressure ? `Blood Pressure: ${measurements.bloodPressure}` : ""}
${measurements?.bloodSugar ? `Blood Sugar: ${measurements.bloodSugar} mg/dL` : ""}
${measurements?.weight ? `Weight: ${measurements.weight}` : ""}
${measurements?.heartRate ? `Heart Rate: ${measurements.heartRate} bpm` : ""}
${symptoms ? `Symptoms/Notes: ${symptoms}` : ""}
${reportText ? `Health Report Details: ${reportText}` : ""}

Please provide:
1. A brief friendly analysis of these health readings
2. Whether the values are in normal range
3. Simple lifestyle recommendations
4. When they should see a doctor
5. Any immediate concerns

Keep it simple, warm, and easy to understand for a family. Use emojis. Do NOT replace a real doctor.`;

    const response = await axios.post("https://api.anthropic.com/v1/messages", {
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      messages: [{ role: "user", content: prompt }]
    }, {
      headers: { "x-api-key": process.env.ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "content-type": "application/json" }
    });

    const analysis = response.data.content[0].text;
    if (req.body.saveLog) {
      const log = new HealthLog({ familyId: req.user.familyId, userId: req.user._id, member, type: "measurement", content: symptoms || "", measurements: measurements || {}, aiAnalysis: analysis });
      await log.save();
    }
    res.json({ analysis });
  } catch (err) {
    res.status(500).json({ error: "AI analysis failed: " + err.message });
  }
});

module.exports = router;
