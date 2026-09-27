const express = require("express");
const cors = require("cors");
const http = require("http");
require("dotenv").config();

const connectDB = require("./config/db");

const authRoutes = require("./routes/authRoutes");
const conversationRoutes = require("./routes/conversationRoutes");
const messageRoutes = require("./routes/messageRoutes");

const initializeSocket = require("./sockets/socket");
const startKeepAlive = require("./utils/keepAlive");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

app.get(["/health", "/api/health"], (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    message: "ContextChat API server is healthy and active",
  });
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ContextChat API is running",
  });
});

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  await connectDB();

  const server = http.createServer(app);

  initializeSocket(server);

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`ContextChat server running on port ${PORT}`);
    startKeepAlive();
  });
};

startServer();