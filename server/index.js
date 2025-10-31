// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");

const connectDB = require("../database/db");
const File = require("./models/File");
const fileRoutes = require("./routes/fileshareRoutes");

const app = express();
const server = http.createServer(app);
connectDB();

// ✅ Allowed origins
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://collabhub-in.vercel.app", // no trailing slash
];

// ✅ Global middleware
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// In-memory stores
let codeSnippets = {};

// ✅ Socket.io setup
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

io.on("connection", (socket) => {
  console.log("🟢 Client connected:", socket.id);

  // ===== CODE COLLABORATION =====
  socket.on("joinRoom", (roomId) => {
    socket.join(roomId);
    if (codeSnippets[roomId]) {
      socket.emit("codeUpdate", codeSnippets[roomId]);
    }
  });

  socket.on("codeChange", ({ roomId, code }) => {
    codeSnippets[roomId] = code;
    socket.to(roomId).emit("codeUpdate", code);
  });

  // ===== WHITEBOARD FEATURE =====
  socket.on("joinBoard", (boardId) => {
    socket.join(boardId);
    console.log(`🧩 User joined whiteboard: ${boardId}`);
  });

  socket.on("draw", (data) => {
    socket.to(data.boardId).emit("draw", data);
  });

  socket.on("clearBoard", (boardId) => {
    io.to(boardId).emit("clearBoard", boardId);
  });

  socket.on("disconnect", () => {
    console.log("🔴 Client disconnected:", socket.id);
  });
});

// ===== FILE SHARING ROUTES =====
app.use("/api/fileshare", fileRoutes);

// ===== CRON JOB TO CLEAN OLD FILES =====
cron.schedule("0 * * * *", async () => {
  await File.deleteMany({ expiresAt: { $lt: new Date() } });
  console.log("🧹 Old files cleaned");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Open at: http://localhost:${PORT}/`);
});
