const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
  filename: String,
  fileId: String,  // reference in GridFS
  shareCode: String,
  uploadedAt: { type: Date, default: Date.now },
  expiresAt: { type: Date, default: () => Date.now() + 24 * 60 * 60 * 1000 } // 24 hours expiry
});

fileSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // auto delete after 24h

module.exports = mongoose.model("File", fileSchema);
