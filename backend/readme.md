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
FRONTEND_ORIGIN=http://localhost:5173,https://your-frontend-domain
```

Keep Gemini and MongoDB credentials in `.env`; do not expose them through the Vite frontend.
