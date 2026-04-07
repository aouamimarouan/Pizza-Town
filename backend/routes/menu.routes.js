import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { logAdminAction } from '../lib/auditLogger.js';

const router = Router();
const sanitizeItem = (item) => {
  if (!item) return null;
  return {
    ...item,
    price: item.price ? parseFloat(item.price.toString()) : 0
  };
};

// GET /api/menu — Public
router.get('/', async (req, res) => {
  try {
    const items = await prisma.menuitems.findMany({
      where: { is_available: true },
      orderBy: { category: 'asc' },
    });
    res.json(items.map(sanitizeItem));
  } catch (err) {
    console.error('[Menu GET error]:', err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

// GET /api/menu/:id — Public
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.menuitems.findUnique({ where: { item_id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found.' });
    res.json(sanitizeItem(item));
  } catch (err) {
    console.error(`[Menu GET item ${req.params.id} error]:`, err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

// POST /api/menu — Admin only
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, description, price, image_url, is_available } = req.body;
    if (!name || isNaN(parseFloat(price)) || parseFloat(price) < 0) {
      return res.status(400).json({ error: 'Name and a valid non-negative price are required.' });
    }
    const item = await prisma.menuitems.create({
      data: { 
        item_id: randomUUID(),
        name, 
        category, 
        description, 
        price: parseFloat(price), 
        image_url, 
        is_available: is_available ?? true 
      },
    });

    // Logging
    await logAdminAction(req.user.user_id, 'CREATE', 'MenuItem', item.item_id, sanitizeItem(item));

    res.status(201).json(sanitizeItem(item));
  } catch (err) {
    console.error('[Menu POST error]:', err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

// PUT /api/menu/:id — Admin only
router.put('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { name, category, description, price, image_url, is_available } = req.body;
    if (price !== undefined && (isNaN(parseFloat(price)) || parseFloat(price) < 0)) {
       return res.status(400).json({ error: 'Price must be a non-negative number.' });
    }

    const item = await prisma.menuitems.update({
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

    // Logging
    await logAdminAction(req.user.user_id, 'UPDATE', 'MenuItem', item.item_id, { 
      updatedFields: req.body,
      finalState: item 
    });

    res.json(sanitizeItem(item));
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
    console.error(`[Menu PUT item ${req.params.id} error]:`, err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

// DELETE /api/menu/:id — Admin only
router.delete('/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const item = await prisma.menuitems.findUnique({ where: { item_id: req.params.id } });
    if (!item) return res.status(404).json({ error: 'Item not found.' });

    await prisma.menuitems.delete({ where: { item_id: req.params.id } });

    // Logging
    await logAdminAction(req.user.user_id, 'DELETE', 'MenuItem', req.params.id, item);

    res.json({ message: 'Item deleted.' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Item not found.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
