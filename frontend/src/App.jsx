import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import HomePage from './pages/HomePage.jsx'
import CodeSharingPage from './pages/CodeSharingPage.jsx'
import FileSharingPage from './pages/FileSharingPage.jsx'
import WhiteboardPage from './pages/WhiteboardPage.jsx'
import FlowchartPage from './pages/FlowchartPage.jsx'
import ChatPage from './pages/ChatPage.jsx'
import PresentationPage from './pages/PresentationPage.jsx'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/code-sharing" element={<CodeSharingPage />} />
        <Route path="/file-sharing" element={<FileSharingPage />} />
        <Route path="/whiteboard" element={<WhiteboardPage />} />
        <Route path="/flowchart" element={<FlowchartPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/presentation" element={<PresentationPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
