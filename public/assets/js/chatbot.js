// ======================
// CONFIG
// ======================
const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000"
    : "https://collabhub-13ad.onrender.com";

const socket = io(API_BASE);

// ... (DOM Elements and Join Room code are unchanged) ...
const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");
let currentRoom = "";
let userName = "";

joinBtn.addEventListener("click", () => {
  const room = roomInput.value.trim();
  if (!room) return alert("Please enter a valid room code!");
  userName = prompt("Enter your name:");
  if (!userName || !userName.trim()) {
    userName = `User${Math.floor(Math.random() * 1000)}`;
    alert(`No name entered. Using default name: ${userName}`);
  }
  currentRoom = room;
  socket.emit("joinRoom", { room: currentRoom, userName });
  chatBox.innerHTML += `<p class="system-msg">Attempting to join room: <b>${room}</b> as <b>${userName}</b></p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
  console.log(`🪵 ${userName} attempting to join room: ${room}`);
});

// ======================
// SEND MESSAGE (Group + AI)
// ======================
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;
  if (!currentRoom) return alert("Join a room first!");

  // Show user message *locally* right away
  chatBox.innerHTML += `<p class="user-msg"><strong>${userName}:</strong> ${message}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  // Broadcast user's message to others
  socket.emit("sendMessage", { room: currentRoom, user: userName, message });

  // Show AI typing placeholder
  const typingId = `typing-${Date.now()}`;
  chatBox.innerHTML += `<p id="${typingId}" class="ai-msg"><em>🤖 CollabAI is typing...</em></p>`;
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    console.log(`🪵 Sending to AI: ${message}`);
    
    // ✅ FIX 1: Send 'userName' in the request body
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, room: currentRoom, userName: userName }),
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} - ${res.statusText}`);
    }

    // We don't need the AI reply data here anymore,
    // but we wait for the response to know the AI is done.
    await res.json(); 
    console.log("🪵 AI has processed and broadcasted the reply.");

    // ✅ FIX 2: Just remove the typing placeholder.
    // The AI message will arrive from the socket.
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    // ⛔️ REMOVED: No longer need to emit the AI reply from the frontend.
    // socket.emit("sendMessage", ...);

  } catch (err) {
    console.error("❌ AI fetch error:", err);
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    chatBox.innerHTML += `<p class="error-msg"><strong>Error:</strong> AI could not respond (${err.message}).</p>`;
  }

  userInput.value = "";
}

// ======================
// RECEIVE MESSAGES
// ======================
socket.on("newMessage", ({ user, message }) => {
  // ✅ This listener will now receive the user's *own* message
  // as well as messages from others AND the CollabAI 🤖 reply.
  
  // Prevent re-appending the sender's *own* user message
  if (user === userName) return;

  const msgClass =
    user === "System"
      ? "system-msg"
      : user.includes("🤖")
      ? "ai-msg"
      : "other-msg";
      
  chatBox.innerHTML += `<p class="${msgClass}"><strong>${user}:</strong> ${message}</p>`;
  chatBox.scrollTop = chatBox.scrollHeight;
});

// ======================
// EVENT LISTENERS
// ======================
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});