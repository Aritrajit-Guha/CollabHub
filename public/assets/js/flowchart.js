// public/flowchart.js (V5 - Synchronized & Deployed)

// --- 1. SETUP & STATE ---

// ✅ FIX: Define your server's address
// This tells Socket.IO where to connect, which is required for Render
const API_BASE =
  window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1"
    ? "http://localhost:5000" // Your local backend
    : "https://collabhub-13ad.onrender.com"; // Your deployed Render backend URL

const socket = io(API_BASE); // ✅ Pass the URL to io()

const canvas = document.getElementById("flowchart-canvas");
const ctx = canvas.getContext("2d");
const canvasWrapper = document.querySelector(".canvas-wrapper");

// UI Elements
const joinBtn = document.getElementById("joinBtn");
const roomInput = document.getElementById("roomInput");
const propPanel = document.getElementById("properties-panel");
const colorPicker = document.getElementById("color-picker");
const textInput = document.getElementById("text-input");
const btnSelect = document.getElementById("mode-select");
const btnConnect = document.getElementById("mode-connect");
const btnDelete = document.getElementById("delete-btn");
const fontColorPicker = document.getElementById("font-color-picker");
const fontSizePicker = document.getElementById("font-size-picker");
const fontFamilyPicker = document.getElementById("font-family-picker");
const textEditor = document.getElementById("node-text-editor");
const btnDownload = document.getElementById("download-btn");
const btnExpand = document.getElementById("expand-btn");

// Config
const HANDLE_SIZE = 8;
const ANCHOR_SIZE = 8;
const HIT_RADIUS = 15;
const LINE_HIT_RADIUS = 10;
const TEXT_BG_PADDING = 4;

// State
let currentRoom = "";
let flowchartState = { nodes: [], connectors: [] };
let selectedNode = null;
let selectedConnector = null;
let dragMode = "none";
let currentResizeHandle = null;
let connectStartNode = null;
let connectStartAnchor = null;
let dragOffsetX = 0;
let dragOffsetY = 0;
let lastMousePos = { x: 0, y: 0 };
let isEditingText = false;

// --- 2. HELPER FUNCTIONS (COORDINATES & HIT DETECTION) ---
function getMousePos(e) {
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY
    };
}
function isNear(x1, y1, x2, y2, radius = HIT_RADIUS) {
    return Math.abs(x1 - x2) < radius && Math.abs(y1 - y2) < radius;
}
function getHandleAt(pos, node) {
    const handles = getHandles(node);
    return handles.find(h => isNear(pos.x, pos.y, h.x, h.y));
}
function getAnchorAt(pos, node) {
    const anchors = getAnchors(node);
    return anchors.find(a => isNear(pos.x, pos.y, a.x, a.y));
}
function isPointOnLine(pos, p1, p2) {
    const dist = Math.abs((p2.y - p1.y) * pos.x - (p2.x - p1.x) * pos.y + p2.x * p1.y - p2.y * p1.x) /
                 Math.sqrt(Math.pow(p2.y - p1.y, 2) + Math.pow(p2.x - p1.x, 2));
    const onSegment = pos.x >= Math.min(p1.x, p2.x) - LINE_HIT_RADIUS &&
                      pos.x <= Math.max(p1.x, p2.x) + LINE_HIT_RADIUS &&
                      pos.y >= Math.min(p1.y, p2.y) - LINE_HIT_RADIUS &&
                      pos.y <= Math.max(p1.y, p2.y) + LINE_HIT_RADIUS;
    return dist < LINE_HIT_RADIUS && onSegment;
}

// --- 3. INITIALIZATION ---
joinBtn.addEventListener("click", () => {
    const room = roomInput.value.trim();
    if (room) {
        currentRoom = room;
        socket.emit("joinFlowchart", currentRoom);
        joinBtn.disabled = true;
        joinBtn.innerText = "Joined";
    }
});
btnSelect.addEventListener("click", () => setMode("select"));
btnConnect.addEventListener("click", () => setMode("select"));
function setMode(newMode) {
    dragMode = "none";
    btnSelect.classList.toggle("active", newMode === "select");
    btnConnect.classList.toggle("active", false);
    selectedNode = null;
    selectedConnector = null;
    updatePropPanel();
    draw();
}
setMode("select");

// ✅ NEW: Helper function to set canvas size
function setCanvasSize(newWidth, newHeight) {
    canvas.width = newWidth;
    canvas.height = newHeight;
    canvas.style.width = `${newWidth}px`;
    canvas.style.height = `${newHeight}px`;
    draw();
}

