// ======================
// Auto Backend Detection
// ======================
const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000" // Local backend
    : "https://collabhub-13ad.onrender.com"; // Deployed backend URL

// ======================
// DOM Elements
// ======================
const chooseFiles = document.getElementById("chooseFiles");
const uploadBtn = document.getElementById("uploadBtn");
const fileInput = document.getElementById("fileInput");
const fileList = document.getElementById("fileList");
const uploadStatus = document.getElementById("uploadStatus");
const shareCodeInput = document.getElementById("shareCodeInput");
const fetchBtn = document.getElementById("fetchBtn");
const fileLinks = document.getElementById("fileLinks");

let selectedFiles = [];

// ======================
// File Selection
// ======================
chooseFiles.addEventListener("click", () => fileInput.click());

fileInput.addEventListener("change", () => {
  fileList.innerHTML = "";
  selectedFiles = Array.from(fileInput.files);
  selectedFiles.forEach(file => {
    const span = document.createElement("span");
    span.textContent = file.name;
    fileList.appendChild(span);
  });
});

// ======================
// File Upload
// ======================
uploadBtn.addEventListener("click", async () => {
  if (selectedFiles.length === 0) {
    alert("Please select at least one file.");
    return;
  }

  const formData = new FormData();
  selectedFiles.forEach(file => formData.append("files", file));

  uploadStatus.textContent = "Uploading...";

  try {
    const res = await fetch(`${API_BASE}/api/fileshare/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (data.success) {
      uploadStatus.innerHTML = `✅ Uploaded! Share Code: <strong>${data.shareCode}</strong>`;
    } else {
      uploadStatus.textContent = "❌ Upload failed.";
    }
  } catch (err) {
    console.error(err);
    uploadStatus.textContent = "❌ Error uploading files (server may be offline).";
  }
});

// ======================
// Fetch Shared Files
// ======================
fetchBtn.addEventListener("click", async () => {
  const code = shareCodeInput.value.trim().toUpperCase();
  if (!code) return alert("Enter a share code!");

  fileLinks.innerHTML = "Fetching...";

  try {
    const res = await fetch(`${API_BASE}/api/fileshare/${code}`);
    const data = await res.json();

    if (!data.success) {
      fileLinks.innerHTML = "❌ Invalid or expired code.";
      return;
    }

    fileLinks.innerHTML = "";
    data.files.forEach(file => {
      const a = document.createElement("a");
      a.href = `${API_BASE}${file.downloadUrl}`;
      a.textContent = file.filename;
      a.download = file.filename;
      fileLinks.appendChild(a);
    });
  } catch (err) {
    console.error(err);
    fileLinks.innerHTML = "❌ Error fetching files.";
  }
});
