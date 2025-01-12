const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

// Update compression endpoint to handle multiple files
app.post('/compress', upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const compressedImages = await Promise.all(
      req.files.map(async (file) => {
        const compressedBuffer = await sharp(file.buffer)
          .jpeg({
            quality: 80,
            mozjpeg: true,
          })
          .toBuffer();

        return {
          name: file.originalname,
          buffer: compressedBuffer
        };
      })
    );

    res.json(compressedImages.map(img => ({
      name: img.name,
      data: img.buffer.toString('base64')
    })));
  } catch (error) {
    console.error('Compression error:', error);
    res.status(500).json({ error: 'Error compressing images' });
  }
});

const PORT = process.env.PORT || 3005;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 