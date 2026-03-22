const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");

const ONESIGNAL_APP_ID = "f0a96e08-77cb-48fa-989e-70640ff2380f";

const auth = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("No token");
  return jwt.verify(token, process.env.JWT_SECRET || "secret123");
};

// Register device — tag with familyCode so we can target them
router.post("/register", async (req, res) => {
  try {
    const { familyCode, memberName } = auth(req);
    const { playerId } = req.body;

    if (!playerId) return res.status(400).json({ error: "No player ID" });
    if (!process.env.ONESIGNAL_API_KEY) return res.json({ success: true, note: "No API key" });

    console.log(`📱 Registering ${memberName} (${familyCode}) - Player: ${playerId}`);

    // Tag the device with familyCode and memberName
    const resp = await axios.patch(
      `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/subscriptions/${playerId}`,
      {
        subscription: {
          type: "ChromePush",
        }
      },
      {
        headers: {
          "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    ).catch(() => null);

    // Also set tags via user identity
    await axios.post(
      `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users`,
      {
        identity: { external_id: `${familyCode}_${memberName}` },
        subscriptions: [{ type: "Push", token: playerId }],
        properties: {
          tags: {
            familyCode: familyCode,
            memberName: memberName,
          }
        }
      },
      {
        headers: {
          "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    ).catch(e => console.log("User tag error:", e.response?.data));

    console.log(`✅ Registered ${memberName} for push notifications`);
    res.json({ success: true, playerId });
  } catch (e) {
    console.error("Register error:", e.message);
    res.status(500).json({ error: e.message });
  }
});

// Send test notification
router.post("/test", async (req, res) => {
  try {
    const { familyCode, memberName } = auth(req);
    if (!process.env.ONESIGNAL_API_KEY) return res.status(400).json({ error: "ONESIGNAL_API_KEY not set in Render!" });

    // Send to ALL subscribers first (for testing)
    const resp = await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"],
        headings: { en: "🏠 FamilyVerse Test" },
        contents: { en: `✅ Notifications working! Hello ${memberName}! 🎉` },
        url: "https://family-verse-umber.vercel.app",
      },
      {
        headers: {
          "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log("Test notification sent:", resp.data);
    res.json({ success: true });
  } catch (e) {
    console.error("Test notif error:", e.response?.data || e.message);
    res.status(500).json({ error: e.response?.data?.errors || e.message });
  }
});

module.exports = { router };
