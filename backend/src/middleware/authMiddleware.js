// backend/src/middleware/authMiddleware.js
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

// Auth middleware
export const auth = async (req, res, next) => {
    try {
        const header = req.headers['authorization'];
        if (!header) return res.status(401).json({ message: 'No token provided' });

        const token = header.split(' ')[1];
        if (!token) return res.status(401).json({ message: 'Malformed token' });

        const payload = jwt.verify(token, process.env.JWT_SECRET);
        const user = await User.findByPk(payload.id);

        if (!user) return res.status(401).json({ message: 'Invalid token' });

        req.user = user;
        next();
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
    
};

// Admin check middleware
export const isAdmin = (req, res, next) => {
    if (!req.user) return res.status(401).json({ message: 'User not authenticated' });
    if (req.user.role !== 'admin' && req.user.role !== 'superAdmin') {
        return res.status(403).json({ message: 'Access denied: Admins only' });
    }
    next();
};

