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

// PUT /api/users/profile
router.put('/profile', authenticate, async (req, res) => {
  try {
    const { full_name, phone_number, address } = req.body;
    
    const user = await prisma.users.update({
      where: { user_id: req.user.user_id },
      data: { 
        full_name: full_name !== undefined ? full_name : undefined,
        phone_number: phone_number !== undefined ? phone_number : undefined,
        address: address !== undefined ? address : undefined
      },
      select: {
        user_id: true,
        email: true,
        full_name: true,
        phone_number: true,
        address: true,
        role: true
      }
    });

    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
