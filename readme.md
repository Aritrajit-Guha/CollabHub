# CollabHub

CollabHub is a real-time collaboration platform with code sharing, file sharing, a whiteboard, a flowchart editor, and an AI group chat.

The repository now contains two independent applications:

- `backend` — Express, MongoDB/GridFS, Gemini integration, and Socket.IO.
- `frontend` — Vite and React single-page application.

## Local development

Create `.env` in both `backend` and `frontend` from their `.env.example` files, then add the local values for VS Code development. In Vercel and Render, enter the production values directly in the platform environment-variable settings. Then run the applications in separate terminals:

```bash
cd backend
npm install
npm run dev
```

```bash
cd frontend
npm install
npm run dev
```

The React application runs at `http://localhost:5173` and calls the backend at the URL configured by `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000
```

For Vercel, set `VITE_API_URL=https://collabhub-13ad.onrender.com`. For Render, set `MONGO_URI`, `COLLABHUB_GEMINI_API_KEY`, and `FRONTEND_ORIGIN=https://collabhub-in.vercel.app` in the service environment settings. The deployment platforms provide their runtime environment variables directly; no separate production env file is required.

## Routes

The React frontend provides `/`, `/code-sharing`, `/file-sharing`, `/whiteboard`, `/flowchart`, `/chat`, and `/presentation`.

## Verification

```bash
cd frontend
npm run lint
npm run build
```

```bash
cd backend
npm start
```

The backend health check is available at `/health`.
