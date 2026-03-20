import { Router } from 'express';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// GET /api/audit-logs — Admin only
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const logs = await prisma.audit_logs.findMany({
      include: {
        users: {
          select: {
            full_name: true,
            email: true,
          },
        },
      },
      orderBy: { created_at: 'desc' },
      take: 100, // Limit to last 100 logs for performance
    });

    // Rename 'users' to 'admin' for the frontend if needed, or keep it standard
    const formattedLogs = logs.map(log => ({
      ...log,
      admin: log.users,
      users: undefined,
    }));

    res.json(formattedLogs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