// --- 4. DRAWING ---
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    flowchartState.connectors.forEach(conn => drawConnector(ctx, conn));
    flowchartState.nodes.forEach(node => drawNode(ctx, node));

    if (selectedNode && !isEditingText) {
        drawHandles(ctx, selectedNode);
        drawAnchors(ctx, selectedNode);
    }
    
    if (dragMode === "connect" && connectStartAnchor) {
        ctx.beginPath();
        ctx.strokeStyle = "#4CAF50";
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.moveTo(connectStartAnchor.x, connectStartAnchor.y);
        let snapTarget = null;
        for (const node of flowchartState.nodes) {
            if (node.id === connectStartNode.id) continue;
            const anchor = getAnchorAt(lastMousePos, node);
            if (anchor) { snapTarget = anchor; break; }
        }
        if (snapTarget) {
            ctx.lineTo(snapTarget.x, snapTarget.y);
            ctx.strokeStyle = "#2196F3";
        } else {
            ctx.lineTo(lastMousePos.x, lastMousePos.y);
        }
        ctx.stroke();
        ctx.setLineDash([]);
    }
}

function drawNode(drawCtx, node) {
    drawCtx.save();
    drawCtx.shadowColor = "rgba(0,0,0,0.1)"; drawCtx.shadowBlur = 10; drawCtx.shadowOffsetX = 2; drawCtx.shadowOffsetY = 2;
    drawCtx.fillStyle = node.color || "#ffffff";
    drawCtx.strokeStyle = "#333"; drawCtx.lineWidth = 1.5;

    if (selectedNode && selectedNode.id === node.id) {
        drawCtx.strokeStyle = "var(--primary)"; drawCtx.lineWidth = 3;
    }

    const x = node.x; const y = node.y;
    const w = node.width; const h = node.height;

    drawCtx.beginPath();
    if (node.shape === 'diamond') {
        drawCtx.moveTo(x, y - h/2); drawCtx.lineTo(x + w/2, y);
        drawCtx.lineTo(x, y + h/2); drawCtx.lineTo(x - w/2, y);
    } else if (node.shape === 'oval') {
        drawCtx.ellipse(x, y, w/2, h/2, 0, 0, 2 * Math.PI);
    } else if (node.shape === 'parallelogram') {
        drawCtx.moveTo(x - w/2 + 20, y - h/2); drawCtx.lineTo(x + w/2, y - h/2);
        drawCtx.lineTo(x + w/2 - 20, y + h/2); drawCtx.lineTo(x - w/2, y + h/2);
    } else {
        drawCtx.rect(x - w/2, y - h/2, w, h);
    }
    drawCtx.closePath();
    drawCtx.fill();
    drawCtx.stroke();

    drawCtx.shadowColor = "transparent";
    drawCtx.fillStyle = node.fontColor || "#333333";
    drawCtx.font = `${node.fontSize || '14'}px ${node.fontFamily || 'Inter'}`;
    drawCtx.textAlign = "center";
    drawCtx.textBaseline = "middle";
    drawCtx.fillText(node.text || "", x, y);
    drawCtx.restore();
}

function drawConnector(drawCtx, connector) {
    const fromNode = flowchartState.nodes.find(n => n.id === connector.fromNode);
    const toNode = flowchartState.nodes.find(n => n.id === connector.toNode);
    if (!fromNode || !toNode) return;

    const start = getAnchors(fromNode).find(a => a.id === connector.fromAnchor) || {x: fromNode.x, y: fromNode.y};
    const end = getAnchors(toNode).find(a => a.id === connector.toAnchor) || {x: toNode.x, y: toNode.y};

    drawCtx.beginPath();
    drawCtx.strokeStyle = (selectedConnector && selectedConnector.id === connector.id) ? "var(--primary)" : "#555";
    drawCtx.lineWidth = (selectedConnector && selectedConnector.id === connector.id) ? 3 : 2;

    const midX = (start.x + end.x) / 2;
    const p1 = start;
    const p2 = { x: midX, y: start.y };
    const p3 = { x: midX, y: end.y };
    const p4 = end;

    connector.segments = [ {p1, p2}, {p1: p2, p2: p3}, {p1: p3, p2: p4} ];

    drawCtx.moveTo(p1.x, p1.y);
    drawCtx.lineTo(p2.x, p2.y);
    drawCtx.lineTo(p3.x, p3.y);
    drawCtx.lineTo(p4.x, p4.y);
    drawCtx.stroke();

    if (connector.text) {
        const textX = p2.x;
        const textY = (p2.y + p3.y) / 2;
        drawCtx.font = "12px Inter";
        drawCtx.textAlign = "center";
        drawCtx.textBaseline = "middle";
        const textWidth = drawCtx.measureText(connector.text).width;
        
        drawCtx.fillStyle = "white";
        drawCtx.fillRect(textX - textWidth/2 - TEXT_BG_PADDING, textY - 7 - TEXT_BG_PADDING, textWidth + (TEXT_BG_PADDING*2), 14 + (TEXT_BG_PADDING*2));
        
        drawCtx.fillStyle = "#333";
        drawCtx.fillText(connector.text, textX, textY);
    }
}

