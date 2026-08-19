// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
const dotenv = require("dotenv");

// Local development reads backend/.env. Render/Vercel-style deployments use
// the environment variables configured by the hosting platform.
dotenv.config({ path: path.join(__dirname, "..", ".env") });

// --- Database & Route Imports ---
const connectDB = require("../database/db");
const File = require("./models/File");
const fileRoutes = require("./routes/fileshareRoutes");
// Use the new export object from chatRoutes
const { router: chatRouter, setSocket } = require("./routes/chatRoutes");
const handleGroupChat = require("./routes/groupChatHandler");

// --- App & Server Initialization ---
const app = express();
const server = http.createServer(app);
connectDB();

const configuredFrontendOrigins = (process.env.FRONTEND_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

// The React app runs on Vite's default port locally and is deployed separately.
const allowedOrigins = [
  "http://localhost:5000",
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5500",
  "http://localhost:5500",
  "https://collabhub-in.vercel.app", // Your production URL
  ...configuredFrontendOrigins,
];

// --- Middleware ---
app.use(
  cors({
    origin: [...new Set(allowedOrigins)],
    methods: ["GET", "POST", "OPTIONS"],
    credentials: true,
  })
);
app.use(bodyParser.json());

// The React frontend is deployed separately. Keep this endpoint useful for
// quick API checks without serving the retired static frontend.
app.get("/", (req, res) => res.json({ name: "CollabHub API", status: "OK" }));

app.get("/health", (req, res) => res.json({ status: "OK", uptime: process.uptime() }));

// --- API Routes ---
app.use("/api/fileshare", fileRoutes);
app.use("/api/chat", chatRouter); // Use the imported chatRouter

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: { origin: [...new Set(allowedOrigins)], methods: ["GET", "POST"] },
});

// Pass 'io' to the handlers that need it
handleGroupChat(io);
setSocket(io); // Pass 'io' to chatRoutes

// --- CRON Job (Scheduled Task) ---
cron.schedule("0 * * * *", async () => {
  try {
    await File.deleteMany({ expiresAt: { $lt: new Date() } });
    console.log("🧹 Old files cleaned");
  } catch (err) {
    console.error("❌ Error cleaning old files:", err);
  }
});

// --- Start Server ---
const PORT = process.env.PORT || 5000;
const HOST = process.env.HOST || "0.0.0.0";
server.listen(PORT, HOST, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Listening on ${HOST}:${PORT}`);
});
