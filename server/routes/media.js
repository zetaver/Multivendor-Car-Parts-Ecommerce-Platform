const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadMedia, deleteMedia } = require('../controllers/mediaController');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Set up multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads/')); 
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({ storage: storage });

// Serve static files from the uploads directory
router.get('/:filename', (req, res) => {
  const filePath = path.join(__dirname, '../uploads', req.params.filename);
  res.sendFile(filePath);
});

// Media upload endpoint
router.post('/upload', upload.single('file'), uploadMedia);

// Media delete endpoint - make sure this is correctly defined
router.delete('/delete/:filename', deleteMedia);

// For debugging - log all registered routes
console.log('Media routes registered:');
router.stack.forEach((r) => {
  if (r.route && r.route.path) {
    console.log(`${Object.keys(r.route.methods).join(',')} ${r.route.path}`);
  }
});

module.exports = router; 