function drawHandles(drawCtx, node) {
    const handles = getHandles(node);
    handles.forEach(handle => {
        drawCtx.fillStyle = "#ffffff";
        drawCtx.strokeStyle = "var(--primary)";
        drawCtx.lineWidth = 1;
        drawCtx.fillRect(handle.x - HANDLE_SIZE/2, handle.y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
        drawCtx.strokeRect(handle.x - HANDLE_SIZE/2, handle.y - HANDLE_SIZE/2, HANDLE_SIZE, HANDLE_SIZE);
    });
}

function drawAnchors(drawCtx, node) {
    const anchors = getAnchors(node);
    anchors.forEach(anchor => {
        drawCtx.beginPath();
        drawCtx.fillStyle = "#4CAF50";
        drawCtx.strokeStyle = "#ffffff";
        drawCtx.lineWidth = 2;
        drawCtx.arc(anchor.x, anchor.y, ANCHOR_SIZE/2, 0, 2 * Math.PI);
        drawCtx.fill();
        drawCtx.stroke();
    });
}

// --- 5. GEOMETRY HELPERS ---
function getHandles(node) {
    const x = node.x; const y = node.y; const w = node.width; const h = node.height;
    return [
        { id: 'tl', x: x - w/2, y: y - h/2 }, { id: 't', x: x, y: y - h/2 }, { id: 'tr', x: x + w/2, y: y - h/2 },
        { id: 'l', x: x - w/2, y: y },                                     { id: 'r', x: x + w/2, y: y },
        { id: 'bl', x: x - w/2, y: y + h/2 }, { id: 'b', x: x, y: y + h/2 }, { id: 'br', x: x + w/2, y: y + h/2 }
    ];
}
function getAnchors(node) {
    const x = node.x; const y = node.y; const w = node.width; const h = node.height;
    if (node.shape === 'diamond') {
        return [
            { id: 'top', x: x, y: y - h/2 }, { id: 'right', x: x + w/2, y: y },
            { id: 'bottom', x: x, y: y + h/2 }, { id: 'left', x: x - w/2, y: y }
        ];
    }
    return [
        { id: 'top', x: x, y: y - h/2 }, { id: 'right', x: x + w/2, y: y },
        { id: 'bottom', x: x, y: y + h/2 }, { id: 'left', x: x - w/2, y: y }
    ];
}
function isPointInNode(x, y, node) {
    return (x >= node.x - node.width/2 && x <= node.x + node.width/2 &&
            y >= node.y - node.height/2 && y <= node.y + node.height/2);
}

// --- 6. MOUSE INTERACTION ---
canvas.addEventListener("mousedown", (e) => {
    if (isEditingText) return hideTextEditor(); 
    if (!currentRoom) return;
    const pos = getMousePos(e);
    dragMode = "none";
    selectedConnector = null; 
    if (selectedNode) {
        const anchor = getAnchorAt(pos, selectedNode);
        if (anchor) {
            dragMode = "connect";
            connectStartNode = selectedNode;
            connectStartAnchor = anchor;
            return;
        }
        const handle = getHandleAt(pos, selectedNode);
        if (handle) {
            dragMode = "resize";
            currentResizeHandle = handle.id;
            return;
        }
    }
    const clickedNode = flowchartState.nodes.slice().reverse().find(n => isPointInNode(pos.x, pos.y, n));
    if (clickedNode) {
        dragMode = "move";
        selectedNode = clickedNode;
        dragOffsetX = pos.x - selectedNode.x;
        dragOffsetY = pos.y - selectedNode.y;
    } else {
        selectedNode = null;
    }
    updatePropPanel();
    draw();
});
canvas.addEventListener("mousemove", (e) => {
    lastMousePos = getMousePos(e); updateCursor(lastMousePos);
    if (dragMode === "move" && selectedNode) {
        selectedNode.x = lastMousePos.x - dragOffsetX; selectedNode.y = lastMousePos.y - dragOffsetY;
    } else if (dragMode === "resize" && selectedNode) {
        resizeNode(lastMousePos);
    }
    if (dragMode !== "none") draw();
});
canvas.addEventListener("mouseup", (e) => {
    const pos = getMousePos(e);
    if (dragMode === "connect" && connectStartNode) {
        let dropTarget = null;
        for (const node of flowchartState.nodes) {
            if (node.id === connectStartNode.id) continue;
            const anchor = getAnchorAt(pos, node);
            if (anchor) { dropTarget = { node, anchor }; break; }
        }
        if (dropTarget) {
            const newConn = {
                id: `conn-${Date.now()}`, text: "",
                fromNode: connectStartNode.id, fromAnchor: connectStartAnchor.id,
                toNode: dropTarget.node.id, toAnchor: dropTarget.anchor.id
            };
            const exists = flowchartState.connectors.some(c => c.fromNode === newConn.fromNode && c.toNode === newConn.toNode && c.fromAnchor === newConn.fromAnchor && c.toAnchor === newConn.toAnchor);
            if(!exists) {
                flowchartState.connectors.push(newConn);
                socket.emit("createConnector", { roomId: currentRoom, connectorData: newConn });
            }
        }
    } else if (dragMode === "resize" && selectedNode) {
        emitUpdates();
    } else if (dragMode === "move" && selectedNode) {
        socket.emit("moveNode", { roomId: currentRoom, nodeId: selectedNode.id, newX: selectedNode.x, newY: selectedNode.y });
    }
    dragMode = "none"; currentResizeHandle = null; connectStartNode = null; connectStartAnchor = null;
    draw();
});
function resizeNode(pos) {
    if (!selectedNode) return;
    const node = selectedNode;
    let left = node.x - node.width/2; let right = node.x + node.width/2;
    let top = node.y - node.height/2; let bottom = node.y + node.height/2;
    if (currentResizeHandle.includes('l')) left = pos.x;
    if (currentResizeHandle.includes('r')) right = pos.x;
    if (currentResizeHandle.includes('t')) top = pos.y;
    if (currentResizeHandle.includes('b')) bottom = pos.y;
    if (right - left < 30) right = left + 30;
    if (bottom - top < 30) bottom = top + 30;
    node.width = right - left; node.height = bottom - top;
    node.x = left + node.width/2; node.y = top + node.height/2;
}
function updateCursor(pos) {
    if (dragMode !== "none") return;
    let newCursor = "default";
    if (selectedNode) {
        if (getAnchorAt(pos, selectedNode)) { newCursor = "crosshair"; }
        else if (getHandleAt(pos, selectedNode)) { newCursor = "pointer"; }
        else if (isPointInNode(pos.x, pos.y, selectedNode)) { newCursor = "move"; }
    }
    canvasWrapper.style.setProperty("--cursor", newCursor);
}

// --- 7. PROPERTY & TEXT EDITING ---
function updatePropPanel() {
    if (selectedNode) {
        propPanel.style.opacity = "1"; propPanel.style.pointerEvents = "auto";
        colorPicker.value = selectedNode.color || "#ffffff";
        textInput.value = selectedNode.text || "";
        fontColorPicker.value = selectedNode.fontColor || "#333333";
        fontSizePicker.value = selectedNode.fontSize || "14";
        fontFamilyPicker.value = selectedNode.fontFamily || "Segoe UI";
    } else {
        propPanel.style.opacity = "0.5"; propPanel.style.pointerEvents = "none";
        textInput.value = "";
    }
}
textInput.addEventListener("input", () => { if(selectedNode) {selectedNode.text = textInput.value; draw(); emitUpdates();}});
colorPicker.addEventListener("input", () => { if(selectedNode) {selectedNode.color = colorPicker.value; draw(); emitUpdates();}});
fontColorPicker.addEventListener("input", () => { if(selectedNode) {selectedNode.fontColor = fontColorPicker.value; draw(); emitUpdates();}});
fontSizePicker.addEventListener("input", () => { if(selectedNode) {selectedNode.fontSize = fontSizePicker.value; draw(); emitUpdates();}});
fontFamilyPicker.addEventListener("input", () => { if(selectedNode) {selectedNode.fontFamily = fontFamilyPicker.value; draw(); emitUpdates();}});

btnDelete.addEventListener("click", () => {
    if(selectedNode) {
        socket.emit("deleteNode", { roomId: currentRoom, nodeId: selectedNode.id });
        flowchartState.nodes = flowchartState.nodes.filter(n => n.id !== selectedNode.id);
        flowchartState.connectors = flowchartState.connectors.filter(c => c.fromNode !== selectedNode.id && c.toNode !== selectedNode.id);
        selectedNode = null; updatePropPanel(); draw();
    } else if (selectedConnector) {
        socket.emit("deleteConnector", { roomId: currentRoom, connectorId: selectedConnector.id });
        flowchartState.connectors = flowchartState.connectors.filter(c => c.id !== selectedConnector.id);
        selectedConnector = null; draw();
    }
});
function emitUpdates() {
    if (selectedNode) {
        socket.emit("updateNode", {
            roomId: currentRoom, nodeId: selectedNode.id,
            updates: { 
                color: selectedNode.color, text: selectedNode.text,
                fontColor: selectedNode.fontColor, fontSize: selectedNode.fontSize, fontFamily: selectedNode.fontFamily,
                width: selectedNode.width, height: selectedNode.height, x: selectedNode.x, y: selectedNode.y
            }
        });
    }
}
function emitConnectorUpdates() {
    if (selectedConnector) {
        socket.emit("updateConnector", {
            roomId: currentRoom,
            connectorId: selectedConnector.id,
            updates: { text: selectedConnector.text }
        });
    }
}
function showTextEditor() {
    if (isEditingText) return;
    let item, x, y, w, h;
    if (selectedNode) {
        item = selectedNode; isEditingText = "node";
        x = item.x; y = item.y; w = item.width; h = item.height;
    } else if (selectedConnector) {
        item = selectedConnector; isEditingText = "connector";
        const p2 = item.segments[1].p1; const p3 = item.segments[1].p2;
        x = p2.x; y = (p2.y + p3.y) / 2; w = 80; h = 20;
    } else { return; }
    textEditor.value = item.text || "";
    const canvasRect = canvas.getBoundingClientRect();
    const wrapperRect = canvasWrapper.getBoundingClientRect();
    const scaleX = canvasRect.width / canvas.width;
    const scaleY = canvasRect.height / canvas.height;
    textEditor.style.display = "block";
    textEditor.style.top = `${(canvasRect.top - wrapperRect.top) + (y - h/2) * scaleY}px`;
    textEditor.style.left = `${(canvasRect.left - wrapperRect.left) + (x - w/2) * scaleX}px`;
    textEditor.style.width = `${w * scaleX}px`;
    textEditor.style.height = `${h * scaleY}px`;
    textEditor.style.fontFamily = item.fontFamily || 'Inter';
    textEditor.style.fontSize = `${(item.fontSize || 14) * scaleY}px`;
    textEditor.style.color = item.fontColor || '#333333';
    textEditor.focus(); textEditor.select();
}
function hideTextEditor() {
    if (!isEditingText) return;
    if (isEditingText === "node" && selectedNode) {
        selectedNode.text = textEditor.value;
        textInput.value = textEditor.value;
        emitUpdates();
    } else if (isEditingText === "connector" && selectedConnector) {
        selectedConnector.text = textEditor.value;
        emitConnectorUpdates();
    }
    textEditor.style.display = "none";
    isEditingText = false;
    draw();
}
canvas.addEventListener("dblclick", (e) => {
    const pos = getMousePos(e);
    const clickedNode = flowchartState.nodes.slice().reverse().find(n => isPointInNode(pos.x, pos.y, n));
    if (clickedNode) {
        selectedNode = clickedNode; selectedConnector = null;
        dragMode = "none"; draw(); showTextEditor(); return;
    }
    for (const conn of flowchartState.connectors) {
        if (!conn.segments) continue;
        for (const seg of conn.segments) {
            if (isPointOnLine(pos, seg.p1, seg.p2)) {
                selectedConnector = conn; selectedNode = null;
                updatePropPanel(); draw(); showTextEditor(); return;
            }
        }
    }
});
textEditor.addEventListener("blur", hideTextEditor);
textEditor.addEventListener("keydown", (e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); hideTextEditor(); } });


