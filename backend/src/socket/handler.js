const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Family = require("../models/Family");
const axios = require("axios");

const ONESIGNAL_APP_ID = "f0a96e08-77cb-48fa-989e-70640ff2380f";

const sendPush = async (title, body, excludeName, url = "https://family-verse-weld.vercel.app") => {
  if (!process.env.ONESIGNAL_API_KEY) {
    console.log("⚠️ ONESIGNAL_API_KEY not set — skipping push");
    return;
  }
  try {
    const resp = await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        included_segments: ["All"], // Send to all subscribed users
        headings: { en: title },
        contents: { en: body },
        url,
        android_accent_color: "FF6366F1",
      },
      {
        headers: {
          "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
    console.log(`✅ Push sent! Recipients: ${resp.data?.recipients || 0}`);
  } catch (e) {
    console.error("Push error:", e.response?.data?.errors || e.message);
  }
};

module.exports = (io) => {
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
      socket.user = decoded;
      next();
    } catch (e) { next(new Error("Invalid token")); }
  });

  io.on("connection", async (socket) => {
    const { familyCode, memberName, memberId } = socket.user;
    console.log(`✅ ${memberName} connected to family ${familyCode}`);

    socket.join(familyCode);
    socket.join(`${familyCode}_${memberName}`);

    try {
      await Family.updateOne(
        { inviteCode: familyCode, "members._id": memberId },
        { $set: { "members.$.online": true, "members.$.socketId": socket.id } }
      );
      socket.to(familyCode).emit("memberOnline", { name: memberName });
    } catch (e) { console.error("Online update:", e.message); }

    // Send message
    socket.on("sendMessage", async (data) => {
      try {
        const msg = new Message({
          familyCode,
          chatId: data.chatId || "group",
          sender: memberName,
          senderEmoji: data.senderEmoji || "👤",
          text: data.text,
          type: data.type || "text",
        });
        await msg.save();

        // Emit to all connected family members
        io.to(familyCode).emit("newMessage", {
          _id: msg._id,
          chatId: msg.chatId,
          sender: msg.sender,
          senderEmoji: msg.senderEmoji,
          text: msg.text,
          type: msg.type,
          timestamp: msg.timestamp,
          read: false,
        });

        // Push notification for offline members
        const preview = data.text?.length > 60 ? data.text.substring(0, 60) + "..." : data.text;
        await sendPush(
          `${msg.senderEmoji} ${memberName}`,
          preview || "Sent a message 💬",
          memberName
        );
      } catch (e) {
        console.error("Message error:", e.message);
        socket.emit("messageError", { error: "Failed to send" });
      }
    });

    socket.on("typing", (data) => {
      socket.to(familyCode).emit("userTyping", { name: memberName, chatId: data.chatId, typing: data.typing });
    });

    socket.on("moodUpdate", (data) => {
      io.to(familyCode).emit("memberMoodUpdated", { name: memberName, mood: data.mood });
      Family.updateOne(
        { inviteCode: familyCode, "members._id": memberId },
        { $set: { "members.$.mood": data.mood } }
      ).catch(() => {});
    });

    socket.on("sosAlert", (data) => {
      io.to(familyCode).emit("sosReceived", { from: memberName, location: data.location });
      // URGENT push for SOS
      sendPush(
        "🚨 EMERGENCY SOS ALERT!",
        `${memberName} needs urgent help! Open FamilyVerse now!`,
        memberName
      );
    });

    socket.on("callOffer", (data) => {
      socket.to(`${familyCode}_${data.to}`).emit("incomingCall", {
        from: memberName, fromEmoji: data.fromEmoji, type: data.type,
      });
      sendPush(`📞 Incoming ${data.type} Call`, `${memberName} is calling you!`, memberName);
    });

    socket.on("callAnswer", (data) => socket.to(`${familyCode}_${data.to}`).emit("callAnswered", { answer: data.answer }));
    socket.on("callReject", (data) => socket.to(`${familyCode}_${data.to}`).emit("callRejected", { from: memberName }));
    socket.on("iceCandidate", (data) => socket.to(`${familyCode}_${data.to}`).emit("iceCandidate", { candidate: data.candidate }));
    socket.on("endCall", (data) => socket.to(`${familyCode}_${data.to}`).emit("callEnded", { from: memberName }));

    socket.on("disconnect", async () => {
      console.log(`❌ ${memberName} disconnected`);
      try {
        await Family.updateOne(
          { inviteCode: familyCode, "members._id": memberId },
          { $set: { "members.$.online": false, "members.$.lastSeen": new Date(), "members.$.socketId": null } }
        );
        socket.to(familyCode).emit("memberOffline", { name: memberName });
      } catch (e) { console.error("Offline update:", e.message); }
    });
  });
};
