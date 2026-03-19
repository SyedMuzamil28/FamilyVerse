const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Medicine, HealthLog, Appointment } = require("../models/Health");

const auth = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("No token");
  return jwt.verify(token, process.env.JWT_SECRET || "secret123");
};

// ── MEDICINES ──────────────────────────────────────────────────────────────
router.get("/medicines", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    const medicines = await Medicine.find({ familyCode }).sort({ createdAt: -1 });
    res.json(medicines);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/medicines", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    const med = new Medicine({ familyCode, ...req.body });
    await med.save();
    res.json(med);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.patch("/medicines/:id/taken", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    const med = await Medicine.findOneAndUpdate(
      { _id: req.params.id, familyCode },
      { taken: true, takenAt: new Date() },
      { new: true }
    );
    res.json(med);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/medicines/:id", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    await Medicine.deleteOne({ _id: req.params.id, familyCode });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── HEALTH LOGS ────────────────────────────────────────────────────────────
router.get("/logs", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    const logs = await HealthLog.find({ familyCode }).sort({ date: -1 }).limit(50);
    res.json(logs);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/logs", async (req, res) => {
  try {
    const { familyCode, memberName } = auth(req);
    const log = new HealthLog({ familyCode, member: memberName, ...req.body });
    await log.save();

    // Auto AI analysis
    if (req.body.bloodSugar || req.body.bloodPressure || req.body.text) {
      try {
        const analysis = await getAIHealthAdvice({
          bloodSugar: req.body.bloodSugar,
          bloodPressure: req.body.bloodPressure,
          note: req.body.text,
          member: memberName,
        });
        log.aiAnalysis = analysis;
        await log.save();
      } catch (e) { console.log("AI analysis skipped:", e.message); }
    }
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── REPORT UPLOAD + AI ANALYSIS ────────────────────────────────────────────
// Accepts base64 PDF or image, sends to Claude for analysis
router.post("/analyze-report", async (req, res) => {
  try {
    const { familyCode, memberName } = auth(req);
    const { fileData, fileType, fileName, note } = req.body;

    if (!fileData) return res.status(400).json({ error: "No file data provided" });

    console.log(`📄 Analyzing report for ${memberName}: ${fileName}`);

    // Send to Claude API with the document
    let analysis;
    try {
      const messages = [{
        role: "user",
        content: [
          {
            type: fileType === "application/pdf" ? "document" : "image",
            source: {
              type: "base64",
              media_type: fileType,
              data: fileData,
            },
          },
          {
            type: "text",
            text: `You are a caring family health assistant. Please analyze this medical report for ${memberName}.

${note ? `Additional note from patient: ${note}` : ""}

Please provide:
1. **Summary**: What this report shows in simple language (2-3 sentences)
2. **Key Values**: List important values and whether they are Normal ✅, Low ⚠️, or High ⚠️
3. **What This Means**: Explain in simple words what the results mean for their health
4. **Recommendations**: 2-3 practical suggestions
5. **Should See Doctor?**: Yes/No and why

Keep the language simple and caring — this is for a family app. Use emojis to make it friendly. Be reassuring where values are normal.`,
          },
        ],
      }];

      const response = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages,
        },
        {
          headers: {
            "x-api-key": process.env.ANTHROPIC_API_KEY,
            "anthropic-version": "2023-06-01",
            "anthropic-beta": "pdfs-2024-09-25",
            "Content-Type": "application/json",
          },
        }
      );
      analysis = response.data.content[0].text;
    } catch (e) {
      console.error("Claude API error:", e.response?.data || e.message);
      analysis = "AI analysis unavailable. Please check your ANTHROPIC_API_KEY in Railway settings.";
    }

    // Save to health log
    const log = new HealthLog({
      familyCode,
      member: memberName,
      text: `📄 Report: ${fileName}${note ? ` — ${note}` : ""}`,
      aiAnalysis: analysis,
      category: "report",
      date: new Date(),
    });
    await log.save();

    res.json({ analysis, logId: log._id });
  } catch (err) {
    console.error("Report analysis error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── AI HEALTH ADVICE ───────────────────────────────────────────────────────
async function getAIHealthAdvice(data) {
  const prompt = `You are a caring family health assistant. Be warm, simple, and helpful.

Patient: ${data.member}
${data.bloodSugar ? `Blood Sugar: ${data.bloodSugar} mg/dL` : ""}
${data.bloodPressure ? `Blood Pressure: ${data.bloodPressure}` : ""}
${data.note ? `Health Note: ${data.note}` : ""}

Give brief, practical health advice in 2-3 sentences. Be caring and specific.
If values are normal, reassure them. If concerning, advise them to see a doctor.
Keep it simple and warm — this is for a family app.`;

  const response = await axios.post(
    "https://api.anthropic.com/v1/messages",
    {
      model: "claude-sonnet-4-20250514",
      max_tokens: 300,
      messages: [{ role: "user", content: prompt }],
    },
    {
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
    }
  );
  return response.data.content[0].text;
}

router.post("/ai-advice", async (req, res) => {
  try {
    auth(req);
    const advice = await getAIHealthAdvice(req.body);
    res.json({ advice });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── APPOINTMENTS ───────────────────────────────────────────────────────────
router.get("/appointments", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    const apts = await Appointment.find({ familyCode }).sort({ createdAt: -1 });
    res.json(apts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post("/appointments", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    const apt = new Appointment({ familyCode, ...req.body });
    await apt.save();
    res.json(apt);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.delete("/appointments/:id", async (req, res) => {
  try {
    const { familyCode } = auth(req);
    await Appointment.deleteOne({ _id: req.params.id, familyCode });
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