// --- 8. NEW FEATURES (DOWNLOAD & EXPAND) ---

btnDownload.addEventListener("click", () => {
    const PADDING = 50;
    if (flowchartState.nodes.length === 0) return alert("Canvas is empty!");
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    flowchartState.nodes.forEach(node => {
        minX = Math.min(minX, node.x - node.width / 2);
        minY = Math.min(minY, node.y - node.height / 2);
        maxX = Math.max(maxX, node.x + node.width / 2);
        maxY = Math.max(maxY, node.y + node.height / 2);
    });
    const exportWidth = (maxX - minX) + (PADDING * 2);
    const exportHeight = (maxY - minY) + (PADDING * 2);
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = exportWidth;
    exportCanvas.height = exportHeight;
    const exportCtx = exportCanvas.getContext('2d');
    exportCtx.translate(-minX + PADDING, -minY + PADDING);
    flowchartState.connectors.forEach(conn => drawConnector(exportCtx, conn));
    flowchartState.nodes.forEach(node => drawNode(exportCtx, node));
    const dataUrl = exportCanvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = 'flowchart.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
});

// ✅ MODIFIED: This is the new, correct expand function
btnExpand.addEventListener("click", () => {
    // 1. Get the new dimensions
    const newWidth = canvas.width + 400;
    const newHeight = canvas.height + 400;

    // 2. Apply locally *immediately*
    setCanvasSize(newWidth, newHeight);
    
    // 3. Tell the server to broadcast this
    socket.emit("expandCanvas", {
        roomId: currentRoom,
        newWidth: newWidth,
        newHeight: newHeight
    });
    
    // 4. Scroll to the new bottom-right
    canvasWrapper.scrollTop = canvas.height;
    canvasWrapper.scrollLeft = canvas.width;
});


