// index.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const path = require("path");
const http = require("http");
const { Server } = require("socket.io");
const cron = require("node-cron");
require("dotenv").config();

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

// ✅ FIX: Define allowedOrigins from environment variables
const allowedOrigins = [
  process.env.FRONTEND_URL_LOCAL_1,
  process.env.FRONTEND_URL_LOCAL_2,
  process.env.FRONTEND_URL_LOCAL_3,
  process.env.FRONTEND_URL_PRODUCTION,
];

// --- Middleware ---
app.use(
  cors({
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  })
);
app.use(bodyParser.json());

// Helper function to inject backend URL into HTML
const injectBackendUrl = (htmlPath) => {
  // Use production backend URL if in production, otherwise use development URL
  const backendUrl = process.env.NODE_ENV === "production" 
    ? (process.env.REACT_APP_BACKEND_URL_PRODUCTION || process.env.REACT_APP_BACKEND_URL)
    : (process.env.REACT_APP_BACKEND_URL || "http://localhost:5000");
  
  console.log("🔍 Debug Info:", {
    NODE_ENV: process.env.NODE_ENV,
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    REACT_APP_BACKEND_URL_PRODUCTION: process.env.REACT_APP_BACKEND_URL_PRODUCTION,
    finalBackendUrl: backendUrl
  });
  
  let html = require("fs").readFileSync(htmlPath, "utf8");
  const scriptInjection = `<script>window.BACKEND_URL = "${backendUrl}"; console.log("Backend URL injected:", window.BACKEND_URL);</script>`;
  return html.replace("</head>", scriptInjection + "</head>");
};

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, "../public"))); 

// --- Root & Health Routes ---
app.get("/", (req, res) => {
  res.send(injectBackendUrl(path.join(__dirname, "../public/index.html")));
});

app.get("/features/:feature", (req, res) => {
  const featurePath = path.join(__dirname, "../public/features", req.params.feature + ".html");
  res.send(injectBackendUrl(featurePath));
});

app.get("/health", (req, res) => res.json({ status: "OK", uptime: process.uptime() }));

// --- API Routes ---
app.use("/api/fileshare", fileRoutes);
app.use("/api/chat", chatRouter); // Use the imported chatRouter

// --- Socket.io Setup ---
const io = new Server(server, {
  cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
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
server.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 Open at: http://localhost:${PORT}/`);
});