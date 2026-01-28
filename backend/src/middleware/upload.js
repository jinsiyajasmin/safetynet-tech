// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use /tmp for Vercel or Production, or 'uploads' locally
// Note: Vercel readonly FS only allows /tmp
const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
const uploadsDir = isProduction ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');

try {
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.warn(`Failed to create uploads dir at ${uploadsDir}, falling back to /tmp/uploads`, err);
  // Fallback to /tmp if permissions fail
  if (uploadsDir !== path.join('/tmp', 'uploads')) {
    const tmpDir = path.join('/tmp', 'uploads');
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
  }
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = Date.now() + '-' + Math.random().toString(36).slice(2, 8) + ext;
    cb(null, name);
  },
});

const upload = multer({ storage });

module.exports = upload;
