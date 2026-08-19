# CollabHub backend

This directory contains the Express and Socket.IO backend for CollabHub. The React frontend lives in the sibling `frontend` directory and is developed and deployed separately.

## Run locally

Create `.env` from `.env.example`, then install and start the backend:

```bash
npm install
npm run dev
```

The server listens on `PORT` (5000 by default), exposes `/health`, and provides the `/api/chat` and `/api/fileshare` endpoints. Real-time code sharing, chat, whiteboard, and flowchart collaboration use Socket.IO.

Set `FRONTEND_ORIGIN` to a comma-separated list of allowed React application origins, for example:

```env
FRONTEND_ORIGIN=http://localhost:5173,https://collabhub-in.vercel.app
```

For a deployed backend, set `MONGO_URI`, `COLLABHUB_GEMINI_API_KEY`, and `FRONTEND_ORIGIN=https://collabhub-in.vercel.app` in the hosting provider. Render supplies `PORT` automatically; do not copy the local `PORT=5000` setting into Render unless you intentionally configure a custom Render port. Do not expose MongoDB or Gemini credentials through the Vite frontend.
