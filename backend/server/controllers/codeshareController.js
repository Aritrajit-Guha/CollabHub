// Code share controller 
const { v4: uuidv4 } = require("uuid");

// For now, we’ll store snippets in memory
let codeSnippets = {};

// Share or Update Code
exports.updateCode = (req, res) => {
  const { code } = req.body;
  const { id } = req.params;

  if (!code) return res.status(400).json({ message: "Code is required" });

  codeSnippets[id] = { code, updatedAt: new Date() };
  res.json({ message: "Code shared/updated successfully!" });
};

// Get code by ID
exports.getCode = (req, res) => {
  const { id } = req.params;
  const snippet = codeSnippets[id];
  if (!snippet) return res.status(404).json({ message: "Code not found" });
  res.json(snippet);
};