// --- 9. DRAG/DROP & SOCKETS ---
document.querySelectorAll(".shape-item").forEach(item => item.addEventListener("dragstart", (e) => e.dataTransfer.setData("shape", e.currentTarget.dataset.shape)));
canvas.addEventListener("dragover", e => e.preventDefault());
canvas.addEventListener("drop", (e) => {
    e.preventDefault();
    if (dragMode !== "none") return;
    if (!currentRoom) return alert("Join a room first!");
    const shapeType = e.dataTransfer.getData("shape");
    const pos = getMousePos(e);
    const newNode = {
        id: `node-${Date.now()}`, shape: shapeType, text: "New",
        x: pos.x, y: pos.y, width: 120, height: 60,
        color: "#ffffff", fontSize: 14, fontFamily: 'Inter', fontColor: '#333333'
    };
    if (shapeType === 'diamond') { newNode.width = 100; newNode.height = 100; }
    flowchartState.nodes.push(newNode);
    draw();
    socket.emit("createNode", { roomId: currentRoom, nodeData: newNode });
});

// Socket Listeners
// ✅ MODIFIED: On join, set canvas to the saved size
socket.on("flowchartUpdate", (state) => { 
    flowchartState = state; 
    // Set canvas to the size stored on the server
    setCanvasSize(state.width || 1200, state.height || 800);
    // draw() is called inside setCanvasSize()
});

