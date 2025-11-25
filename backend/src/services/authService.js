import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Sign a JWT token with user data.
 * @param {object} payload - Data to embed in the token.
 * @returns {string} JWT token
 */
export function signToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
}

/**
 * Verify a JWT token.
 * @param {string} token - Token string to verify.
 * @returns {object} Decoded payload
 */
export function verifyToken(token) {
    return jwt.verify(token, process.env.JWT_SECRET);
}
