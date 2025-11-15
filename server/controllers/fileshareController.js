// server/controllers/fileshareController.js
const mongoose = require("mongoose");
const multer = require("multer");
const crypto = require("crypto");
const File = require("../models/File");

let gfsBucket;

// When DB connects, create GridFS bucket
mongoose.connection.once("open", () => {
  gfsBucket = new mongoose.mongo.GridFSBucket(mongoose.connection.db, {
    bucketName: "uploads",
  });
  console.log("📦 GridFS bucket initialized");
});

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Generate unique share code
function generateShareCode() {
  return crypto.randomBytes(4).toString("hex").toUpperCase();
}

// Upload files
exports.uploadFiles = [
  upload.array("files"),
  async (req, res) => {
    try {
      if (!gfsBucket) {
        return res.status(500).json({ message: "Storage bucket not ready yet." });
      }

      const shareCode = generateShareCode();

      const uploadPromises = req.files.map((file) => {
        return new Promise((resolve, reject) => {
          const filename = `${Date.now()}-${file.originalname}`;
          const uploadStream = gfsBucket.openUploadStream(filename, {
            contentType: file.mimetype,
          });

          uploadStream.end(file.buffer);

          uploadStream.on("finish", async () => {
            try {
              const newFile = new File({
                filename, // ✅ use the filename we defined above
                fileId: uploadStream.id, // ✅ GridFS automatically sets this
                shareCode,
              });
              await newFile.save();
              resolve();
            } catch (err) {
              reject(err);
            }
          });

          uploadStream.on("error", reject);
        });
      });

      await Promise.all(uploadPromises);
      res.json({ success: true, shareCode });
    } catch (err) {
      console.error("❌ Upload error:", err);
      res.status(500).json({ success: false, message: "Upload failed" });
    }
  },
];

// Fetch files by share code
exports.getFiles = async (req, res) => {
  const { code } = req.params;
  try {
    const files = await File.find({ shareCode: code });
    if (!files.length)
      return res.status(404).json({ message: "No files found" });

    res.json({
      success: true,
      files: files.map((f) => ({
        filename: f.filename,
        downloadUrl: `/api/fileshare/download/${f.fileId}`,
      })),
    });
  } catch (err) {
    console.error("❌ Fetch error:", err);
    res.status(500).json({ message: "Error retrieving files" });
  }
};

// Download file
exports.downloadFile = async (req, res) => {
  const { id } = req.params;
  try {
    if (!gfsBucket)
      return res.status(500).json({ message: "Storage bucket not ready yet." });

    const fileId = new mongoose.Types.ObjectId(id);
    const files = await mongoose.connection.db
      .collection("uploads.files")
      .find({ _id: fileId })
      .toArray();

    if (!files.length)
      return res.status(404).json({ message: "File not found" });

    const file = files[0];
    res.set("Content-Type", file.contentType);
    res.set("Content-Disposition", `attachment; filename="${file.filename}"`);

    const downloadStream = gfsBucket.openDownloadStream(fileId);
    downloadStream.pipe(res);

    downloadStream.on("error", (err) => {
      console.error("❌ Download error:", err);
      res.status(500).json({ message: "Error downloading file" });
    });
  } catch (err) {
    console.error("❌ Download exception:", err);
    res.status(500).json({ message: "Error downloading file" });
  }
};
