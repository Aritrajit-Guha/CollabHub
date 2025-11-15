const express = require("express");
const router = express.Router();
const { updateCode, getCode } = require("../controllers/codeshareController");

// GET code
router.get("/:id", getCode);

// POST share/update code
router.post("/:id", updateCode);

module.exports = router;

