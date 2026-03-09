require("dotenv").config();
const express = require("express");
const http = require("http");
const socketIo = require("socket.io");
const mongoose = require("mongoose");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const setupSocket = require("./socket/handler")

const app = express();
const server = http.createServer(app);

// CORS
const allowedOrigins = [
  process.env.FRONTEND_URL,
  "http://localhost:3000",
  "https://localhost:3000",
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.some(o => origin.startsWith(o.replace("https://","").replace("http://","")))) {
      callback(null, true);
    } else {
      callback(null, true); // Allow all for now, restrict in production
    }
  },
  credentials: true
}));

// Socket.IO
const io = socketIo(server, {
  cors: { origin: "*", methods: ["GET","POST"], credentials: true }
});
setupSocket(io);

// Rate limiting
app.use("/api/auth", rateLimit({ windowMs: 15*60*1000, max: 20, message: "Too many requests" }));

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.use("/api/auth",     require("./routes/auth"));
app.use("/api/messages", require("./routes/messages"));
app.use("/api/health",   require("./routes/health"));
app.use("/api/memories", require("./routes/memories"));
app.use("/api/family",   require("./routes/family"));

// Health check
app.get("/api/ping", (req, res) => res.json({ status: "ok", timestamp: new Date() }));

// MongoDB + Server start
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

module.exports = { app, io };
