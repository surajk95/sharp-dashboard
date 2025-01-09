const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const cors = require('cors');
const path = require('path');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

// Enable CORS
app.use(cors());

// Compression endpoint
app.post('/compress', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' });
    }

    const compressedBuffer = await sharp(req.file.buffer)
      .jpeg({
        quality: 80,
        mozjpeg: true,
      })
      .toBuffer();

    res.set('Content-Type', 'image/jpeg');
    res.send(compressedBuffer);
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ error: 'Error compressing image' });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 