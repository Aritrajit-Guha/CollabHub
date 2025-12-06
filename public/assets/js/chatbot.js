// CONFIG
// ======================
// Use API_BASE from config.js (already loaded globally as window.API_BASE)
const socket = io(window.API_BASE);

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");

let currentRoom = "";
let userName = "";

// ======================
// HELPER: Append Message
// ======================
function appendMessage(user, text, type) {
  const msgDiv = document.createElement("div");
  msgDiv.classList.add("message", type);

  const header = document.createElement("div");
  header.innerHTML = `<strong>${user}:</strong>`;
  
  const content = document.createElement("div");

  if (type === "ai-msg") {
    content.innerHTML = marked.parse(text); 
  } else if (type === "system-msg") {
    content.innerHTML = `<em>${text}</em>`;
  } else {
    content.textContent = text; 
  }

  msgDiv.appendChild(header);
  msgDiv.appendChild(content);
  chatBox.appendChild(msgDiv);
  chatBox.scrollTop = chatBox.scrollHeight;
}

// ======================
// JOIN ROOM
// ======================
joinBtn.addEventListener("click", () => {
  const room = roomInput.value.trim();
  if (!room) return alert("Please enter a valid room code!");
  
  userName = prompt("Enter your name:");
  if (!userName || !userName.trim()) {
    userName = `User${Math.floor(Math.random() * 1000)}`;
  }
  
  currentRoom = room;
  socket.emit("joinRoom", { room: currentRoom, userName });
  
  appendMessage("System", `Joined room: ${room} as ${userName}`, "system-msg");
});

// ======================
// SEND MESSAGE
// ======================
async function sendMessage() {
  const message = userInput.value.trim();
  if (!message) return;
  if (!currentRoom) return alert("Join a room first!");

  appendMessage(userName, message, "user-msg");
  socket.emit("sendMessage", { room: currentRoom, user: userName, message });

  // AI Typing Indicator
  const typingId = `typing-${Date.now()}`;
  const typingDiv = document.createElement("div");
  typingDiv.id = typingId;
  typingDiv.classList.add("message", "ai-msg");
  typingDiv.innerHTML = "<em>🤖 CollabAI is typing...</em>";
  chatBox.appendChild(typingDiv);
  chatBox.scrollTop = chatBox.scrollHeight;

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, room: currentRoom, userName: userName }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    await res.json(); 
    
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

  } catch (err) {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();
    appendMessage("System", "AI could not respond.", "error-msg");
  }

  userInput.value = "";
}

// ======================
// RECEIVE MESSAGES
// ======================
socket.on("newMessage", ({ user, message }) => {
  if (user === userName) return;

  let type = "other-msg";
  if (user === "System") type = "system-msg";
  else if (user.includes("CollabAI")) type = "ai-msg";

  appendMessage(user, message, type);
});

// ======================
// LISTENERS
// ======================
sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});