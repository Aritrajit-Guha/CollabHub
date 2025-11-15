// server/routes/chatRoutes.js
const express = require("express");
const router = express.Router();
require("dotenv").config();

// Dynamic import for node-fetch
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

// Pass in io from main server
let ioRef;
function setSocket(io) {
  ioRef = io;
}

router.post("/", async (req, res) => {
  const { message, room, userName } = req.body;
  console.log("🪵 [Chat Debug]: Received message =>", message, "from", userName, "in room", room);

  try {
    console.log("🪵 [Chat Debug]: Sending request to Groq API...");

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant", // Using a fast model
        messages: [
          { role: "system", content: "You are CollabAI, a helpful coding assistant." },
          { role: "user", content: message },
        ],
        temperature: 0.7,
      }),
    });

    const data = await groqResponse.json();
    console.log("🪵 [Chat Debug]: Raw Groq API response:", JSON.stringify(data, null, 2));

    let aiReply = "I'm not sure about that.";
    if (data?.choices?.[0]?.message?.content) {
      aiReply = data.choices[0].message.content;
    }

    console.log(`🪵 [Chat Debug]: Emitting AI reply to room ${room || "unknown"} =>`, aiReply);

    // ✅ Emit to all users in the room via Socket.IO
    if (ioRef && room) {
      ioRef.to(room).emit("newMessage", {
        user: "CollabAI 🤖",
        message: aiReply,
      });
    }

    // Respond to the original fetch request to stop the "typing" indicator
    res.json({ reply: aiReply }); 
  } catch (error) {
    console.error("❌ [Chat Debug]: Error while calling Groq API:", error);
    res.status(500).json({ reply: "AI failed to respond." });
  }
});

// ✅ FIX: Export both the router and the setSocket function
module.exports = { router, setSocket };