import { useEffect, useRef, useState } from 'react'
import usePageStyles from '../components/usePageStyles.js'
import { createSocket } from '../services/socket.js'

export default function WhiteboardPage() {
  usePageStyles('whiteboard.css')
  const canvasRef = useRef(null)
  const socketRef = useRef(null)
  const boardIdRef = useRef(null)
  const drawingRef = useRef(false)
  const lastPointRef = useRef({ x: 0, y: 0 })
  const colorRef = useRef('#000000')
  const thicknessRef = useRef(3)
  const [color, setColor] = useState('#000000')
  const [thickness, setThickness] = useState(3)
  const [boardId, setBoardId] = useState('')

  const drawLine = (x1, y1, x2, y2, lineColor, lineThickness) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!context) return
    context.strokeStyle = lineColor
    context.lineWidth = lineThickness
    context.lineCap = 'round'
    context.beginPath()
    context.moveTo(x1, y1)
    context.lineTo(x2, y2)
    context.stroke()
  }

  const clearBoard = (skipEmit = false) => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context) return
    context.fillStyle = '#FFFFFF'
    context.fillRect(0, 0, canvas.width, canvas.height)
    if (!skipEmit && boardIdRef.current) socketRef.current?.emit('clearBoard', boardIdRef.current)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return undefined
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight - 100
    clearBoard(true)

    const socket = createSocket()
    socketRef.current = socket
    const handleDraw = (data) => {
      if (data.boardId === boardIdRef.current) {
        drawLine(data.x1, data.y1, data.x2, data.y2, data.color, data.thickness)
      }
    }
    const handleClear = (id) => {
      if (id === boardIdRef.current) clearBoard(true)
    }

    socket.on('draw', handleDraw)
    socket.on('clearBoard', handleClear)
    return () => {
      socket.off('draw', handleDraw)
      socket.off('clearBoard', handleClear)
      socket.disconnect()
    }
  }, [])

  const joinBoard = (nextBoardId) => {
    boardIdRef.current = nextBoardId
    setBoardId(nextBoardId)
    socketRef.current?.emit('joinBoard', nextBoardId)
  }

  const shareBoard = () => {
    const nextBoardId = Math.random().toString(36).substring(2, 8)
    joinBoard(nextBoardId)
    window.alert(`Share this code: ${nextBoardId}`)
  }

  const joinExistingBoard = () => {
    const nextBoardId = boardId.trim()
    if (!nextBoardId) {
      window.alert('Please enter a valid board ID to join')
      return
    }
    joinBoard(nextBoardId)
    window.alert(`Joined whiteboard: ${nextBoardId}`)
  }

  const getPoint = (event) => ({ x: event.nativeEvent.offsetX, y: event.nativeEvent.offsetY })

  const handleMouseDown = (event) => {
    drawingRef.current = true
    lastPointRef.current = getPoint(event)
  }

  const handleMouseMove = (event) => {
    if (!drawingRef.current || !boardIdRef.current) return
    const nextPoint = getPoint(event)
    const previousPoint = lastPointRef.current
    drawLine(previousPoint.x, previousPoint.y, nextPoint.x, nextPoint.y, colorRef.current, thicknessRef.current)
    socketRef.current?.emit('draw', {
      boardId: boardIdRef.current,
      x1: previousPoint.x,
      y1: previousPoint.y,
      x2: nextPoint.x,
      y2: nextPoint.y,
      color: colorRef.current,
      thickness: thicknessRef.current,
    })
    lastPointRef.current = nextPoint
  }

  return (
    <>
      <div className="toolbar">
        <div className="toolbar-left">
          <label htmlFor="colorPicker">🎨 Color:</label>
          <input
            id="colorPicker"
            type="color"
            value={color}
            onChange={(event) => {
              colorRef.current = event.target.value
              setColor(event.target.value)
            }}
          />
          <label htmlFor="thickness">🖋 Thickness:</label>
          <input
            id="thickness"
            type="range"
            min="1"
            max="20"
            value={thickness}
            onChange={(event) => {
              thicknessRef.current = Number(event.target.value)
              setThickness(Number(event.target.value))
            }}
          />
          <button type="button" id="eraseBtn" onClick={() => {
            colorRef.current = '#FFFFFF'
            setColor('#FFFFFF')
          }}>Eraser</button>
          <button type="button" id="clearBtn" onClick={() => clearBoard()}>Clear</button>
          <button type="button" id="downloadBtn" onClick={() => {
            const link = document.createElement('a')
            link.download = 'whiteboard.png'
            link.href = canvasRef.current.toDataURL('image/png')
            link.click()
          }}>Download</button>
        </div>
        <div className="toolbar-right">
          <input
            type="text"
            id="boardId"
            placeholder="Enter or share code"
            value={boardId}
            onChange={(event) => setBoardId(event.target.value)}
          />
          <button type="button" id="shareBtn" onClick={shareBoard}>Share</button>
          <button type="button" id="joinBtn" onClick={joinExistingBoard}>Join</button>
        </div>
      </div>
      <canvas
        ref={canvasRef}
        id="whiteboard"
        onMouseDown={handleMouseDown}
        onMouseUp={() => { drawingRef.current = false }}
        onMouseOut={() => { drawingRef.current = false }}
        onMouseMove={handleMouseMove}
      />
    </>
  )
}
