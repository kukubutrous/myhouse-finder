import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

export function generateRandomToken(len = 32) {
    return crypto.randomBytes(len).toString('hex');
}

export function generateVerifyToken() {
    return generateRandomToken(20);
}

export function generateResetToken() {
    return generateRandomToken(20);
}

export function signJwt(payload, expiresIn = '7d') {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn });
}

export function verifyJwt(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}
