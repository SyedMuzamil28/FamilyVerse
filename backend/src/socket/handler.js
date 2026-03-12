const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Family = require("../models/Family");

module.exports = (io) => {
  // Auth middleware for socket
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No token"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret123");
      socket.user = decoded;
      next();
    } catch (e) {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", async (socket) => {
    const { familyCode, memberName, memberId } = socket.user;
    console.log(`✅ ${memberName} connected to family ${familyCode}`);

    // Join family room
    socket.join(familyCode);
    socket.join(`${familyCode}_${memberName}`);

    // Mark as online
    try {
      await Family.updateOne(
        { inviteCode: familyCode, "members._id": memberId },
        { $set: { "members.$.online": true, "members.$.socketId": socket.id } }
      );
      // Notify family
      socket.to(familyCode).emit("memberOnline", { name: memberName });
    } catch (e) { console.error(e); }

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
          imageUrl: msg.imageUrl,
          timestamp: msg.timestamp,
          read: false,
        };

        // Broadcast to family room
        io.to(familyCode).emit("newMessage", msgData);
      } catch (e) {
        console.error("Send message error:", e);
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // Typing indicator
    socket.on("typing", (data) => {
      socket.to(familyCode).emit("userTyping", { name: memberName, chatId: data.chatId, typing: data.typing });
    });

    // Mood update
    socket.on("moodUpdate", (data) => {
      io.to(familyCode).emit("memberMoodUpdated", { name: memberName, mood: data.mood });
    });

    // SOS alert
    socket.on("sosAlert", (data) => {
      io.to(familyCode).emit("sosReceived", {
        from: memberName,
        location: data.location,
        timestamp: new Date(),
      });
    });

    // WebRTC signaling for calls
    socket.on("callOffer", (data) => {
      socket.to(`${familyCode}_${data.to}`).emit("incomingCall", {
        from: memberName,
        fromEmoji: data.fromEmoji,
        offer: data.offer,
        type: data.type, // audio | video
      });
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

    // Disconnect
    socket.on("disconnect", async () => {
      console.log(`❌ ${memberName} disconnected`);
      try {
        await Family.updateOne(
          { inviteCode: familyCode, "members._id": memberId },
          { $set: { "members.$.online": false, "members.$.lastSeen": new Date(), "members.$.socketId": null } }
        );
        socket.to(familyCode).emit("memberOffline", { name: memberName });
      } catch (e) { console.error(e); }
    });
  });
};
