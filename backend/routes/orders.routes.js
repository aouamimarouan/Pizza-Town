import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { sendOrderToPrintNode } from '../services/printerService.js';

const router = Router();

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
      return res.status(400).json({ error: 'Order must contain at least one valid item.' });
    }

    // Step 1: Safely extract and validate item payload
    const parsedItems = [];
    for (const item of items) {
      // Frontend sometimes uses "productId" or "id" instead of menu_item_id directly over the wire
      const dbItemId = item.menu_item_id || item.productId || item.id;
      
      if (!dbItemId) {
         return res.status(400).json({ error: 'Missing product ID in one or more order items.' });
      }
      
      const quantity = parseInt(item.quantity) || 1;
      if (quantity <= 0) {
         return res.status(400).json({ error: `Invalid quantity for product ${dbItemId}` });
      }

      parsedItems.push({
        menu_item_id: dbItemId,
        quantity,
        customizations: item.customizations || {}
      });
    }

    // Fetch prices for all requested items in one query
    const menuItemIds = parsedItems.map((i) => i.menu_item_id);
    const menuItems = await prisma.menuitems.findMany({
      where: { item_id: { in: menuItemIds }, is_available: true },
    });

    if (menuItems.length !== Array.from(new Set(menuItemIds)).length) {
      return res.status(400).json({ error: 'One or more items are unavailable or do not exist in standard menu.' });
    }

    // Build a price map
    const priceMap = Object.fromEntries(menuItems.map((m) => [m.item_id, m.price]));

    // Calculate totals
    const delivery_fee = (delivery_type === 'delivery') ? 3.50 : 0.00;
    let items_total = 0;
    
    const orderItemsData = parsedItems.map((item) => {
      let unit_price = parseFloat(priceMap[item.menu_item_id]);
      
      // Calculate dynamic upcharges (e.g., Pizza Size Modifiers)
      if (item.customizations?.selectedVariant?.priceModifier) {
         unit_price += parseFloat(item.customizations.selectedVariant.priceModifier);
      }

      // We do not add the price of Deal Selections because deals are strict bundles with a fixed top-level price.
      // E.g., The deal itself provides the `unit_price`, and the sub-items inside `dealSelections` are included in that price.
      
      const subtotal = unit_price * item.quantity;
      items_total += subtotal;

      return {
        id: randomUUID(),
        menu_item_id: item.menu_item_id,
        quantity: item.quantity,
        subtotal,
        customizations: item.customizations || null, // Safely dump dynamic JSON to DB
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

    // Format the payload for PrintNode
    const printPayload = {
      orderId: order.order_id,
      date: order.created_at ? order.created_at.toLocaleString('fr-FR') : new Date().toLocaleString('fr-FR'),
      deliveryType: order.delivery_type.toUpperCase(),
      customer: {
        name: order.users.full_name,
        phone: order.users.phone_number || 'N/A', 
        address: order.delivery_address || order.users.address || 'N/A'
      },
      items: order.orderitems.map(item => {
        const cust = item.customizations || {};
        const extras = [...(cust.extras || [])];
        
        // Add Toppings to extras for the printer
        if (cust.toppings && Array.isArray(cust.toppings)) {
          cust.toppings.forEach(t => extras.push({ name: t }));
        }
        
        // Add Crust to extras for the printer
        if (cust.crust) {
          extras.push({ name: `Crust: ${cust.crust.name}` });
        }

        return {
          name: item.menuitems.name,
          quantity: item.quantity,
          price: parseFloat(item.menuitems.price),
          subItems: cust.subItems || [], 
          extras: extras
        };
      }),
      subtotal: items_total,
      deliveryFee: delivery_fee,
      total: total_price
    };

    // 1. Cloud-based Printing (PrintNode)
    try {
      await sendOrderToPrintNode(printPayload);
    } catch (printErr) {
      console.error("⚠️ Print job failed, but order was saved successfully.");
    }

    // PREPARE FOR FRONTEND: Rename orderitems to items
    const formattedOrder = {
      ...order,
      items: order.orderitems
    };

    // 2. Real-time Dashboard Update (Socket.io)
    if (req.io) {
      req.io.emit('new_order', formattedOrder);
    }

    res.status(201).json(formattedOrder);
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

    // Rename orderitems to items for frontend consistency
    const formattedOrders = orders.map(order => ({
      ...order,
      items: order.orderitems
    }));

    res.json(formattedOrders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/orders/:id/status — Admin only
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
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
    });

    res.json(order);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Order not found.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
