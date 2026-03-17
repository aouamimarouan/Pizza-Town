import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/menu — Public
router.get('/', async (req, res) => {
  try {
    const items = await prisma.menuItem.findMany({
      where: { is_available: true },
      orderBy: { category: 'asc' },
    });
    res.json(items);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/menu/:id — Public
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.menuItem.findUnique({ where: { item_id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/menu — Admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, description, price, image_url, is_available } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Name and price are required.' });
    }
    const item = await prisma.menuItem.create({
      data: { name, category, description, price: parseFloat(price), image_url, is_available: is_available ?? true },
    });
    res.status(201).json(item);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/menu/:id — Admin only
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, description, price, image_url, is_available } = req.body;
    const item = await prisma.menuItem.update({
      where: { item_id: req.params.id },
      data: {
        ...(name && { name }),
        ...(category && { category }),
        ...(description !== undefined && { description }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(image_url !== undefined && { image_url }),
        ...(is_available !== undefined && { is_available }),
      },
    });
    res.json(item);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// DELETE /api/menu/:id — Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    await prisma.menuItem.delete({ where: { item_id: req.params.id } });
    res.json({ message: 'Item deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
