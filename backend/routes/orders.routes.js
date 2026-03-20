import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/orders — Protected (must be logged in)
// Body: { items: [{ menu_item_id, quantity }], delivery_type }
router.post('/', authenticate, async (req, res) => {
  try {
    const { items, delivery_type } = req.body;
    const user_id = req.user.user_id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // Fetch prices for all requested items in one query
    const menuItemIds = items.map((i) => i.menu_item_id);
    const menuItems = await prisma.menuitems.findMany({
      where: { item_id: { in: menuItemIds }, is_available: true },
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'One or more items are unavailable or do not exist.' });
    }

    // Build a price map
    const priceMap = Object.fromEntries(menuItems.map((m) => [m.item_id, m.price]));

    // Calculate total
    let total_price = 0;
    const orderItemsData = items.map((item) => {
      const unit_price = parseFloat(priceMap[item.menu_item_id]);
      const subtotal = unit_price * item.quantity;
      total_price += subtotal;
      return {
        id: randomUUID(),
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        subtotal,
      };
    });

    // Create order + order items in a single transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          order_id: randomUUID(),
          user_id,
          total_price,
          status: 'pending',
          delivery_type: delivery_type || 'delivery',
          orderitems: {
            create: orderItemsData,
          },
        },
        include: {
          orderitems: { include: { menuitems: { select: { name: true, price: true } } } },
          users: { select: { full_name: true, email: true } },
        },
      });
      return newOrder;
    });

    // Emit the new order to all connected clients (especially admins)
    if (req.io) {
      req.io.emit('new_order', order);
    }

    res.status(201).json(order);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/orders — Protected
// Customers see their own orders; admins see all
router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    const orders = await prisma.orders.findMany({
      where: isAdmin ? {} : { user_id: req.user.user_id },
      include: {
        orderitems: { include: { menuitems: { select: { name: true, price: true } } } },
        users: { select: { full_name: true, email: true } },
      },
      orderBy: { created_at: 'desc' },
    });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/orders/:id/status — Admin only
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'cooking', 'out_for_delivery', 'delivered', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.orders.update({
      where: { order_id: req.params.id },
      data: { status },
    });

    res.json(order);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
