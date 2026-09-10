import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { generatePrintPayload, printCustomerReceipt, printKitchenTicket, testConnection } from '../services/printerService.js';
import { sendPostOrderReviewEmail, sendOrderCancelledEmail } from '../lib/mailer.js';

const router = Router();

const sanitizeOrder = (order) => {
  if (!order) return null;
  return {
    ...order,
    total_price: order.total_price ? parseFloat(order.total_price.toString()) : 0,
    delivery_fee: order.delivery_fee ? parseFloat(order.delivery_fee.toString()) : 0,
    items: (order.orderitems || []).map(oi => ({
      ...oi,
      subtotal: oi.subtotal ? parseFloat(oi.subtotal.toString()) : 0,
      menuitems: oi.menuitems ? {
        ...oi.menuitems,
        price: oi.menuitems.price ? parseFloat(oi.menuitems.price.toString()) : 0
      } : null
    }))
  };
};

// POST /api/orders — Protected (must be logged in)
// Body: { items: [{ menu_item_id, quantity, customizations }], delivery_type }
router.post('/', authenticate, async (req, res) => {
  try {
    // --- Store Operating Hours Check (Belgium: 11:00 to 23:00) ---
    const belgiumTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Brussels" });
    const currentHour = new Date(belgiumTime).getHours();
    if (currentHour < 11 || currentHour >= 23) {
      return res.status(403).json({ error: "Le magasin est fermé. Nos horaires : 11h - 23h." });
    }
    // -------------------------------------------------------------

    const { items, delivery_type, delivery_address } = req.body;
    const user_id = req.user.user_id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Order must contain at least one item.' });
    }

    // Fetch prices and categories for all requested items in one query
    const menuItemIds = items.map((i) => i.menu_item_id);
    const menuItems = await prisma.menuitems.findMany({
      where: { item_id: { in: menuItemIds }, is_available: true },
      select: { item_id: true, price: true, category: true }
    });

    if (menuItems.length !== menuItemIds.length) {
      return res.status(400).json({ error: 'One or more items are unavailable or do not exist.' });
    }

    // Build maps for price and category
    const priceMap = Object.fromEntries(menuItems.map((m) => [m.item_id, m.price]));
    const categoryMap = Object.fromEntries(menuItems.map((m) => [m.item_id, m.category]));

    const PIZZA_SIZE_PRICES = {
      'small': 11.95,
      'medium': 13.95,
      'large': 18.95
    };

    // Calculate totals
    const delivery_fee = (delivery_type === 'delivery') ? 3.50 : 0.00;
    let items_total = 0;
    const orderItemsData = items.map((item) => {
      const quantity = parseInt(item.quantity);
      if (isNaN(quantity) || quantity <= 0) {
        throw new Error(`Invalid quantity for item ${item.menu_item_id}`);
      }
      const customizations = item.customizations || {};
      const category = categoryMap[item.menu_item_id];
      const isPizza = category === 'Pizzas' || category === 'Half-Half Pizzas';
      
      let unit_price = parseFloat(priceMap[item.menu_item_id]);

      // If it's a pizza with a size, the size price overrides the base price
      if (isPizza && customizations.size && PIZZA_SIZE_PRICES[customizations.size.id]) {
        unit_price = PIZZA_SIZE_PRICES[customizations.size.id];
      }

      // Add Crust and Topping prices (Global or from Deal Sub-Items)
      if (customizations.crust && customizations.crust.price) {
        unit_price += parseFloat(customizations.crust.price);
      }
      if (customizations.toppings && Array.isArray(customizations.toppings)) {
        unit_price += customizations.toppings.length * 1.0; // TOPPING_PRICE = 1.0
      }

      // If it's a deal, also add prices for extras within sub-items
      if (category === 'Menu Deals' && customizations.subItems) {
        customizations.subItems.forEach(sub => {
          if (sub.customizations) {
            if (sub.customizations.crust && sub.customizations.crust.price) {
              unit_price += parseFloat(sub.customizations.crust.price);
            }
            if (sub.customizations.toppings && Array.isArray(sub.customizations.toppings)) {
              unit_price += sub.customizations.toppings.length * 1.0;
            }
          }
        });
      }

      const subtotal = unit_price * quantity;
      items_total += subtotal;
      return {
        id: randomUUID(),
        menu_item_id: item.menu_item_id,
        quantity,
        subtotal,
        customizations: item.customizations || null,
      };
    });

    const total_price = items_total + delivery_fee;

    // Create order + order items in a single transaction
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          order_id: randomUUID(),
          user_id,
          total_price,
          status: 'pending',
          delivery_type: delivery_type || 'delivery',
          delivery_address: (delivery_type === 'delivery') ? delivery_address : null,
          delivery_fee,
          orderitems: {
            create: orderItemsData,
          },
        },
        include: {
          orderitems: { include: { menuitems: { select: { name: true, price: true } } } },
          users: { select: { full_name: true, email: true, phone_number: true, address: true } },
        },
      });
      return newOrder;
    });

    // 1. (Printing has been moved to PATCH /api/orders/:id/status when accepted)

    // PREPARE FOR FRONTEND: Rename orderitems to items
    const formattedOrder = {
      ...order,
      items: order.orderitems
    };

    // 2. Real-time Dashboard Update (Socket.io)
    if (req.io) {
      req.io.emit('new_order', formattedOrder);
    }

    res.status(201).json(sanitizeOrder(order));
  } catch (err) {
    console.error('[Order POST error]:', err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

// GET /api/orders — Protected
// Customers see their own orders; admins see all
router.get('/', authenticate, async (req, res) => {
  try {
    const isAdmin = req.user.role === 'admin' || req.user.role === 'moderator';

    // --- Dashboard logic ---
    let where = { user_id: req.user.user_id };
    
    if (isAdmin) {
      if (req.query.today === 'true') {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        where = { created_at: { gte: today } };
      } else {
        where = {}; // Show all to admin unless today is requested
      }
    }
    // --------------------------

    const orders = await prisma.orders.findMany({
      where,
      include: {
        orderitems: { 
          include: { 
            menuitems: { 
              select: { name: true, price: true } 
            } 
          } 
        },
        users: { 
          select: { full_name: true, email: true, phone_number: true, address: true } 
        },
      },
      orderBy: { created_at: 'desc' },
    });

    let reasonMap = {};
    try {
      const rawReasons = await prisma.$queryRawUnsafe("SELECT order_id, cancellation_reason FROM orders WHERE status = 'cancelled' AND cancellation_reason IS NOT NULL;");
      reasonMap = Object.fromEntries(rawReasons.map(r => [r.order_id, r.cancellation_reason]));
    } catch (e) {
      // fallback
    }

    res.json(orders.map(o => ({
      ...sanitizeOrder(o),
      cancellation_reason: reasonMap[o.order_id] || o.cancellation_reason || null
    })));
  } catch (err) {
    console.error('[Order GET error]:', err);
    res.status(500).json({ error: 'Internal server error.', details: err.message });
  }
});

// PATCH /api/orders/:id/status — Admin only
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, reason } = req.body;
    const validStatuses = [
      'pending', 
      'cooking', 
      'out_for_delivery', 
      'delivered', 
      'ready_for_pickup', 
      'picked_up', 
      'cancelled'
    ];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const order = await prisma.orders.update({
      where: { order_id: req.params.id },
      data: { status },
      include: {
        orderitems: { include: { menuitems: { select: { name: true, price: true } } } },
        users: { select: { full_name: true, email: true, phone_number: true, address: true } },
      }
    });

    if (status === 'cancelled') {
      if (reason) {
        try {
          await prisma.$executeRawUnsafe(
            'UPDATE orders SET cancellation_reason = $1 WHERE order_id = $2::uuid',
            reason,
            req.params.id
          );
          order.cancellation_reason = reason;
        } catch (dbErr) {
          console.error("❌ Failed to save cancellation_reason to db:", dbErr);
        }
      }

      if (order.users && order.users.email) {
        sendOrderCancelledEmail(order.users.email, {
          order_id: order.order_id,
          full_name: order.users.full_name || 'Klant',
          reason: reason || 'Geen specifieke reden opgegeven / No reason specified',
          total_price: order.total_price,
          delivery_type: order.delivery_type,
          items: order.orderitems
        }).catch(err => console.error("❌ Order cancellation email failed:", err));
      }

      if (req.io) {
        req.io.emit('order_status_updated', {
          order_id: order.order_id,
          status: 'cancelled',
          reason: reason || null
        });
      }
    }

    if (status === 'cooking') {
      try {
        const printPayload = generatePrintPayload(order);
        await printCustomerReceipt(printPayload);
      } catch (printErr) {
        console.error("🖨️ Print job generation failed:", printErr);
      }
    }

    if (status === 'delivered' || status === 'completed' || status === 'picked_up') {
      if (order.users && order.users.email) {
        sendPostOrderReviewEmail(order.users.email, {
          full_name: order.users.full_name || 'Customer',
          order_id: order.order_id
        }).catch(err => console.error("❌ Post-order review email failed:", err));
      }
    }

    res.json(order);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/orders/test-print — Admin only
router.post('/test-print', authenticate, requireAdmin, async (req, res) => {
  try {
    const success = await testConnection();
    if (success) {
      res.json({ message: 'Test print successful' });
    } else {
      res.status(500).json({ error: 'Printer is offline or not configured correctly.' });
    }
  } catch (err) {
    console.error('[Test Print Error]:', err);
    res.status(500).json({ error: 'Failed to test printer connection.', details: err.message });
  }
});

// POST /api/orders/:id/reprint — Admin only
router.post('/:id/reprint', authenticate, requireAdmin, async (req, res) => {
  try {
    const order = await prisma.orders.findUnique({
      where: { order_id: req.params.id },
      include: {
        orderitems: { include: { menuitems: { select: { name: true, price: true } } } },
        users: { select: { full_name: true, email: true, phone_number: true, address: true } },
      }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    const printPayload = generatePrintPayload(order);
    const receiptSuccess = await printCustomerReceipt(printPayload);

    if (receiptSuccess) {
      res.json({ message: 'Reprint successful' });
    } else {
      res.status(500).json({ error: 'Printer is offline. Reprint failed.' });
    }
  } catch (err) {
    console.error('[Reprint Error]:', err);
    res.status(500).json({ error: 'Failed to reprint order.', details: err.message });
  }
});

export default router;
