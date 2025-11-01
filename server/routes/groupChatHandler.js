// server/routes/groupChatHandler.js

// In-memory store for code snippets
let codeSnippets = {};

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("💬 Client connected:", socket.id);

    // ============================
    // ===== GROUP CHAT LOGIC =====
    // ============================

    // Listens for 'joinRoom' (for CHAT)
    socket.on("joinRoom", ({ room, userName }) => {
      socket.join(room);
      socket.userName = userName; // Store userName on the socket
      socket.currentRoom = room; // Store the room on the socket
      console.log(`👥 ${userName} joined chat room: ${room}`);

      io.to(room).emit("newMessage", {
        user: "System",
        message: `${userName} joined the chat.`,
      });
    });

    // Listens for 'sendMessage' (for CHAT)
    socket.on("sendMessage", ({ room, user, message }) => {
      console.log(`💬 ${user} in ${room}: ${message}`);
      io.to(room).emit("newMessage", {
        user,
        message,
      });
    });

    // ================================
    // ===== CODE COLLAB LOGIC ========
    // ================================

    // ✅ FIX: Renamed to 'joinCodeRoom' to avoid conflict
    socket.on("joinCodeRoom", (roomId) => {
      socket.join(roomId);
      console.log(`💻 User joined code room: ${roomId}`);
      // Send current code to the new user
      if (codeSnippets[roomId]) {
        socket.emit("codeUpdate", codeSnippets[roomId]);
      }
    });

    socket.on("codeChange", ({ roomId, code }) => {
      codeSnippets[roomId] = code;
      // Broadcast code change to others in the same code room
      socket.to(roomId).emit("codeUpdate", code);
    });

    // ============================
    // ===== WHITEBOARD LOGIC =====
    // ============================
    
    socket.on("joinBoard", (boardId) => {
      socket.join(boardId);
      console.log(`🧩 User joined whiteboard: ${boardId}`);
    });

    socket.on("draw", (data) => {
      // Broadcast drawing data to others in the same board room
      socket.to(data.boardId).emit("draw", data);
    });

    socket.on("clearBoard", (boardId) => {
      io.to(boardId).emit("clearBoard", boardId);
    });

    // ============================
    // ===== DISCONNECT LOGIC =====
    // ============================

    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
      // Announce when a user leaves a chat
      if (socket.userName && socket.currentRoom) {
        io.to(socket.currentRoom).emit("newMessage", {
          user: "System",
          message: `${socket.userName} left the chat.`,
        });
      }
    });
  });
};