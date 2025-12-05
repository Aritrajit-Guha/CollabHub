# 🚀 CollabHub – Real-Time Collaboration & AI-Powered Productivity Platform

## 📖 Overview
**CollabHub** is a next-generation productivity and collaboration platform built for developers, teams, students, and tech communities.

It brings **real-time teamwork**, **AI-powered assistance**, and **instant sharing tools** under one seamless interface. Whether you are debugging code with friends, brainstorming ideas on a whiteboard, creating flowcharts together, or sharing files instantly — **CollabHub** makes teamwork effortless, fast, and fun.

### 🔥 Key Highlights:
* ✔ **Real-time code sharing & editing** using Socket.io
* ✔ **AI group chat** powered by Gemini 2.0 Flash
* ✔ **Instant file sharing** using MongoDB + GridFS
* ✔ **Live multi-user whiteboard**
* ✔ **Collaborative flowchart builder**
* ✔ **Clean futuristic UI** and frictionless UX
* ✔ **Files auto-delete in 24 hours** to save storage

---

## 🎯 Innovation & Impact

### 🌍 Why CollabHub is Different
Traditional tools limit collaboration — only one person controls the screen or code. **CollabHub** makes collaboration equal for everyone, ensuring:
* ✨ **Shared control** instead of one-way code sharing
* ✨ **Real-time AI help** for entire groups
* ✨ **Fast file transfers** without cloud storage accounts
* ✨ **Visual collaboration tools** (whiteboard + flowchart) in one place

### 👨‍🏫 Who Can Use It?
* **Students** — Study groups, coding practice, project work
* **Developers** — Debugging, brainstorming, pair programming
* **Teams** — Real-time planning & diagramming
* **Educators** — Explain concepts visually with live tools

---

## 🚀 Features

### 🔹 Real-Time Code Sharing (Live Collaboration)
* Users generate a unique code share ID.
* Others join using this ID.
* Everyone’s editor stays synced instantly.
* Fix mistakes together in real-time.
* **Perfect for:** Debugging, teaching, or team coding.
> 📌 **Note:** No single “owner” — every connected member can edit simultaneously.

### 🔹 AI-Powered Group Chat
* Uses **Gemini 2.0 Flash** for instant, accurate answers.
* Works inside group rooms (like CodeShare.io).
* **Supports:** Code explanations, debugging help, concept breakdowns, and theory questions.
* Real-time chat built on **Socket.io**.
> 💬 Ask together, learn together.

### 🔹 File Sharing (Fast, Secure, Auto-Cleanup)
* Upload any file (📁 PDF, JPG, PNG, ZIP, DOCX, etc.).
* Files stored in **MongoDB GridFS**.
* Generates a share code so anyone can download instantly.
* **Files auto-delete in 24 hours** to optimize storage.
> ✔ No login needed | ✔ Unlimited file types | ✔ Secure temporary storage

### 🔹 Real-Time Whiteboard
* Multi-user drawing board.
* **Ideal for:** Flowcharts, diagrams, math problems, brainstorming.
* **Tools:** Color control, brush thickness, eraser, clear board, download canvas.
> 🎨 Fully live — every stroke syncs across all connected users.

### 🔹 Collaborative Flowchart Builder
* Add shapes: **Process, Decision, Start/End, Input**.
* Drag, drop, and resize elements.
* Create professional flowcharts together.
* Built for assignments, presentations, and planning.
> 🧩 Supports real-time collaboration using Socket.io.

### 🔹 Presentation Workspace
* Upload slides / content.
* Collaborate on notes and explanations.
* Great for team presentations and classroom use.

---

## 🛠️ Tech Stack

### 🎨 Frontend
* HTML5
* Vanilla CSS (Futuristic/Glassmorphism Design)
* Vanilla JavaScript

### 🧠 Backend & Real-Time Engine
* Node.js
* Express.js
* Socket.io

### 🗄️ Database
* MongoDB + GridFS (for large and binary file storage)

### 🤖 AI
* **Gemini 2.0 Flash API** (for AI chat & solutions)

---

## 📸 Screenshots

| Home Menu | Whiteboard | Code Sharing |
|:---:|:---:|:---:|
| ![Home](./public/assets/images/Screenshot%20(33).png) | ![Whiteboard](./public/assets/images/Screenshot%20(31).png) | ![Code](./public/assets/images/Screenshot%20(36).png) |

| File Sharing | Flowchart Builder | AI Group Chat |
|:---:|:---:|:---:|
| ![File Share](./public/assets/images/Screenshot%20(37).png) | ![Flowchart](./public/assets/images/Screenshot%20(38).png) | ![AI Chat](./public/assets/images/Screenshot%20(39).png) |

---

## ⚙️ How It Works

1.  **Choose a workspace** → Code, Whiteboard, Flowchart, File Share, etc.
2.  **Generate or enter a room code**.
3.  **Start collaborating instantly**.
4.  **Use AI assistant** for real-time solutions.
5.  **Share or download** results.

> Everything works without login, designed for speed and simplicity.

---

## ⚡ Installation  
1️⃣ **Clone the Repository:**  
```bash   
git clone https://github.com/Aritrajit-Guha/CollabHub.git  
cd CollabHub  
```  


2️⃣ **Install Dependencies:**  
```bash
npm install  
```  

3️⃣ **Set Up Environment Variables:**  
Create a `.env` file and add your Gemini API Key:  
```env  
MONGO_URI=your_mongodb_connection
GEMINI_API_KEY=your_google_gemini_key
PORT=5000  
```  

4️⃣ **Start Backend Server:**  
**Backend:**
```bash  
npm start
```  

5️⃣**Frontend:**  
No build tools required — simply open:
```pysql
/public/index.html
```
Or run a simple live server:
```
npx live-server public
```

## 🔐 AI Configuration (Gemini 2.0 Flash)


### 🔑 Gemini API Key Setup  
> ⚠️ Please add your Gemini API key in the `.env` file before running the application.
> 
> **Showcase:**  
``` .env 
GEMINI_API_KEY=your_api_key_here
``` 

---

## 🤝 Contributing  
Contributions are welcome! 🎉
You can:

- **🐞 Report Bugs** 
- **🌟 Suggest new features**
- **🔧 Submit pull requests**

## 🔗 Connect with us  

* [![GitHub](https://img.shields.io/badge/GitHub-181717?style=for-the-badge&logo=github&logoColor=white)](https://https://github.com/Aritrajit-Guha)  
* [![LinkedIn](https://img.shields.io/badge/LinkedIn-0077B5?style=for-the-badge&logo=linkedin&logoColor=white)](https://www.linkedin.com/in/aritrajit-guha-9695b3322/)  
* [![Email](https://img.shields.io/badge/Email-D14836?style=for-the-badge&logo=gmail&logoColor=white)](mailto:aritrajitguha123@gmail.com)