socket.on("newNode", (node) => { flowchartState.nodes.push(node); draw(); });
socket.on("newConnector", (conn) => { 
    if (!flowchartState.connectors.find(c => c.id === conn.id)) {
        flowchartState.connectors.push(conn);
    }
    draw(); 
});
socket.on("nodeMoved", (data) => { const n = flowchartState.nodes.find(x => x.id === data.nodeId); if(n) { n.x = data.newX; n.y = data.newY; draw(); } });
socket.on("nodeUpdated", (data) => { const n = flowchartState.nodes.find(x => x.id === data.nodeId); if(n) { Object.assign(n, data.updates); draw(); } });
socket.on("connectorUpdated", (data) => {
    const c = flowchartState.connectors.find(x => x.id === data.connectorId);
    if(c) { Object.assign(c, data.updates); draw(); }
});

// ✅ NEW: Listen for other users expanding the canvas
socket.on("canvasExpanded", (data) => {
    console.log("Canvas expanded by another user");
    setCanvasSize(data.newWidth, data.newHeight);
});

socket.on("connectorDeleted", (data) => {
    flowchartState.connectors = flowchartState.connectors.filter(c => c.id !== data.connectorId);
    if (selectedConnector && selectedConnector.id === data.connectorId) {
        selectedConnector = null;
    }
    draw();
});
socket.on("nodeDeleted", (data) => {
    flowchartState.nodes = flowchartState.nodes.filter(n => n.id !== data.nodeId);
    flowchartState.connectors = flowchartState.connectors.filter(c => c.fromNode !== data.nodeId && c.toNode !== data.nodeId);
    if (selectedNode && selectedNode.id === data.nodeId) { selectedNode = null; updatePropPanel(); }
    draw();
});