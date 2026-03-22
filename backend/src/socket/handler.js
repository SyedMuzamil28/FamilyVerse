const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Family = require("../models/Family");
const axios = require("axios");

const ONESIGNAL_APP_ID = "f0a96e08-77cb-48fa-989e-70640ff2380f";

// Send push notification via OneSignal
const sendPush = async (familyCode, title, body, excludeName) => {
  if (!process.env.ONESIGNAL_API_KEY) return;
  try {
    await axios.post(
      "https://api.onesignal.com/notifications",
      {
        app_id: ONESIGNAL_APP_ID,
        filters: [
          { field: "tag", key: "familyCode", relation: "=", value: familyCode },
          { operator: "AND" },
          { field: "tag", key: "memberName", relation: "!=", value: excludeName },
        ],
        headings: { en: title },
        contents: { en: body },
        url: "https://family-verse-umber.vercel.app",
        android_accent_color: "FF6366F1",
        small_icon: "ic_notification",
      },
      {
        headers: {
          "Authorization": `Key ${process.env.ONESIGNAL_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (e) {
    console.log("Push notification skipped:", e.response?.data?.errors || e.message);
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
    } catch (e) { console.error("Online update error:", e.message); }

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
          imageUrl: data.imageUrl,
        });
        await msg.save();

        const msgData = {
          _id: msg._id,
          chatId: msg.chatId,
          sender: msg.sender,
          senderEmoji: msg.senderEmoji,
          text: msg.text,
          type: msg.type,
          timestamp: msg.timestamp,
          read: false,
        };

        // Send to all connected family members
        io.to(familyCode).emit("newMessage", msgData);

        // Send push notification to offline members
        const chatName = data.chatId === "group" ? "Family Chat" : memberName;
        const preview = data.text?.length > 50 ? data.text.substring(0, 50) + "..." : data.text;
        await sendPush(
          familyCode,
          `${msg.senderEmoji} ${memberName}`,
          preview || "Sent a message",
          memberName // exclude sender
        );
      } catch (e) {
        console.error("Send message error:", e.message);
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
      io.to(familyCode).emit("sosReceived", { from: memberName, location: data.location, timestamp: new Date() });
      // Push notification for SOS — highest priority!
      sendPush(
        familyCode,
        "🚨 EMERGENCY SOS ALERT!",
        `${memberName} needs help urgently! Open FamilyVerse now!`,
        memberName
      );
    });

    // WebRTC call signaling
    socket.on("callOffer", (data) => {
      socket.to(`${familyCode}_${data.to}`).emit("incomingCall", {
        from: memberName, fromEmoji: data.fromEmoji, type: data.type, offer: data.offer,
      });
      sendPush(familyCode, `📞 Incoming Call`, `${memberName} is calling you on FamilyVerse!`, memberName);
    });

    socket.on("callAnswer", (data) => {
      socket.to(`${familyCode}_${data.to}`).emit("callAnswered", { answer: data.answer });
    });

    socket.on("callReject", (data) => {
      socket.to(`${familyCode}_${data.to}`).emit("callRejected", { from: memberName });
    });

    socket.on("iceCandidate", (data) => {
      socket.to(`${familyCode}_${data.to}`).emit("iceCandidate", { candidate: data.candidate });
    });

    socket.on("endCall", (data) => {
      socket.to(`${familyCode}_${data.to}`).emit("callEnded", { from: memberName });
    });

    socket.on("disconnect", async () => {
      console.log(`❌ ${memberName} disconnected`);
      try {
        await Family.updateOne(
          { inviteCode: familyCode, "members._id": memberId },
          { $set: { "members.$.online": false, "members.$.lastSeen": new Date(), "members.$.socketId": null } }
        );
        socket.to(familyCode).emit("memberOffline", { name: memberName });
      } catch (e) { console.error("Offline update error:", e.message); }
    });
  });
};
