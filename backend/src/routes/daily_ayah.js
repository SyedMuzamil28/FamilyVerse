// backend/src/routes/daily_ayah.js
// This sends daily Quran verse notifications to all families

const express = require("express");
const router = express.Router();
const axios = require("axios");
const jwt = require("jsonwebtoken");
const Family = require("../models/Family");

const ONESIGNAL_APP_ID = "f0a96e08-77cb-48fa-989e-70640ff2380f";

// Beautiful curated Ayahs with Urdu + English
const DAILY_AYAHS = [
  {
    arabic: "إِنَّ مَعَ الْعُسْرِ يُسْرًا",
    urdu: "بیشک مشکل کے ساتھ آسانی ہے",
    english: "Indeed, with hardship comes ease.",
    ref: "Surah Ash-Sharh 94:6",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/94.mp3"
  },
  {
    arabic: "وَاللَّهُ خَيْرُ الرَّازِقِينَ",
    urdu: "اور اللہ سب سے بہتر رزق دینے والا ہے",
    english: "And Allah is the best of providers.",
    ref: "Surah Al-Jumu'ah 62:11",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/62.mp3"
  },
  {
    arabic: "وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ",
    urdu: "جو اللہ پر بھروسہ کرے، وہ اس کے لیے کافی ہے",
    english: "Whoever relies on Allah — He will be sufficient for him.",
    ref: "Surah At-Talaq 65:3",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/65.mp3"
  },
  {
    arabic: "فَاذْكُرُونِي أَذْكُرْكُمْ",
    urdu: "پس تم مجھے یاد کرو، میں تمہیں یاد کروں گا",
    english: "Remember Me, and I will remember you.",
    ref: "Surah Al-Baqarah 2:152",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3"
  },
  {
    arabic: "إِنَّ اللَّهَ مَعَ الصَّابِرِينَ",
    urdu: "بیشک اللہ صبر کرنے والوں کے ساتھ ہے",
    english: "Indeed, Allah is with the patient.",
    ref: "Surah Al-Baqarah 2:153",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3"
  },
  {
    arabic: "وَلَا تَيْأَسُوا مِن رَّوْحِ اللَّهِ",
    urdu: "اللہ کی رحمت سے مایوس نہ ہو",
    english: "Do not despair of the mercy of Allah.",
    ref: "Surah Yusuf 12:87",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/12.mp3"
  },
  {
    arabic: "وَهُوَ مَعَكُمْ أَيْنَ مَا كُنتُمْ",
    urdu: "اور وہ تمہارے ساتھ ہے جہاں بھی تم ہو",
    english: "And He is with you wherever you are.",
    ref: "Surah Al-Hadid 57:4",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/57.mp3"
  },
  {
    arabic: "حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ",
    urdu: "ہمیں اللہ کافی ہے اور وہ بہترین کارساز ہے",
    english: "Allah is sufficient for us and He is the best disposer of affairs.",
    ref: "Surah Ali Imran 3:173",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/3.mp3"
  },
  {
    arabic: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
    urdu: "اور کہو: اے رب! میرا علم بڑھا",
    english: "And say: My Lord, increase me in knowledge.",
    ref: "Surah Ta-Ha 20:114",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/20.mp3"
  },
  {
    arabic: "وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ",
    urdu: "اور نماز قائم کرو اور زکوٰۃ دو",
    english: "Establish prayer and give zakah.",
    ref: "Surah Al-Baqarah 2:43",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3"
  },
  {
    arabic: "وَبِالْوَالِدَيْنِ إِحْسَانًا",
    urdu: "اور والدین کے ساتھ نیک سلوک کرو",
    english: "And be good to your parents.",
    ref: "Surah Al-Isra 17:23",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/17.mp3"
  },
  {
    arabic: "إِنَّ الْحَسَنَاتِ يُذْهِبْنَ السَّيِّئَاتِ",
    urdu: "بیشک نیکیاں برائیوں کو مٹا دیتی ہیں",
    english: "Indeed, good deeds do away with misdeeds.",
    ref: "Surah Hud 11:114",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/11.mp3"
  },
  {
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً",
    urdu: "اے ہمارے رب! ہمیں دنیا میں بھلائی دے اور آخرت میں بھی",
    english: "Our Lord, give us good in this world and good in the hereafter.",
    ref: "Surah Al-Baqarah 2:201",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/2.mp3"
  },
  {
    arabic: "وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ",
    urdu: "اور میری توفیق صرف اللہ کی طرف سے ہے",
    english: "And my success is not but through Allah.",
    ref: "Surah Hud 11:88",
    audio: "https://cdn.islamic.network/quran/audio/128/ar.alafasy/11.mp3"
  },
];

// Get today's ayah (rotates daily)
const getTodayAyah = () => {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 86400000);
  return DAILY_AYAHS[dayOfYear % DAILY_AYAHS.length];
};

// API endpoint to get today's ayah
router.get("/today", (req, res) => {
  res.json(getTodayAyah());
});

// Send daily notification to all families (called by cron/scheduler)
router.post("/send-daily", async (req, res) => {
  try {
    const secret = req.headers["x-cron-secret"];
    if (secret !== process.env.CRON_SECRET && secret !== "familyverse_cron_2026") {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const ayah = getTodayAyah();
    const now = new Date();
    const timeStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

    // Send to ALL subscribers
    if (process.env.ONESIGNAL_API_KEY) {
      await axios.post(
        "https://api.onesignal.com/notifications",
        {
          app_id: ONESIGNAL_APP_ID,
          included_segments: ["All"],
          headings: { en: `🌙 Daily Quran · ${timeStr}` },
          contents: { en: `${ayah.arabic}\n\n"${ayah.english}"\n\n${ayah.urdu}\n\n— ${ayah.ref}` },
          url: "https://family-verse-umber.vercel.app",
          send_after: new Date(now.getFullYear(), now.getMonth(), now.getDate(), 7, 0, 0).toISOString(),
        },
        {
          headers: {
            "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      console.log("✅ Daily Quran notification sent!");
    }

    res.json({ success: true, ayah });
  } catch (e) {
    console.error("Daily ayah error:", e.response?.data || e.message);
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
