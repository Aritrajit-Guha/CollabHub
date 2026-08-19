import { useEffect, useRef } from 'react'
import usePageStyles from '../components/usePageStyles.js'
import { createSocket } from '../services/socket.js'

const DEFAULT_WIDTH = 1200
const DEFAULT_HEIGHT = 800

export default function FlowchartPage() {
  usePageStyles('flowchart.css')
  const canvasRef = useRef(null)
  const canvasWrapperRef = useRef(null)
  const joinButtonRef = useRef(null)
  const roomInputRef = useRef(null)
  const propPanelRef = useRef(null)
  const colorPickerRef = useRef(null)
  const textInputRef = useRef(null)
  const selectButtonRef = useRef(null)
  const connectButtonRef = useRef(null)
  const deleteButtonRef = useRef(null)
  const fontColorPickerRef = useRef(null)
  const fontSizePickerRef = useRef(null)
  const fontFamilyPickerRef = useRef(null)
  const textEditorRef = useRef(null)
  const downloadButtonRef = useRef(null)
  const expandButtonRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const canvasWrapper = canvasWrapperRef.current
    const joinButton = joinButtonRef.current
    const roomInput = roomInputRef.current
    const propPanel = propPanelRef.current
    const colorPicker = colorPickerRef.current
    const textInput = textInputRef.current
    const selectButton = selectButtonRef.current
    const connectButton = connectButtonRef.current
    const deleteButton = deleteButtonRef.current
    const fontColorPicker = fontColorPickerRef.current
    const fontSizePicker = fontSizePickerRef.current
    const fontFamilyPicker = fontFamilyPickerRef.current
    const textEditor = textEditorRef.current
    const downloadButton = downloadButtonRef.current
    const expandButton = expandButtonRef.current
    const context = canvas.getContext('2d')
    const socket = createSocket()

    const HANDLE_SIZE = 8
    const ANCHOR_SIZE = 8
    const HIT_RADIUS = 15
    const LINE_HIT_RADIUS = 10
    const TEXT_BG_PADDING = 4
    let currentRoom = ''
    let flowchartState = { nodes: [], connectors: [] }
    let selectedNode = null
    let selectedConnector = null
    let dragMode = 'none'
    let currentResizeHandle = null
    let connectStartNode = null
    let connectStartAnchor = null
    let dragOffsetX = 0
    let dragOffsetY = 0
    let lastMousePos = { x: 0, y: 0 }
    let isEditingText = false

    const isNear = (x1, y1, x2, y2, radius = HIT_RADIUS) => Math.abs(x1 - x2) < radius && Math.abs(y1 - y2) < radius
    const getHandles = (node) => {
      const { x, y, width: w, height: h } = node
      return [
        { id: 'tl', x: x - w / 2, y: y - h / 2 }, { id: 't', x, y: y - h / 2 }, { id: 'tr', x: x + w / 2, y: y - h / 2 },
        { id: 'l', x: x - w / 2, y }, { id: 'r', x: x + w / 2, y },
        { id: 'bl', x: x - w / 2, y: y + h / 2 }, { id: 'b', x, y: y + h / 2 }, { id: 'br', x: x + w / 2, y: y + h / 2 },
      ]
    }
    const getAnchors = (node) => {
      const { x, y, width: w, height: h } = node
      return [
        { id: 'top', x, y: y - h / 2 }, { id: 'right', x: x + w / 2, y },
        { id: 'bottom', x, y: y + h / 2 }, { id: 'left', x: x - w / 2, y },
      ]
    }
    const getHandleAt = (pos, node) => getHandles(node).find((handle) => isNear(pos.x, pos.y, handle.x, handle.y))
    const getAnchorAt = (pos, node) => getAnchors(node).find((anchor) => isNear(pos.x, pos.y, anchor.x, anchor.y))
    const isPointInNode = (x, y, node) => (
      x >= node.x - node.width / 2 && x <= node.x + node.width / 2
      && y >= node.y - node.height / 2 && y <= node.y + node.height / 2
    )
    const isPointOnLine = (pos, p1, p2) => {
      const denominator = Math.sqrt((p2.y - p1.y) ** 2 + (p2.x - p1.x) ** 2)
      if (!denominator) return false
      const distance = Math.abs((p2.y - p1.y) * pos.x - (p2.x - p1.x) * pos.y + p2.x * p1.y - p2.y * p1.x) / denominator
      const onSegment = pos.x >= Math.min(p1.x, p2.x) - LINE_HIT_RADIUS
        && pos.x <= Math.max(p1.x, p2.x) + LINE_HIT_RADIUS
        && pos.y >= Math.min(p1.y, p2.y) - LINE_HIT_RADIUS
        && pos.y <= Math.max(p1.y, p2.y) + LINE_HIT_RADIUS
      return distance < LINE_HIT_RADIUS && onSegment
    }
    const getMousePos = (event) => {
      const rect = canvas.getBoundingClientRect()
      return {
        x: (event.clientX - rect.left) * (canvas.width / rect.width),
        y: (event.clientY - rect.top) * (canvas.height / rect.height),
      }
    }

    const drawNode = (drawContext, node) => {
      drawContext.save()
      drawContext.shadowColor = 'rgba(0,0,0,0.1)'
      drawContext.shadowBlur = 10
      drawContext.shadowOffsetX = 2
      drawContext.shadowOffsetY = 2
      drawContext.fillStyle = node.color || '#ffffff'
      drawContext.strokeStyle = '#333'
      drawContext.lineWidth = 1.5
      if (selectedNode?.id === node.id) {
        drawContext.strokeStyle = 'var(--primary)'
        drawContext.lineWidth = 3
      }

      const { x, y, width: w, height: h } = node
      drawContext.beginPath()
      if (node.shape === 'diamond') {
        drawContext.moveTo(x, y - h / 2); drawContext.lineTo(x + w / 2, y)
        drawContext.lineTo(x, y + h / 2); drawContext.lineTo(x - w / 2, y)
      } else if (node.shape === 'oval') {
        drawContext.ellipse(x, y, w / 2, h / 2, 0, 0, 2 * Math.PI)
      } else if (node.shape === 'parallelogram') {
        drawContext.moveTo(x - w / 2 + 20, y - h / 2); drawContext.lineTo(x + w / 2, y - h / 2)
        drawContext.lineTo(x + w / 2 - 20, y + h / 2); drawContext.lineTo(x - w / 2, y + h / 2)
      } else {
        drawContext.rect(x - w / 2, y - h / 2, w, h)
      }
      drawContext.closePath()
      drawContext.fill()
      drawContext.stroke()
      drawContext.shadowColor = 'transparent'
      drawContext.fillStyle = node.fontColor || '#333333'
      drawContext.font = `${node.fontSize || 14}px ${node.fontFamily || 'Inter'}`
      drawContext.textAlign = 'center'
      drawContext.textBaseline = 'middle'
      drawContext.fillText(node.text || '', x, y)
      drawContext.restore()
    }

    const drawConnector = (drawContext, connector) => {
      const fromNode = flowchartState.nodes.find((node) => node.id === connector.fromNode)
      const toNode = flowchartState.nodes.find((node) => node.id === connector.toNode)
      if (!fromNode || !toNode) return
      const start = getAnchors(fromNode).find((anchor) => anchor.id === connector.fromAnchor) || { x: fromNode.x, y: fromNode.y }
      const end = getAnchors(toNode).find((anchor) => anchor.id === connector.toAnchor) || { x: toNode.x, y: toNode.y }
      const midX = (start.x + end.x) / 2
      const p1 = start
      const p2 = { x: midX, y: start.y }
      const p3 = { x: midX, y: end.y }
      const p4 = end
      connector.segments = [{ p1, p2 }, { p1: p2, p2: p3 }, { p1: p3, p2: p4 }]
      drawContext.beginPath()
      drawContext.strokeStyle = selectedConnector?.id === connector.id ? 'var(--primary)' : '#555'
      drawContext.lineWidth = selectedConnector?.id === connector.id ? 3 : 2
      drawContext.moveTo(p1.x, p1.y); drawContext.lineTo(p2.x, p2.y); drawContext.lineTo(p3.x, p3.y); drawContext.lineTo(p4.x, p4.y)
      drawContext.stroke()
      if (connector.text) {
        const textX = p2.x
        const textY = (p2.y + p3.y) / 2
        drawContext.font = '12px Inter'
        drawContext.textAlign = 'center'
        drawContext.textBaseline = 'middle'
        const textWidth = drawContext.measureText(connector.text).width
        drawContext.fillStyle = 'white'
        drawContext.fillRect(textX - textWidth / 2 - TEXT_BG_PADDING, textY - 7 - TEXT_BG_PADDING, textWidth + TEXT_BG_PADDING * 2, 14 + TEXT_BG_PADDING * 2)
        drawContext.fillStyle = '#333'
        drawContext.fillText(connector.text, textX, textY)
      }
    }
    const drawHandles = (drawContext, node) => getHandles(node).forEach((handle) => {
      drawContext.fillStyle = '#ffffff'; drawContext.strokeStyle = 'var(--primary)'; drawContext.lineWidth = 1
      drawContext.fillRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
      drawContext.strokeRect(handle.x - HANDLE_SIZE / 2, handle.y - HANDLE_SIZE / 2, HANDLE_SIZE, HANDLE_SIZE)
    })
    const drawAnchors = (drawContext, node) => getAnchors(node).forEach((anchor) => {
      drawContext.beginPath(); drawContext.fillStyle = '#4CAF50'; drawContext.strokeStyle = '#ffffff'; drawContext.lineWidth = 2
      drawContext.arc(anchor.x, anchor.y, ANCHOR_SIZE / 2, 0, 2 * Math.PI); drawContext.fill(); drawContext.stroke()
    })
    const draw = () => {
      context.clearRect(0, 0, canvas.width, canvas.height)
      flowchartState.connectors.forEach((connector) => drawConnector(context, connector))
      flowchartState.nodes.forEach((node) => drawNode(context, node))
      if (selectedNode && !isEditingText) {
        drawHandles(context, selectedNode)
        drawAnchors(context, selectedNode)
      }
      if (dragMode === 'connect' && connectStartAnchor) {
        context.beginPath(); context.strokeStyle = '#4CAF50'; context.lineWidth = 2; context.setLineDash([5, 5])
        context.moveTo(connectStartAnchor.x, connectStartAnchor.y)
        let snapTarget = null
        for (const node of flowchartState.nodes) {
          if (node.id === connectStartNode.id) continue
          const anchor = getAnchorAt(lastMousePos, node)
          if (anchor) { snapTarget = anchor; break }
        }
        if (snapTarget) { context.lineTo(snapTarget.x, snapTarget.y); context.strokeStyle = '#2196F3' } else context.lineTo(lastMousePos.x, lastMousePos.y)
        context.stroke(); context.setLineDash([])
      }
    }
    const setCanvasSize = (width, height) => {
      canvas.width = width; canvas.height = height
      canvas.style.width = `${width}px`; canvas.style.height = `${height}px`
      draw()
    }
    const updatePropPanel = () => {
      if (selectedNode) {
        propPanel.style.opacity = '1'; propPanel.style.pointerEvents = 'auto'
        colorPicker.value = selectedNode.color || '#ffffff'; textInput.value = selectedNode.text || ''
        fontColorPicker.value = selectedNode.fontColor || '#333333'; fontSizePicker.value = selectedNode.fontSize || 14
        fontFamilyPicker.value = selectedNode.fontFamily || 'Inter'
      } else {
        propPanel.style.opacity = '0.5'; propPanel.style.pointerEvents = 'none'; textInput.value = ''
      }
    }
    const updateCursor = (pos) => {
      if (dragMode !== 'none') return
      let cursor = 'default'
      if (selectedNode) {
        if (getAnchorAt(pos, selectedNode)) cursor = 'crosshair'
        else if (getHandleAt(pos, selectedNode)) cursor = 'pointer'
        else if (isPointInNode(pos.x, pos.y, selectedNode)) cursor = 'move'
      }
      canvasWrapper.style.setProperty('--cursor', cursor)
    }
    const resizeNode = (pos) => {
      if (!selectedNode) return
      const node = selectedNode
      let left = node.x - node.width / 2; let right = node.x + node.width / 2
      let top = node.y - node.height / 2; let bottom = node.y + node.height / 2
      if (currentResizeHandle.includes('l')) left = pos.x
      if (currentResizeHandle.includes('r')) right = pos.x
      if (currentResizeHandle.includes('t')) top = pos.y
      if (currentResizeHandle.includes('b')) bottom = pos.y
      if (right - left < 30) right = left + 30
      if (bottom - top < 30) bottom = top + 30
      node.width = right - left; node.height = bottom - top; node.x = left + node.width / 2; node.y = top + node.height / 2
    }
    const emitUpdates = () => {
      if (!selectedNode) return
      socket.emit('updateNode', {
        roomId: currentRoom,
        nodeId: selectedNode.id,
        updates: {
          color: selectedNode.color, text: selectedNode.text, fontColor: selectedNode.fontColor,
          fontSize: selectedNode.fontSize, fontFamily: selectedNode.fontFamily,
          width: selectedNode.width, height: selectedNode.height, x: selectedNode.x, y: selectedNode.y,
        },
      })
    }
    const emitConnectorUpdates = () => {
      if (selectedConnector) socket.emit('updateConnector', { roomId: currentRoom, connectorId: selectedConnector.id, updates: { text: selectedConnector.text } })
    }
    const showTextEditor = () => {
      if (isEditingText) return
      let item; let x; let y; let width; let height
      if (selectedNode) { item = selectedNode; isEditingText = 'node'; ({ x, y, width, height } = item) }
      else if (selectedConnector) {
        item = selectedConnector; isEditingText = 'connector'
        const p2 = item.segments[1].p1; const p3 = item.segments[1].p2
        x = p2.x; y = (p2.y + p3.y) / 2; width = 80; height = 20
      } else return
      textEditor.value = item.text || ''
      const canvasRect = canvas.getBoundingClientRect(); const wrapperRect = canvasWrapper.getBoundingClientRect()
      const scaleX = canvasRect.width / canvas.width; const scaleY = canvasRect.height / canvas.height
      textEditor.style.display = 'block'
      textEditor.style.top = `${canvasRect.top - wrapperRect.top + (y - height / 2) * scaleY}px`
      textEditor.style.left = `${canvasRect.left - wrapperRect.left + (x - width / 2) * scaleX}px`
      textEditor.style.width = `${width * scaleX}px`; textEditor.style.height = `${height * scaleY}px`
      textEditor.style.fontFamily = item.fontFamily || 'Inter'; textEditor.style.fontSize = `${(item.fontSize || 14) * scaleY}px`; textEditor.style.color = item.fontColor || '#333333'
      textEditor.focus(); textEditor.select()
    }
    const hideTextEditor = () => {
      if (!isEditingText) return
      if (isEditingText === 'node' && selectedNode) { selectedNode.text = textEditor.value; textInput.value = textEditor.value; emitUpdates() }
      else if (isEditingText === 'connector' && selectedConnector) { selectedConnector.text = textEditor.value; emitConnectorUpdates() }
      textEditor.style.display = 'none'; isEditingText = false; draw()
    }
    const setMode = (mode) => {
      dragMode = 'none'; selectButton.classList.toggle('active', mode === 'select'); connectButton.classList.toggle('active', mode === 'connect')
      selectedNode = null; selectedConnector = null; updatePropPanel(); draw()
    }

    const handleJoin = () => {
      const room = roomInput.value.trim()
      if (room) { currentRoom = room; socket.emit('joinFlowchart', currentRoom); joinButton.disabled = true; joinButton.innerText = 'Joined' }
    }
    const handleCanvasMouseDown = (event) => {
      if (isEditingText) { hideTextEditor(); return }
      if (!currentRoom) return
      const pos = getMousePos(event); dragMode = 'none'; selectedConnector = null
      if (selectedNode) {
        const anchor = getAnchorAt(pos, selectedNode)
        if (anchor) { dragMode = 'connect'; connectStartNode = selectedNode; connectStartAnchor = anchor; return }
        const handle = getHandleAt(pos, selectedNode)
        if (handle) { dragMode = 'resize'; currentResizeHandle = handle.id; return }
      }
      const clickedNode = [...flowchartState.nodes].reverse().find((node) => isPointInNode(pos.x, pos.y, node))
      if (clickedNode) { dragMode = 'move'; selectedNode = clickedNode; dragOffsetX = pos.x - selectedNode.x; dragOffsetY = pos.y - selectedNode.y } else selectedNode = null
      updatePropPanel(); draw()
    }
    const handleCanvasMouseMove = (event) => {
      lastMousePos = getMousePos(event); updateCursor(lastMousePos)
      if (dragMode === 'move' && selectedNode) { selectedNode.x = lastMousePos.x - dragOffsetX; selectedNode.y = lastMousePos.y - dragOffsetY }
      else if (dragMode === 'resize' && selectedNode) resizeNode(lastMousePos)
      if (dragMode !== 'none') draw()
    }
    const handleCanvasMouseUp = (event) => {
      const pos = getMousePos(event)
      if (dragMode === 'connect' && connectStartNode) {
        let dropTarget = null
        for (const node of flowchartState.nodes) {
          if (node.id === connectStartNode.id) continue
          const anchor = getAnchorAt(pos, node)
          if (anchor) { dropTarget = { node, anchor }; break }
        }
        if (dropTarget) {
          const newConnector = { id: `conn-${Date.now()}`, text: '', fromNode: connectStartNode.id, fromAnchor: connectStartAnchor.id, toNode: dropTarget.node.id, toAnchor: dropTarget.anchor.id }
          const exists = flowchartState.connectors.some((connector) => connector.fromNode === newConnector.fromNode && connector.toNode === newConnector.toNode && connector.fromAnchor === newConnector.fromAnchor && connector.toAnchor === newConnector.toAnchor)
          if (!exists) { flowchartState.connectors.push(newConnector); socket.emit('createConnector', { roomId: currentRoom, connectorData: newConnector }) }
        }
      } else if (dragMode === 'resize' && selectedNode) emitUpdates()
      else if (dragMode === 'move' && selectedNode) socket.emit('moveNode', { roomId: currentRoom, nodeId: selectedNode.id, newX: selectedNode.x, newY: selectedNode.y })
      dragMode = 'none'; currentResizeHandle = null; connectStartNode = null; connectStartAnchor = null; draw()
    }
    const handleDoubleClick = (event) => {
      const pos = getMousePos(event)
      const clickedNode = [...flowchartState.nodes].reverse().find((node) => isPointInNode(pos.x, pos.y, node))
      if (clickedNode) { selectedNode = clickedNode; selectedConnector = null; dragMode = 'none'; draw(); showTextEditor(); return }
      for (const connector of flowchartState.connectors) {
        if (!connector.segments) continue
        for (const segment of connector.segments) {
          if (isPointOnLine(pos, segment.p1, segment.p2)) { selectedConnector = connector; selectedNode = null; updatePropPanel(); draw(); showTextEditor(); return }
        }
      }
    }
    const handleDrop = (event) => {
      event.preventDefault()
      if (dragMode !== 'none' || !currentRoom) return
      const shape = event.dataTransfer.getData('shape'); const pos = getMousePos(event)
      const newNode = { id: `node-${Date.now()}`, shape, text: 'New', x: pos.x, y: pos.y, width: shape === 'diamond' ? 100 : 120, height: shape === 'diamond' ? 100 : 60, color: '#ffffff', fontSize: 14, fontFamily: 'Inter', fontColor: '#333333' }
      flowchartState.nodes.push(newNode); draw(); socket.emit('createNode', { roomId: currentRoom, nodeData: newNode })
    }
    const handleDelete = () => {
      if (selectedNode) {
        socket.emit('deleteNode', { roomId: currentRoom, nodeId: selectedNode.id })
        flowchartState.nodes = flowchartState.nodes.filter((node) => node.id !== selectedNode.id)
        flowchartState.connectors = flowchartState.connectors.filter((connector) => connector.fromNode !== selectedNode.id && connector.toNode !== selectedNode.id)
        selectedNode = null; updatePropPanel(); draw()
      } else if (selectedConnector) {
        socket.emit('deleteConnector', { roomId: currentRoom, connectorId: selectedConnector.id })
        flowchartState.connectors = flowchartState.connectors.filter((connector) => connector.id !== selectedConnector.id)
        selectedConnector = null; draw()
      }
    }
    const handleDownload = () => {
      const padding = 50
      if (!flowchartState.nodes.length) { window.alert('Canvas is empty!'); return }
      const bounds = flowchartState.nodes.reduce((result, node) => ({
        minX: Math.min(result.minX, node.x - node.width / 2), minY: Math.min(result.minY, node.y - node.height / 2),
        maxX: Math.max(result.maxX, node.x + node.width / 2), maxY: Math.max(result.maxY, node.y + node.height / 2),
      }), { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity })
      const exportCanvas = document.createElement('canvas'); exportCanvas.width = bounds.maxX - bounds.minX + padding * 2; exportCanvas.height = bounds.maxY - bounds.minY + padding * 2
      const exportContext = exportCanvas.getContext('2d'); exportContext.translate(-bounds.minX + padding, -bounds.minY + padding)
      flowchartState.connectors.forEach((connector) => drawConnector(exportContext, connector)); flowchartState.nodes.forEach((node) => drawNode(exportContext, node))
      const link = document.createElement('a'); link.href = exportCanvas.toDataURL('image/png'); link.download = 'flowchart.png'; link.click()
    }
    const handleExpand = () => {
      const newWidth = canvas.width + 400; const newHeight = canvas.height + 400
      setCanvasSize(newWidth, newHeight); socket.emit('expandCanvas', { roomId: currentRoom, newWidth, newHeight })
      canvasWrapper.scrollTop = canvas.height; canvasWrapper.scrollLeft = canvas.width
    }
    const handleNodeTextInput = () => { if (selectedNode) { selectedNode.text = textInput.value; draw(); emitUpdates() } }
    const handleColorInput = () => { if (selectedNode) { selectedNode.color = colorPicker.value; draw(); emitUpdates() } }
    const handleFontColorInput = () => { if (selectedNode) { selectedNode.fontColor = fontColorPicker.value; draw(); emitUpdates() } }
    const handleFontSizeInput = () => { if (selectedNode) { selectedNode.fontSize = fontSizePicker.value; draw(); emitUpdates() } }
    const handleFontFamilyInput = () => { if (selectedNode) { selectedNode.fontFamily = fontFamilyPicker.value; draw(); emitUpdates() } }
    const handleEditorKeyDown = (event) => { if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); hideTextEditor() } }
    const handleDragStart = (event) => event.dataTransfer.setData('shape', event.currentTarget.dataset.shape)
    const handleFlowchartUpdate = (state) => { flowchartState = state; setCanvasSize(state.width || DEFAULT_WIDTH, state.height || DEFAULT_HEIGHT) }
    const handleNewNode = (node) => { flowchartState.nodes.push(node); draw() }
    const handleNewConnector = (connector) => { if (!flowchartState.connectors.find((item) => item.id === connector.id)) flowchartState.connectors.push(connector); draw() }
    const handleNodeMoved = ({ nodeId, newX, newY }) => { const node = flowchartState.nodes.find((item) => item.id === nodeId); if (node) { node.x = newX; node.y = newY; draw() } }
    const handleNodeUpdated = ({ nodeId, updates }) => { const node = flowchartState.nodes.find((item) => item.id === nodeId); if (node) { Object.assign(node, updates); draw() } }
    const handleConnectorUpdated = ({ connectorId, updates }) => { const connector = flowchartState.connectors.find((item) => item.id === connectorId); if (connector) { Object.assign(connector, updates); draw() } }
    const handleCanvasExpanded = ({ newWidth, newHeight }) => setCanvasSize(newWidth, newHeight)
    const handleConnectorDeleted = ({ connectorId }) => { flowchartState.connectors = flowchartState.connectors.filter((connector) => connector.id !== connectorId); if (selectedConnector?.id === connectorId) selectedConnector = null; draw() }
    const handleNodeDeleted = ({ nodeId }) => { flowchartState.nodes = flowchartState.nodes.filter((node) => node.id !== nodeId); flowchartState.connectors = flowchartState.connectors.filter((connector) => connector.fromNode !== nodeId && connector.toNode !== nodeId); if (selectedNode?.id === nodeId) { selectedNode = null; updatePropPanel() } draw() }

    joinButton.addEventListener('click', handleJoin); selectButton.addEventListener('click', () => setMode('select')); connectButton.addEventListener('click', () => setMode('connect')); deleteButton.addEventListener('click', handleDelete)
    downloadButton.addEventListener('click', handleDownload); expandButton.addEventListener('click', handleExpand)
    canvas.addEventListener('mousedown', handleCanvasMouseDown); canvas.addEventListener('mousemove', handleCanvasMouseMove); canvas.addEventListener('mouseup', handleCanvasMouseUp); canvas.addEventListener('dblclick', handleDoubleClick); canvas.addEventListener('dragover', (event) => event.preventDefault()); canvas.addEventListener('drop', handleDrop)
    textEditor.addEventListener('blur', hideTextEditor); textEditor.addEventListener('keydown', handleEditorKeyDown)
    textInput.addEventListener('input', handleNodeTextInput); colorPicker.addEventListener('input', handleColorInput); fontColorPicker.addEventListener('input', handleFontColorInput); fontSizePicker.addEventListener('input', handleFontSizeInput); fontFamilyPicker.addEventListener('input', handleFontFamilyInput)
    const shapeItems = [...document.querySelectorAll('.shape-item')]; shapeItems.forEach((item) => item.addEventListener('dragstart', handleDragStart))
    socket.on('flowchartUpdate', handleFlowchartUpdate); socket.on('newNode', handleNewNode); socket.on('newConnector', handleNewConnector); socket.on('nodeMoved', handleNodeMoved); socket.on('nodeUpdated', handleNodeUpdated); socket.on('connectorUpdated', handleConnectorUpdated); socket.on('canvasExpanded', handleCanvasExpanded); socket.on('connectorDeleted', handleConnectorDeleted); socket.on('nodeDeleted', handleNodeDeleted)
    setCanvasSize(DEFAULT_WIDTH, DEFAULT_HEIGHT); setMode('select')

    return () => {
      joinButton.removeEventListener('click', handleJoin); deleteButton.removeEventListener('click', handleDelete); downloadButton.removeEventListener('click', handleDownload); expandButton.removeEventListener('click', handleExpand)
      canvas.removeEventListener('mousedown', handleCanvasMouseDown); canvas.removeEventListener('mousemove', handleCanvasMouseMove); canvas.removeEventListener('mouseup', handleCanvasMouseUp); canvas.removeEventListener('dblclick', handleDoubleClick); canvas.removeEventListener('drop', handleDrop)
      textEditor.removeEventListener('blur', hideTextEditor); textEditor.removeEventListener('keydown', handleEditorKeyDown); textInput.removeEventListener('input', handleNodeTextInput); colorPicker.removeEventListener('input', handleColorInput); fontColorPicker.removeEventListener('input', handleFontColorInput); fontSizePicker.removeEventListener('input', handleFontSizeInput); fontFamilyPicker.removeEventListener('input', handleFontFamilyInput); shapeItems.forEach((item) => item.removeEventListener('dragstart', handleDragStart))
      socket.off('flowchartUpdate', handleFlowchartUpdate); socket.off('newNode', handleNewNode); socket.off('newConnector', handleNewConnector); socket.off('nodeMoved', handleNodeMoved); socket.off('nodeUpdated', handleNodeUpdated); socket.off('connectorUpdated', handleConnectorUpdated); socket.off('canvasExpanded', handleCanvasExpanded); socket.off('connectorDeleted', handleConnectorDeleted); socket.off('nodeDeleted', handleNodeDeleted); socket.disconnect()
    }
  }, [])

  return (
    <>
      <header className="app-header">
        <div className="brand"><i className="fa-solid fa-shapes" /> CollabDraw</div>
        <div className="room-controls">
          <input ref={roomInputRef} type="text" defaultValue="flowchart123" placeholder="Room ID" />
          <button ref={joinButtonRef} type="button" className="btn-primary">Join Room</button>
          <button ref={downloadButtonRef} type="button" className="btn-secondary"><i className="fa-solid fa-download" /> Download</button>
        </div>
      </header>
      <div className="ribbon">
        <div className="tool-group">
          <button ref={selectButtonRef} type="button" className="tool-btn active"><i className="fa-solid fa-arrow-pointer" /> Select</button>
          <button ref={connectButtonRef} type="button" className="tool-btn"><i className="fa-solid fa-share-nodes" /> Connect</button>
          <button ref={deleteButtonRef} type="button" className="tool-btn text-red"><i className="fa-solid fa-trash" /></button>
        </div>
        <div className="separator" />
        <div ref={propPanelRef} className="tool-group" id="properties-panel" style={{ opacity: 0.5, pointerEvents: 'none' }}>
          <div className="prop-item"><label htmlFor="color-picker">Fill</label><input ref={colorPickerRef} id="color-picker" type="color" defaultValue="#aaddff" /></div>
          <div className="prop-item"><label htmlFor="text-input">Text</label><input ref={textInputRef} id="text-input" type="text" placeholder="Label..." /></div>
          <div className="prop-item"><label htmlFor="font-family-picker">Font</label><select ref={fontFamilyPickerRef} id="font-family-picker" defaultValue="Inter"><option value="Inter">Inter</option><option value="Arial">Arial</option><option value="Georgia">Georgia</option><option value="Times New Roman">Times</option></select></div>
          <div className="prop-item"><label htmlFor="font-size-picker">Size</label><input ref={fontSizePickerRef} id="font-size-picker" type="number" defaultValue="14" min="8" max="72" /></div>
          <div className="prop-item"><label htmlFor="font-color-picker">Color</label><input ref={fontColorPickerRef} id="font-color-picker" type="color" defaultValue="#333333" /></div>
        </div>
        <div className="tool-group ribbon-expand"><button ref={expandButtonRef} type="button" className="tool-btn"><i className="fa-solid fa-expand" /> Expand</button></div>
      </div>
      <div className="workspace">
        <div className="sidebar">
          <div className="sidebar-title">Shapes</div>
          <div className="shape-item" draggable="true" data-shape="rectangle"><div className="icon-box rect" /><span>Process</span></div>
          <div className="shape-item" draggable="true" data-shape="diamond"><div className="icon-box diamond" /><span>Decision</span></div>
          <div className="shape-item" draggable="true" data-shape="oval"><div className="icon-box oval" /><span>Start/End</span></div>
          <div className="shape-item" draggable="true" data-shape="parallelogram"><div className="icon-box para" /><span>Input</span></div>
        </div>
        <div ref={canvasWrapperRef} className="canvas-wrapper">
          <canvas ref={canvasRef} id="flowchart-canvas" width={DEFAULT_WIDTH} height={DEFAULT_HEIGHT} />
          <textarea ref={textEditorRef} id="node-text-editor" />
        </div>
      </div>
    </>
  )
}
