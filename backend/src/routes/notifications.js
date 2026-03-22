// backend/src/routes/notifications.js
// Add this as a new file in your backend

const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const axios = require("axios");
const Family = require("../models/Family");

const ONESIGNAL_APP_ID = "f0a96e08-77cb-48fa-989e-70640ff2380f";
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;

const auth = (req) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) throw new Error("No token");
  return jwt.verify(token, process.env.JWT_SECRET || "secret123");
};

// Send notification to whole family
const sendToFamily = async (familyCode, title, message, icon = "🏠", data = {}) => {
  if (!ONESIGNAL_API_KEY) return;
  try {
    await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        filters: [{ field: "tag", key: "familyCode", relation: "=", value: familyCode }],
        headings: { en: title },
        contents: { en: message },
        small_icon: "ic_notification",
        data: { familyCode, ...data },
        url: "https://family-verse-umber.vercel.app",
      },
      {
        headers: {
          "Authorization": `Key ${ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ Notification sent to family ${familyCode}`);
  } catch (e) {
    console.error("OneSignal error:", e.response?.data || e.message);
  }
};

// Register device for notifications
router.post("/register", async (req, res) => {
  try {
    const { familyCode, memberName } = auth(req);
    const { playerId } = req.body;
    if (!playerId) return res.status(400).json({ error: "No player ID" });

    // Tag this device with family code so we can send family-specific notifications
    await axios.put(
      `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${playerId}`,
      {
        properties: {
          tags: {
            familyCode,
            memberName,
          },
        },
      },
      {
        headers: {
          "Authorization": `Key ${ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log(`✅ Device registered for ${memberName} in family ${familyCode}`);
    res.json({ success: true });
  } catch (e) {
    console.error("Register error:", e.response?.data || e.message);
    res.status(500).json({ error: e.message });
  }
});

// Send test notification
router.post("/test", async (req, res) => {
  try {
    const { familyCode, memberName } = auth(req);
    await sendToFamily(
      familyCode,
      "🏠 FamilyVerse",
      `Test notification working! Hello ${memberName}! 🎉`
    );
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = { router, sendToFamily };
