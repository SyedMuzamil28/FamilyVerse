const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const { Medicine, HealthLog } = require("../models/Health");

const auth = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("No token");
  return jwt.verify(token, process.env.JWT_SECRET || "secret123");
};

// ── AI HELPER — Uses Groq (FREE) ───────────────────────────────────────────
async function askAI(prompt) {
  // Try Groq first (FREE)
  if (process.env.GROQ_API_KEY) {
    try {
      const resp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.3-70b-versatile",
          max_tokens: 800,
          messages: [{ role: "user", content: prompt }],
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return resp.data.choices[0].message.content;
    } catch (e) {
      console.error("Groq error:", e.response?.data || e.message);
    }
  }

  // Fallback to Anthropic if key exists
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      const resp = await axios.post(
        "https://api.anthropic.com/v1/messages",
        {
          model: "claude-haiku-4-5-20251001",
          max_tokens: 800,
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
      return resp.data.content[0].text;
    } catch (e) {
      console.error("Anthropic error:", e.response?.data || e.message);
    }
  }

  throw new Error("No AI API key configured");
}

// ── AI for image/PDF reports using Groq vision ─────────────────────────────
async function analyzeReportWithAI(fileData, fileType, fileName, memberName, note) {
  // Groq supports vision for images
  if (process.env.GROQ_API_KEY && fileType.startsWith("image/")) {
    try {
      const resp = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.2-90b-vision-preview",
          max_tokens: 1000,
          messages: [{
            role: "user",
            content: [
              {
                type: "image_url",
                image_url: { url: `data:${fileType};base64,${fileData}` },
              },
              {
                type: "text",
                text: `You are a caring family health assistant analyzing a medical report for ${memberName}.
${note ? `Patient note: ${note}` : ""}

Please analyze this medical report and provide:
1. **Summary**: What this report shows (2-3 simple sentences)
2. **Key Values**: List values and mark as Normal ✅, Low ⚠️, or High ⚠️
3. **What This Means**: Simple explanation for the family
4. **Recommendations**: 2-3 practical suggestions
5. **See Doctor?**: Yes/No and why

Keep language simple and caring. Use emojis. Be reassuring where values are normal.
Disclaimer: Remind them to consult a real doctor for medical decisions.`,
              },
            ],
          }],
        },
        {
          headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      return resp.data.choices[0].message.content;
    } catch (e) {
      console.error("Groq vision error:", e.response?.data || e.message);
    }
  }

  // Fallback — text only analysis based on filename and note
  const fallbackPrompt = `You are a caring family health assistant.

A family member named ${memberName} uploaded a medical report called "${fileName}".
${note ? `They wrote: "${note}"` : ""}

Since I cannot read the actual file, please:
1. Ask them to describe the key values from the report
2. Explain what common tests in this type of report measure
3. Give general health advice
4. Remind them to share specific values with their doctor

Be warm, caring and helpful. Use emojis.`;

  return await askAI(fallbackPrompt);
}

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
        const prompt = `You are a caring family health assistant. Be warm and simple.
Patient: ${memberName}
${req.body.bloodSugar ? `Blood Sugar: ${req.body.bloodSugar} mg/dL` : ""}
${req.body.bloodPressure ? `Blood Pressure: ${req.body.bloodPressure}` : ""}
${req.body.text ? `Note: ${req.body.text}` : ""}
Give brief practical advice in 2-3 sentences. Be caring and specific. Use emojis.`;
        log.aiAnalysis = await askAI(prompt);
        await log.save();
      } catch (e) { console.log("AI skipped:", e.message); }
    }
    res.json(log);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── REPORT UPLOAD + AI ANALYSIS ────────────────────────────────────────────
router.post("/analyze-report", async (req, res) => {
  try {
    const { familyCode, memberName } = auth(req);
    const { fileData, fileType, fileName, note } = req.body;
    if (!fileData) return res.status(400).json({ error: "No file data" });

    console.log(`📄 Analyzing report for ${memberName}: ${fileName}`);

    let analysis;
    try {
      analysis = await analyzeReportWithAI(fileData, fileType, fileName, memberName, note);
    } catch (e) {
      analysis = `❌ AI unavailable. Please add GROQ_API_KEY in Railway variables.\n\nGet free key at: console.groq.com`;
    }

    const log = new HealthLog({
      familyCode, member: memberName,
      text: `📄 Report: ${fileName}${note ? ` — ${note}` : ""}`,
      aiAnalysis: analysis,
      category: "report",
      date: new Date(),
    });
    await log.save();

    res.json({ analysis, logId: log._id });
  } catch (err) {
    console.error("Report error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ── AI ADVICE ──────────────────────────────────────────────────────────────
router.post("/ai-advice", async (req, res) => {
  try {
    auth(req);
    const { note, member, bloodSugar, bloodPressure } = req.body;
    const prompt = `You are a caring family health assistant. Be warm, simple, helpful.
Patient: ${member}
${bloodSugar ? `Blood Sugar: ${bloodSugar} mg/dL` : ""}
${bloodPressure ? `Blood Pressure: ${bloodPressure}` : ""}
${note ? `Note: ${note}` : ""}
Give practical health advice in 2-3 sentences. Use emojis. Be caring and specific.`;
    const advice = await askAI(prompt);
    res.json({ advice });
  } catch (err) {
    res.status(500).json({ error: "AI unavailable. Add GROQ_API_KEY in Railway." });
  }
});

module.exports = router;
