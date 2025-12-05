const express = require("express");
const router = express.Router();
require("dotenv").config();

// 1. Initialize Gemini Client lazily
let googleAiClient;
async function getGeminiClient() {
  if (googleAiClient) return googleAiClient;
  const { GoogleGenAI } = await import("@google/genai");
  // Use bracket notation for keys with hyphens
  googleAiClient = new GoogleGenAI({ apiKey: process.env["CollabHub-Gemini-Key"] });
  return googleAiClient;
}

// Pass in io from main server
let ioRef;
function setSocket(io) {
  ioRef = io;
}

router.post("/", async (req, res) => {
  const { message, room, userName } = req.body;

  try {
    // 2. Get the client instance
    const ai = await getGeminiClient();

    // 3. Call the Gemini API
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash", 
      config: { 
        systemInstruction: "You are CollabAI, a helpful coding assistant.",
        temperature: 0.7,
      },
      contents: [
        {
          role: "user",
          parts: [{ text: message }]
        }
      ],
    });

    // 4. Extract text
    const aiReply = response.text || "I'm not sure about that.";

    // ✅ Emit to all users in the room via Socket.IO
    if (ioRef && room) {
      ioRef.to(room).emit("newMessage", {
        user: "CollabAI 🤖",
        message: aiReply,
      });
    }

    res.json({ reply: aiReply }); 

  } catch (error) {
    // Keep this one error log so you know if the API Key fails, otherwise the server fails silently.
    console.error("Server Error:", error.message);
    res.status(500).json({ reply: "AI failed to respond." });
  }
});

module.exports = { router, setSocket };