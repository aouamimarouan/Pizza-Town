import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/reviews - Submit a review
router.post('/', authenticate, async (req, res) => {
  try {
    const { order_id, rating, comment } = req.body;
    const user_id = req.user.user_id;

    if (!order_id || !rating) {
      return res.status(400).json({ error: 'Order ID and rating are required.' });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Rating must be between 1 and 5.' });
    }

    // Verify order exists, belongs to user, and is in a completed/delivered state
    const order = await prisma.orders.findUnique({
      where: { order_id }
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found.' });
    }

    if (order.user_id !== user_id) {
      return res.status(403).json({ error: 'You do not have permission to review this order.' });
    }

    if (order.status !== 'delivered' && order.status !== 'completed' && order.status !== 'picked_up') {
      return res.status(400).json({ error: 'Order must be completed before you can review it.' });
    }

    // Check if review already exists
    const existingReview = await prisma.reviews.findUnique({
      where: { order_id }
    });

    if (existingReview) {
      return res.status(409).json({ error: 'You have already submitted a review for this order.' });
    }

    // Create the review
    const review = await prisma.reviews.create({
      data: {
        order_id,
        user_id,
        rating,
        comment
      }
    });

    res.status(201).json(review);
  } catch (err) {
    console.error('[Review POST error]:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reviews - Get all reviews (Admin)
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const reviews = await prisma.reviews.findMany({
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { full_name: true, email: true }
        },
        orders: {
          select: { total_price: true, created_at: true }
        }
      }
    });
    res.json(reviews);
  } catch (err) {
    console.error('[Review GET error]:', err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
