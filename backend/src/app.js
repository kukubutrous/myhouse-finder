//backend/src/app.js
import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import dotenv from 'dotenv';
import cors from 'cors';
import sequelize from './config/db.js';
import jwt from 'jsonwebtoken';
import { setIo, getIo } from './utils/io.js';
import { generalLimiter } from './utils/rateLimiter.js';

// --- Routes ---
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import chatRoutes from './routes/chatRoutes.js';
import adminRoutes from './routes/adminRoutes.js';

// --- Models  import
import './models/index.js';

dotenv.config();

// --- App + Server setup ---
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
    credentials: true,
  },
});

// Attach Socket.IO globally
setIo(io);

// --- Middlewares ---
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(generalLimiter); // apply rate limiter to all routes

// --- API Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/admin', adminRoutes);
import path from "path";
import { fileURLToPath } from "url";

// Fix __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Serve React static files
app.use(express.static(path.join(__dirname, "../../dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../../dist", "index.html"));
});


// --- Static Files ---
app.use("/uploads", express.static("uploads"));



// --- Database Connection ---
(async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    console.log('✅ Database connected & models synced');
  } catch (err) {
    console.error('❌ Database connection failed:', err);
  }
})();

// --- ONLINE USERS TRACKING ---
const onlineUsers = new Set();

// --- SOCKET.IO AUTHENTICATION ---
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = payload.id;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// --- SOCKET.IO EVENTS ---
io.on('connection', (socket) => {
  console.log(`✅ User connected: ${socket.userId}`);

  // Add to online users
  onlineUsers.add(socket.userId);
  io.emit('online_users', Array.from(onlineUsers)); // broadcast online users to all

  // Join personal room
  socket.join(`user_${socket.userId}`);

  // Join chat room
  socket.on('join_chat', (chatId) => {
    socket.join(`chat_${chatId}`);
    console.log(`User ${socket.userId} joined chat_${chatId}`);
  });

  socket.on('leave_chat', (chatId) => {
    socket.leave(`chat_${chatId}`);
    console.log(`User ${socket.userId} left chat_${chatId}`);
  });

  // Handle messages
  socket.on('send_message', ({ chatId, text }) => {
    if (!chatId || !text) return;
    const msg = {
      chatId,
      senderId: socket.userId,
      text,
      createdAt: new Date(),
    };
    io.to(`chat_${chatId}`).emit('new_message', msg);
  });

  // Disconnect event
  socket.on('disconnect', () => {
    console.log(`❌ User disconnected: ${socket.userId}`);
    onlineUsers.delete(socket.userId);
    io.emit('online_users', Array.from(onlineUsers));
  });
});

// --- Start Server ---
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
