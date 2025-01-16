const express = require('express');
const sharp = require('sharp');
const multer = require('multer');
const cors = require('cors');

const app = express();
const upload = multer({ storage: multer.memoryStorage() });

app.use(cors());

app.post('/compress', upload.array('images'), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }
    
    const format = req.body.format || 'jpeg';
    const quality = parseInt(req.body.quality) || 80;
    const keepExif = req.body.keepExif === 'true';
    
    // Get dimension settings if provided
    const maxWidth = req.body.maxWidth ? parseInt(req.body.maxWidth) : null;
    const maxHeight = req.body.maxHeight ? parseInt(req.body.maxHeight) : null;

    const compressedImages = await Promise.all(
      req.files.map(async (file) => {
        let sharpInstance = sharp(file.buffer);
        
        // Apply resize if dimensions are provided
        if (maxWidth || maxHeight) {
          sharpInstance = sharpInstance.resize(maxWidth, maxHeight, {
            fit: 'inside',
            withoutEnlargement: true
          });
        }

        if (!keepExif) {
          sharpInstance = sharpInstance.withMetadata(false);
        }

        // Format-specific compression
        switch (format) {
          case 'jpeg':
            sharpInstance = sharpInstance.jpeg({ quality, mozjpeg: true });
            break;
          case 'png':
            sharpInstance = sharpInstance.png({ quality });
            break;
          case 'webp':
            sharpInstance = sharpInstance.webp({ quality });
            break;
          case 'avif':
            sharpInstance = sharpInstance.avif({ quality });
            break;
          default:
            sharpInstance = sharpInstance.jpeg({ quality });
        }

        const compressedBuffer = await sharpInstance.toBuffer();

        return {
          name: file.originalname,
          buffer: compressedBuffer,
          format: format,
          id: file.id,
        };
      })
    );

    res.json(compressedImages.map(img => ({
      name: img.name,
      data: img.buffer.toString('base64'),
      format: img.format
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