import { Router } from 'express';
import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import prisma from '../lib/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { sendWelcomeEmail, sendPasswordResetEmail } from '../lib/mailer.js';

const router = Router();

// Rate limiting for auth routes (max 50 attempts per 15 mins to prevent brute-force during testing)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: { error: 'Trop de tentatives. Veuillez réessayer plus tard.' }
});

router.use('/login', authLimiter);
router.use('/register', authLimiter);

// Zod Schemas for input validation
const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone_number: z.string().min(10, 'Phone number is too short').optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

// Helper to sign a JWT
const signToken = (user) =>
  jwt.sign(
    { user_id: user.user_id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// Helper to set HttpOnly Cookie
const setAuthCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // Assuming frontend and backend are cross-origin in prod
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const validatedData = registerSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.errors[0].message });
    }

    const { full_name, email, password, phone_number, address } = validatedData.data;

    const existing = await prisma.users.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    // High cost factor (12 is standard, sufficient for current hardware)
    const password_hash = await bcrypt.hash(password, 12);

    const user = await prisma.users.create({
      data: { user_id: randomUUID(), full_name, email, password_hash, phone_number, address, role: 'customer' },
    });

    // Send the welcome email (non-blocking)
    sendWelcomeEmail(user.email, user.full_name);

    const token = signToken(user);
    setAuthCookie(res, token);
    
    res.status(201).json({ 
      user: { 
        user_id: user.user_id, 
        email: user.email, 
        full_name: user.full_name, 
        role: user.role,
        address: user.address,
        phone_number: user.phone_number
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const validatedData = loginSchema.safeParse(req.body);
    
    if (!validatedData.success) {
      return res.status(400).json({ error: validatedData.error.errors[0].message });
    }

    const { email, password } = validatedData.data;

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials.' });
    }

    const token = signToken(user);
    setAuthCookie(res, token);

    res.json({ 
      user: { 
        user_id: user.user_id, 
        email: user.email, 
        full_name: user.full_name, 
        role: user.role,
        address: user.address,
        phone_number: user.phone_number
      } 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  });
  res.json({ message: 'Logged out successfully.' });
});

// GET /api/auth/me — Protected
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.users.findUnique({
      where: { user_id: req.user.user_id },
      select: { user_id: true, email: true, full_name: true, phone_number: true, address: true, role: true, created_at: true },
    });

    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Email is required.' });
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) {
      // Return 200 to prevent email enumeration attacks
      return res.json({ message: 'If this email is registered, a reset link has been sent.' });
    }

    // Generate a temporary JWT for password reset, valid for 15 minutes
    const resetToken = jwt.sign(
      { user_id: user.user_id, intent: 'reset_password' },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    // Send the email
    sendPasswordResetEmail(user.email, resetToken);

    res.json({ message: 'If this email is registered, a reset link has been sent.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required.' });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'Invalid or expired token.' });
    }

    if (decoded.intent !== 'reset_password') {
      return res.status(401).json({ error: 'Invalid token intent.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { user_id: decoded.user_id },
      data: { password_hash }
    });

    res.json({ message: 'Password has been reset successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

// PUT /api/auth/update-password
router.put('/update-password', authenticate, authLimiter, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current and new passwords are required.' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters long.' });
    }

    const user = await prisma.users.findUnique({
      where: { user_id: req.user.user_id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    const valid = await bcrypt.compare(currentPassword, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Incorrect current password.' });
    }

    const password_hash = await bcrypt.hash(newPassword, 12);
    
    await prisma.users.update({
      where: { user_id: user.user_id },
      data: { password_hash }
    });

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal server error.' });
  }
});

export default router;
