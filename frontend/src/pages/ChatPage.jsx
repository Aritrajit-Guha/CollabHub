import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import usePageStyles from "../components/usePageStyles.js";
import { apiUrl, readJsonResponse } from "../services/api.js";
import { createSocket } from "../services/socket.js";

function getMessageType(user, currentUser) {
  if (user === "System") return "system-msg";
  if (user.includes("CollabAI")) return "ai-msg";
  if (user === currentUser) return "user-msg";
  return "other-msg";
}

export default function ChatPage() {
  usePageStyles("chatbot.css");
  const socketRef = useRef(null);
  const currentRoomRef = useRef("");
  const userNameRef = useRef("");
  const chatBoxRef = useRef(null);
  const [room, setRoom] = useState("");
  const [userName, setUserName] = useState("");
  const [nameRequired, setNameRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [waitingForAi, setWaitingForAi] = useState(false);

  useEffect(() => {
    const socket = createSocket();
    socketRef.current = socket;
    const handleNewMessage = ({ user, message: nextMessage }) => {
      if (user === userNameRef.current) return;
      setMessages((current) => [...current, { user, message: nextMessage }]);
      setWaitingForAi(false);
    };

    socket.on("newMessage", handleNewMessage);
    return () => {
      socket.off("newMessage", handleNewMessage);
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    const chatBox = chatBoxRef.current;
    if (chatBox) chatBox.scrollTop = chatBox.scrollHeight;
  }, [messages, waitingForAi]);

  const joinRoom = () => {
    const nextRoom = room.trim();
    if (!nextRoom) {
      window.alert("Please enter a valid room code!");
      return;
    }

    const nextUserName = userName.trim();
    if (!nextUserName) {
      setNameRequired(true);
      return;
    }

    currentRoomRef.current = nextRoom;
    userNameRef.current = nextUserName;
    setRoom(nextRoom);
    setUserName(nextUserName);
    setNameRequired(false);
    socketRef.current?.emit("joinRoom", {
      room: nextRoom,
      userName: nextUserName,
    });
    setMessages((current) => [
      ...current,
      {
        user: "System",
        message: `Joined room: ${nextRoom} as ${nextUserName}`,
      },
    ]);
  };

  const sendMessage = async () => {
    const nextMessage = message.trim();
    if (!nextMessage) return;
    if (!currentRoomRef.current) {
      window.alert("Join a room first!");
      return;
    }

    const currentUser = userNameRef.current;
    setMessages((current) => [
      ...current,
      { user: currentUser, message: nextMessage },
    ]);
    setMessage("");
    socketRef.current?.emit("sendMessage", {
      room: currentRoomRef.current,
      user: currentUser,
      message: nextMessage,
    });
    setWaitingForAi(true);

    try {
      const response = await fetch(apiUrl("/api/chat"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: nextMessage,
          room: currentRoomRef.current,
          userName: currentUser,
        }),
      });
      await readJsonResponse(response);
    } catch (error) {
      console.error(error);
      setWaitingForAi(false);
      setMessages((current) => [
        ...current,
        { user: "System", message: "AI could not respond.", type: "error-msg" },
      ]);
    }
  };

  return (
    <div id="chatContainer">
      <header id="chatHeader">
        <h1>💬 CollabHub Group Chat</h1>
        <div id="roomJoin">
          <input
            id="roomInput"
            type="text"
            placeholder="Enter room code..."
            value={room}
            onChange={(event) => setRoom(event.target.value)}
            onKeyDown={(event) => event.key === "Enter" && joinRoom()}
          />
          {nameRequired && (
            <input
              id="userNameInput"
              type="text"
              placeholder="Your name"
              value={userName}
              onChange={(event) => setUserName(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && joinRoom()}
            />
          )}
          <button type="button" id="joinBtn" onClick={joinRoom}>
            Join Room
          </button>
        </div>
      </header>

      <main id="chatBox" ref={chatBoxRef}>
        {messages.map((item, index) => {
          const type = item.type || getMessageType(item.user, userName);
          return (
            <div className={`message ${type}`} key={`${item.user}-${index}`}>
              <div>
                <strong>{item.user}:</strong>
              </div>
              {type === "ai-msg" ? (
                <ReactMarkdown>{item.message}</ReactMarkdown>
              ) : (
                <div>
                  {type === "system-msg" ? (
                    <em>{item.message}</em>
                  ) : (
                    item.message
                  )}
                </div>
              )}
            </div>
          );
        })}
        {waitingForAi && (
          <div className="message ai-msg">
            <em>🤖 CollabAI is typing...</em>
          </div>
        )}
      </main>

      <footer id="chatControls">
        <input
          id="userInput"
          type="text"
          placeholder="Type your message..."
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => event.key === "Enter" && sendMessage()}
        />
        <button type="button" id="sendBtn" onClick={sendMessage}>
          Send
        </button>
      </footer>
    </div>
  );
}
