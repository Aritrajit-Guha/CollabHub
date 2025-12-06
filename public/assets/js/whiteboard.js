// whiteboard.js
// Load backend URL from config.js (window.API_BASE)
const socket = io(window.API_BASE);


// Canvas setup
const canvas = document.getElementById("whiteboard");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight - 100;

// Default state
let drawing = false;
let color = "#000000";
let thickness = 3;
let lastX = 0;
let lastY = 0;
let boardId = null;

// === Tool controls ===
const colorPicker = document.getElementById("colorPicker");
const thicknessSlider = document.getElementById("thickness");
const eraseBtn = document.getElementById("eraseBtn");
const clearBtn = document.getElementById("clearBtn");
const downloadBtn = document.getElementById("downloadBtn");
const shareBtn = document.getElementById("shareBtn");
const joinBtn = document.getElementById("joinBtn");
const boardInput = document.getElementById("boardId");

colorPicker.addEventListener("change", (e) => (color = e.target.value));
thicknessSlider.addEventListener("input", (e) => (thickness = e.target.value));

eraseBtn.addEventListener("click", () => (color = "#FFFFFF"));
clearBtn.addEventListener("click", () => clearBoard());
downloadBtn.addEventListener("click", downloadBoard);

shareBtn.addEventListener("click", () => {
  boardId = Math.random().toString(36).substring(2, 8);
  boardInput.value = boardId;
  socket.emit("joinBoard", boardId);
  alert(`Share this code: ${boardId}`);
});

joinBtn.addEventListener("click", () => {
  const id = boardInput.value.trim();
  if (id) {
    boardId = id;
    socket.emit("joinBoard", boardId);
    alert(`Joined whiteboard: ${boardId}`);
  } else {
    alert("Please enter a valid board ID to join");
  }
});

// === Drawing Events ===
canvas.addEventListener("mousedown", (e) => {
  drawing = true;
  [lastX, lastY] = [e.offsetX, e.offsetY];
});

canvas.addEventListener("mouseup", () => (drawing = false));
canvas.addEventListener("mouseout", () => (drawing = false));

canvas.addEventListener("mousemove", (e) => {
  if (!drawing || !boardId) return;

  const x = e.offsetX;
  const y = e.offsetY;

  drawLine(lastX, lastY, x, y, color, thickness);
  socket.emit("draw", { boardId, x1: lastX, y1: lastY, x2: x, y2: y, color, thickness });

  [lastX, lastY] = [x, y];
});

// === Socket Receivers ===
socket.on("draw", (data) => {
  if (data.boardId === boardId) {
    drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.thickness);
  }
});

socket.on("clearBoard", (id) => {
  if (id === boardId) clearBoard(true);
});

// === Drawing Functions ===
function drawLine(x1, y1, x2, y2, color, thickness) {
  ctx.strokeStyle = color;
  ctx.lineWidth = thickness;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
}

function clearBoard(skipEmit = false) {
  ctx.fillStyle = "#FFFFFF"; // keep whiteboard background white
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (!skipEmit && boardId) socket.emit("clearBoard", boardId);
}

function downloadBoard() {
  const link = document.createElement("a");
  link.download = "whiteboard.png";
  link.href = canvas.toDataURL("image/png");
  link.click();
}

// === Initialize white background ===
clearBoard(true);
