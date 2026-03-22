require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const server = http.createServer(app);

// CORS
app.use(cors());
app.options("*", cors());

// Socket.IO
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET","POST","PUT","PATCH","DELETE"] }
});
require("./socket/handler")(io);

// Middleware
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Routes
app.use("/api/family",        require("./routes/family"));
app.use("/api/health",        require("./routes/health"));
app.use("/api/messages",      require("./routes/messages"));
app.use("/api/memories",      require("./routes/memories"));
app.use("/api/notifications", require("./routes/notifications").router);

// Health check
app.get("/api/ping", (req, res) => res.json({ status: "ok", time: new Date() }));

// MongoDB
const PORT = process.env.PORT || 5000;
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");
    server.listen(PORT, () => console.log(`🚀 FamilyVerse backend running on port ${PORT}`));
  })
  .catch(err => {
    console.error("❌ MongoDB error:", err.message);
    process.exit(1);
  });
