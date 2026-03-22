import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';
import { authenticate, requireAdmin } from '../middleware/auth.js';

const router = Router();

// POST /api/reservations — Public
router.post('/', async (req, res) => {
  try {
    // --- Store Operating Hours Check (Belgium: 11:00 to 23:00) ---
    const belgiumTime = new Date().toLocaleString("en-US", { timeZone: "Europe/Brussels" });
    const currentHour = new Date(belgiumTime).getHours();
    if (currentHour < 11 || currentHour >= 23) {
      return res.status(403).json({ error: "Le magasin est fermé. Réservations possibles entre 11h et 23h." });
    }
    // -------------------------------------------------------------

    const { full_name, phone_number, res_date, res_time, guests } = req.body;

    if (!full_name || !phone_number || !res_date || !res_time || !guests) {
      return res.status(400).json({ error: 'Tous les champs sont requis.' });
    }

    const guestCount = parseInt(guests);
    if (isNaN(guestCount) || guestCount < 1 || guestCount > 20) {
      return res.status(400).json({ error: 'Le nombre d\'invités doit être compris entre 1 et 20.' });
    }

    // Security: Only link to a user if authenticated, otherwise use null
    // We expect the frontend to NOT send user_id anymore, but we ignore it anyway
    let user_id = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        user_id = decoded.user_id;
      } catch (err) { /* Not logged in or invalid token, proceed as guest */ }
    }

    const data = {
      res_id: randomUUID(),
      full_name,
      phone_number,
      res_date: new Date(res_date + "T00:00:00Z"), // Force UTC midnight for the date
      res_time: new Date(`1970-01-01T${res_time}:00Z`), // Store time part consistently
      guests: parseInt(guests),
      status: 'pending',
    };

    if (user_id) {
      data.users = { connect: { user_id } };
    }

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

// GET /api/reservations/recent — Admin only (Top 5 newest bookings)
router.get('/recent', authenticate, requireAdmin, async (req, res) => {
  try {
    const reservations = await prisma.reservations.findMany({
      take: 5,
      orderBy: { created_at: 'desc' },
      include: { users: { select: { full_name: true, email: true } } },
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
