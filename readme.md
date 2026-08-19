# CollabHub

CollabHub is a real-time collaboration platform with code sharing, file sharing, a whiteboard, a flowchart editor, and an AI group chat.

The repository now contains two independent applications:

- `backend` — Express, MongoDB/GridFS, Gemini integration, and Socket.IO.
- `frontend` — Vite and React single-page application.

## Local development

Create `backend/.env` from `backend/.env.example` and add the MongoDB and Gemini values. Then run the applications in separate terminals:

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

For a deployed frontend, set `VITE_API_URL` to the deployed backend URL. For the backend, set `FRONTEND_ORIGIN` to a comma-separated list containing the local and deployed frontend origins.

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
