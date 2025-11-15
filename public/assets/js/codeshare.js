const shareModeBtn = document.getElementById("shareModeBtn");
const receiveModeBtn = document.getElementById("receiveModeBtn");
const codeInput = document.getElementById("codeInput");
const generatedCodeId = document.getElementById("generatedCodeId");

let mode = null;
let codeId = null;

// ✅ Detect backend URL based on environment
const socketServerURL =
  window.location.hostname === "localhost"
    ? "http://localhost:5000"
    : "https://collabhub-13ad.onrender.com/"; // change to your actual Render backend URL

// Connect to Socket.IO server
const socket = io(socketServerURL, {
  transports: ["websocket"], // ensures stable connection
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});

// Generate random 8-character Code ID
function generateCodeId() {
  return Math.random().toString(36).substring(2, 10);
}

// Share mode
shareModeBtn.addEventListener("click", () => {
  mode = "share";

  // Generate new Code ID
  codeId = generateCodeId();
  generatedCodeId.textContent = codeId;

  // Join room
  socket.emit("joinCodeRoom", codeId);
});

// Receive mode
receiveModeBtn.addEventListener("click", () => {
  mode = "receive";

  // Ask user for Code ID
  codeId = prompt("Enter Code ID to join:");
  if (!codeId) return alert("Code ID required!");
  generatedCodeId.textContent = codeId;

  socket.emit("joinCodeRoom", codeId);
});

// Listen for real-time code updates from others
socket.on("codeUpdate", (code) => {
  codeInput.value = code;
});

// Emit code changes in real-time
let typingTimeout;
codeInput.addEventListener("input", () => {
  if (!codeId) return;
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit("codeChange", { roomId: codeId, code: codeInput.value });
  }, 50);
});
