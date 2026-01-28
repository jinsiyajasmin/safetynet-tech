// src/middleware/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Use /tmp for Vercel or Production, or 'uploads' locally
// Note: Vercel readonly FS only allows /tmp
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine uploads directory dynamically at runtime
    const isProduction = process.env.NODE_ENV === 'production' || process.env.VERCEL;
    let uploadsDir = isProduction ? path.join('/tmp', 'uploads') : path.join(process.cwd(), 'uploads');

    // Create directory lazily
    try {
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
    } catch (err) {
      console.warn(`Failed to create uploads dir at ${uploadsDir}, trying /tmp/uploads`, err);
      // Fallback
      uploadsDir = path.join('/tmp', 'uploads');
      if (!fs.existsSync(uploadsDir)) {
        try {
          fs.mkdirSync(uploadsDir, { recursive: true });
        } catch (e) {
          console.error('Failed to create fallback uploads dir', e);
          return cb(e);
        }
      }
    }

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
