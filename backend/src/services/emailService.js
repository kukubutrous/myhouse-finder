// backend/src/services/emailService.js
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Build backend URL dynamically (e.g., http://localhost:4000)
const API_BASE_URL = process.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:4000';

export async function sendVerificationEmail(user, token) {
  const verifyLink = `${API_BASE_URL}/api/auth/verify?token=${token}`;
  const html = `
    <div style="font-family:sans-serif;">
      <h2>Verify your MyHouse Finder account</h2>
      <p>Hi ${user.firstName},</p>
      <p>Please verify your email by clicking below:</p>
      <a href="${verifyLink}" 
         style="background-color:#22c55e;color:white;padding:10px 15px;
         border-radius:8px;text-decoration:none;">Verify Email</a>
      <p>This link expires in 24 hours.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Verify your MyHouse Finder account",
    html,
  });
}

export async function sendResetPasswordEmail(user, token) {
  const resetLink = `${API_BASE_URL}/api/auth/reset-password?token=${token}`;
  const html = `
    <div style="font-family:sans-serif;">
      <h2>Password Reset Request</h2>
      <p>Hi ${user.firstName},</p>
      <p>Click below to reset your password:</p>
      <a href="${resetLink}" 
         style="background-color:#16a34a;color:white;padding:10px 15px;
         border-radius:8px;text-decoration:none;">Reset Password</a>
      <p>This link expires in 1 hour.</p>
    </div>
  `;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: user.email,
    subject: "Reset your MyHouse Finder password",
    html,
  });
}

