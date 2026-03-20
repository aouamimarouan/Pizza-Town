import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/reservations — Public (no login required)
router.post('/', async (req, res) => {
  try {
    const { full_name, phone_number, res_date, res_time, guests, user_id } = req.body;

    if (!full_name || !phone_number || !res_date || !res_time || !guests) {
      return res.status(400).json({ error: 'full_name, phone_number, res_date, res_time, and guests are required.' });
    }

    // If the user is logged in they can optionally link the reservation
    const data = {
      res_id: randomUUID(),
      full_name,
      phone_number,
      res_date: new Date(res_date),
      res_time: new Date(`1970-01-01T${res_time}:00Z`),
      guests: parseInt(guests),
      status: 'pending',
    };

    if (user_id) data.users = { connect: { user_id } };

    const reservation = await prisma.reservations.create({ 
      data,
      include: { users: { select: { email: true, full_name: true } } }
    });

    // Notify admins
    if (req.io) {
      req.io.to('admin').emit('new_reservation', reservation);
    }

    res.status(201).json(reservation);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reservations/my-reservations — For logged-in users
router.get('/my-reservations', authenticate, async (req, res) => {
  try {
    const reservations = await prisma.reservations.findMany({
      where: { user_id: req.user.user_id },
      orderBy: { created_at: 'desc' },
    });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// GET /api/reservations — Admin only
router.get('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const reservations = await prisma.reservations.findMany({
      orderBy: { res_date: 'asc' },
      include: { users: { select: { email: true, full_name: true } } },
    });
    res.json(reservations);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PATCH /api/reservations/:id/status — Admin only
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    const reservation = await prisma.reservations.update({
      where: { res_id: req.params.id },
      data: { status },
      include: { users: { select: { user_id: true } } }
    });

    // Notify user if confirmed
    if (req.io && status === 'confirmed') {
      const room = reservation.user_id ? `user_${reservation.user_id}` : null;
      if (room) {
        req.io.to(room).emit('reservation_confirmed', reservation);
      }
    }

    res.json(reservation);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Reservation not found.' });
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
