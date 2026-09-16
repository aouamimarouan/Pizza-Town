import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import sharp from 'sharp';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The original images are in frontend/public/images
const imagesBasePath = path.join(__dirname, '..', '..', 'frontend', 'public', 'images');

/**
 * GET /api/images/uploaded/:id
 * Public: Stream persistent image directly from database with caching headers.
 */
router.get('/uploaded/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { w } = req.query;

    const record = await prisma.item_images.findUnique({
      where: { id },
    });

    if (!record || !record.data) {
      return res.status(404).json({ error: 'Afbeelding niet gevonden.' });
    }

    // Convert Prisma Uint8Array to Node Buffer so Express sends raw binary image instead of JSON
    let outputBuffer = Buffer.isBuffer(record.data) ? record.data : Buffer.from(record.data);

    // Optional dynamic resize if ?w= is requested
    const width = w ? parseInt(w, 10) : null;
    if (width && !isNaN(width)) {
      outputBuffer = await sharp(outputBuffer)
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
    }

    res.setHeader('Content-Type', record.mime_type || 'image/webp');
    res.setHeader('Content-Length', outputBuffer.length);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.send(outputBuffer);
  } catch (err) {
    console.error('[Serve uploaded image error]:', err);
    res.status(500).json({ error: 'Kan afbeelding niet laden.' });
  }
});

/**
 * POST /api/images/upload
 * Admin-only: Uploads, optimizes with sharp, and persists an image to the database.
 */
router.post('/upload', authenticate, requireAdmin, async (req, res) => {
  try {
    const { image } = req.body;
    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Afbeelding data (Base64) is verplicht.' });
    }

    const matches = image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    const base64Data = matches ? matches[2] : image;
    const inputBuffer = Buffer.from(base64Data, 'base64');

    if (inputBuffer.length === 0) {
      return res.status(400).json({ error: 'Ongeldig afbeeldingsbestand.' });
    }

    // Limit maximum raw image size to 8MB
    if (inputBuffer.length > 8 * 1024 * 1024) {
      return res.status(400).json({ error: 'Afbeelding is te groot (maximaal 8MB).' });
    }

    const optimizedBuffer = await sharp(inputBuffer)
      .resize({ width: 800, height: 800, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 82 })
      .toBuffer();

    const record = await prisma.item_images.create({
      data: {
        mime_type: 'image/webp',
        data: optimizedBuffer,
      },
    });

    const imageUrl = `/api/images/uploaded/${record.id}`;
    res.status(201).json({ url: imageUrl, id: record.id });
  } catch (err) {
    console.error('[Image upload error]:', err);
    res.status(500).json({ error: 'Uploaden van afbeelding mislukt.', details: err.message });
  }
});

/**
 * DELETE /api/images/uploaded/:id
 * Admin-only: Explicitly removes an uploaded image from the database.
 */
router.delete('/uploaded/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.item_images.delete({ where: { id } });
    res.json({ success: true, message: 'Afbeelding succesvol verwijderd.' });
  } catch (err) {
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Afbeelding niet gevonden.' });
    }
    console.error('[Delete image error]:', err);
    res.status(500).json({ error: 'Verwijderen mislukt.', details: err.message });
  }
});

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
