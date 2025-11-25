//backend/src/config/mail.js

import nodemailer from 'nodemailer';
import dotenv from 'dotenv';


dotenv.config();


const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});


// verify connection configuration (optional)
transporter.verify().then(() => {
    console.log('Mail transporter ready');
}).catch(err => {
    console.warn('Mail transporter verification failed:', err?.message || err);
});


export default transporter;