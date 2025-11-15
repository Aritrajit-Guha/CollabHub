// File share routes
const express = require("express");
const router = express.Router();
const fileController = require("../controllers/fileshareController");

// Upload multiple files
router.post("/upload", fileController.uploadFiles);

// Download a specific file by its ObjectId
router.get("/download/:id", fileController.downloadFile);

// Retrieve all files by share code (must be last to avoid route conflicts)
router.get("/:code", fileController.getFiles);

module.exports = router;
