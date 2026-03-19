const jwt = require("jsonwebtoken");
const Message = require("../models/Message");
const Family = require("../models/Family");

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
      } catch (e) {
        console.error("Send message error:", e.message);
        socket.emit("messageError", { error: "Failed to send message" });
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
