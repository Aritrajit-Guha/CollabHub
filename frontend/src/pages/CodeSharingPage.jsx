import { useEffect, useRef, useState } from 'react'
import usePageStyles from '../components/usePageStyles.js'
import { createSocket } from '../services/socket.js'

function generateCodeId() {
  return Math.random().toString(36).substring(2, 10)
}

export default function CodeSharingPage() {
  usePageStyles('codeshare.css')
  const socketRef = useRef(null)
  const typingTimeoutRef = useRef(null)
  const codeIdRef = useRef(null)
  const receiveInputRef = useRef(null)
  const [code, setCode] = useState('')
  const [codeId, setCodeId] = useState(null)
  const [receiveCodeId, setReceiveCodeId] = useState('')
  const [showReceiveInput, setShowReceiveInput] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState('connecting')

  useEffect(() => {
    const socket = createSocket()
    socketRef.current = socket

    const handleCodeUpdate = (nextCode) => setCode(nextCode)
    const handleConnect = () => setConnectionStatus('connected')
    const handleDisconnect = () => setConnectionStatus('offline')
    const handleConnectError = () => setConnectionStatus('offline')
    socket.on('codeUpdate', handleCodeUpdate)
    socket.on('connect', handleConnect)
    socket.on('disconnect', handleDisconnect)
    socket.on('connect_error', handleConnectError)

    return () => {
      socket.off('codeUpdate', handleCodeUpdate)
      socket.off('connect', handleConnect)
      socket.off('disconnect', handleDisconnect)
      socket.off('connect_error', handleConnectError)
      socket.disconnect()
      if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
    }
  }, [])

  const joinCodeRoom = (nextCodeId) => {
    codeIdRef.current = nextCodeId
    setCodeId(nextCodeId)
    socketRef.current?.emit('joinCodeRoom', nextCodeId)
  }

  const shareCode = () => joinCodeRoom(generateCodeId())

  const showReceiveCodeInput = () => {
    setShowReceiveInput(true)
    window.setTimeout(() => receiveInputRef.current?.focus(), 0)
  }

  const receiveCode = () => {
    const nextCodeId = receiveCodeId.trim()
    if (!nextCodeId) {
      return
    }
    joinCodeRoom(nextCodeId)
    setShowReceiveInput(false)
    setReceiveCodeId('')
  }

  const handleCodeChange = (event) => {
    const nextCode = event.target.value
    setCode(nextCode)
    if (!codeIdRef.current) return

    if (typingTimeoutRef.current) window.clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = window.setTimeout(() => {
      socketRef.current?.emit('codeChange', { roomId: codeIdRef.current, code: nextCode })
    }, 50)
  }

  return (
    <div className="container">
      <h1>Code Sharing (Real-time)</h1>
      <div id="modeSelection">
        <button type="button" onClick={shareCode}>Share Code</button>
        <button type="button" onClick={showReceiveCodeInput}>Receive Code</button>
      </div>
      {showReceiveInput && (
        <div id="receiveCodeForm" style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
          <input
            ref={receiveInputRef}
            type="text"
            placeholder="Enter Code ID"
            value={receiveCodeId}
            onChange={(event) => setReceiveCodeId(event.target.value)}
            onKeyDown={(event) => event.key === 'Enter' && receiveCode()}
          />
          <button type="button" onClick={receiveCode}>Join Code</button>
        </div>
      )}
      <div style={{ marginTop: '10px' }}>
        Code ID: <span id="generatedCodeId">{codeId || '---'}</span>
      </div>
      <div className="page-status" role="status">
        Socket server: {connectionStatus === 'connected' ? 'connected' : connectionStatus === 'connecting' ? 'connecting…' : 'offline — start the backend on port 5000'}
      </div>
      <textarea
        id="codeInput"
        rows="20"
        placeholder="Paste or receive code here..."
        value={code}
        onChange={handleCodeChange}
      />
    </div>
  )
}
