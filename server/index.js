const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const connectDB = require("../database/db");
connectDB();

const cron = require("node-cron");
const File = require("./models/File");

// ✅ Define allowed origins once
const allowedOrigins = [
  "http://localhost:5000",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://collabhub-in.vercel.app", // ✅ no trailing slash
];

// ✅ Use only one CORS middleware
app.use(cors({
  origin: allowedOrigins,
  methods: ["GET", "POST"],
  credentials: true,
}));

app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// In-memory code store
let codeSnippets = {};

// ✅ Socket.io CORS setup using same origins
const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
  },
});

// 🔥 Real-time socket connections
io.on("connection", (socket) => {
  console.log("New client connected:", socket.id);

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

  socket.on("disconnect", () => {
    console.log("Client disconnected:", socket.id);
  });
});

const fileRoutes = require("./routes/fileshareRoutes");
app.use("/api/fileshare", fileRoutes);

// 🧹 Delete expired files hourly
cron.schedule("0 * * * *", async () => {
  await File.deleteMany({ expiresAt: { $lt: new Date() } });
  console.log("🧹 Old files cleaned");
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Open the website at: http://localhost:${PORT}/`);
});
