import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The original images are in frontend/public/images
const imagesBasePath = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');

router.get('/:category/:filename', async (req, res) => {
  try {
    const { category, filename } = req.params;
    const { w } = req.query; // e.g. ?w=400
    
    // Construct the absolute path to the original image
    const imagePath = path.join(imagesBasePath, category, filename);

    // Prevent directory traversal attacks
    const normalizedPath = path.normalize(imagePath);
    if (!normalizedPath.startsWith(imagesBasePath)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!fs.existsSync(normalizedPath)) {
      return res.status(404).json({ error: 'Image not found' });
    }

    const width = w ? parseInt(w, 10) : null;
    let transformer = sharp(normalizedPath);

    // If a width is provided, resize the image
    if (width && !isNaN(width)) {
      transformer = transformer.resize({ width, withoutEnlargement: true });
    }

    // Determine the optimal output format (WebP if supported by client, else fallback to JPEG)
    const acceptHeader = req.get('Accept') || '';
    if (acceptHeader.includes('image/webp')) {
      transformer = transformer.webp({ quality: 80 });
      res.setHeader('Content-Type', 'image/webp');
    } else {
      transformer = transformer.jpeg({ quality: 80 });
      res.setHeader('Content-Type', 'image/jpeg');
    }

    // Set aggressive cache headers
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    
    transformer.pipe(res);
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({ error: 'Failed to process image' });
  }
});

export default router;
