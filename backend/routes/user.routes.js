import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/users - Admin only: Fetch all users
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const users = await prisma.users.findMany({
      orderBy: { created_at: 'desc' },
      select: {
        user_id: true,
        full_name: true,
        email: true,
        phone_number: true,
        address: true,
        role: true,
        created_at: true,
        _count: {
          select: { orders: true }
        }
      }
    });
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/profile
router.get('/profile', authenticate, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: req.user.user_id },
      include: {
        orders: {
          orderBy: { created_at: 'desc' },
          include: {
            orderitems: {
              include: {
                menuitems: { select: { name: true, price: true, category: true } }
              }
            }
          }
        }
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Exclude password hash from the response
    const { password_hash, ...safeUser } = user;
    res.json(safeUser);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
