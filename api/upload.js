const multer = require('multer');
const path = require('path');
const os = require('os');
const fs = require('fs');

const uploadDir = path.join(os.homedir(), '.kinetic', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname).toLowerCase());
  }
});

const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExtensions.includes(ext)) {
        cb(null, true);
    } else {
        cb(new Error('Unsupported media format. Use JPG, PNG, or MP4.'), false);
    }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
}).single('file');

module.exports = (req, res) => {
  upload(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Elite content exceeds 50MB limit.' });
      }
      return res.status(400).json({ error: `Upload error: ${err.message}` });
    } else if (err) {
      return res.status(500).json({ error: `Server error: ${err.message}` });
    }
    
    if (!req.file) {
      return res.status(400).json({ error: 'No media asset provided.' });
    }

    // Secondary validation for file extensions
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.mp4', '.mov', '.webm'];
    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!allowedExtensions.includes(ext)) {
      // Cleanup file if invalid extension (multer already wrote it)
      fs.unlinkSync(req.file.path);
      return res.status(415).json({ error: 'Unsupported media format. Use JPG, PNG, or MP4.' });
    }

    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });
};
