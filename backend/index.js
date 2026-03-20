import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'node:http';
import { Server } from 'socket.io';

import authRoutes from './routes/auth.routes.js';
import menuRoutes from './routes/menu.routes.js';
import reservationRoutes from './routes/reservations.routes.js';
import orderRoutes from './routes/orders.routes.js';
import userRoutes from './routes/user.routes.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*', // In production, use your frontend URL
    methods: ['GET', 'POST']
  }
});

const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // For dev, allow everything. Alternatively: 'http://localhost:5173'
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json());

// Attach Socket.io instance to req object
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io connection handler
io.on('connection', (socket) => {
  console.log('⚡ Client connected:', socket.id);

  socket.on('join_admin', () => {
    socket.join('admin');
    console.log(`🛡️ Admin joined room: admin (${socket.id})`);
  });

  socket.on('join_user', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`👤 User joined room: user_${userId} (${socket.id})`);
  });

  socket.on('disconnect', () => {
    console.log('❌ Client disconnected:', socket.id);
  });
});

// Health check
app.get('/api/status', (req, res) => {
  res.json({ status: 'Pizza Town API is running', timestamp: new Date() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/reservations', reservationRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/users', userRoutes);

// Global 404 handler
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.path} not found.` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong.' });
});

httpServer.listen(PORT, () => {
  console.log(`🍕 Pizza Town API + Real-time running on port ${PORT}`);
});
