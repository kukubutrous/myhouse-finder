// backend/src/controllers/authController.js
import bcrypt from "bcryptjs";
import { User } from "../models/index.js";
import { sendVerificationEmail, sendResetPasswordEmail } from "../services/emailService.js";
import { signJwt, generateVerifyToken, generateResetToken } from "../utils/generateToken.js";
import { getIo } from "../utils/io.js";

/**
 * Register new user and send verification email
 */
export async function register(req, res) {
    try {
        const { firstName, lastName, phoneNumber, email, password } = req.body;

        if (!firstName || !lastName || !phoneNumber || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }

        const existing = await User.findOne({ where: { email } });
        if (existing) return res.status(400).json({ message: "Email already registered" });

        const hash = await bcrypt.hash(password, 10);
        const count = await User.count();
        const role = count === 0 ? "superAdmin" : "user";

        const verifyToken = generateVerifyToken();
        const verifyTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        const user = await User.create({
            firstName,
            lastName,
            phoneNumber,
            email,
            passwordHash: hash,
            role,
            verifyToken,
            verifyTokenExpires,
            verified: false,
        });

        // Send verification email
        await sendVerificationEmail(user, verifyToken);

        // Notify admins via socket.io
        try {
            const io = getIo();
            io.emit("admin_user_update", {
                action: "created",
                user: {
                    id: user.id,
                    firstName: user.firstName,
                    email: user.email,
                    role: user.role,
                },
            });
        } catch (e) {
            console.warn("Socket not initialized yet:", e.message);
        }

        return res
            .status(201)
            .json({ message: "✅ Registered successfully. Check your email to verify your account." });
    } catch (err) {
        console.error("Register Error:", err);
        return res.status(500).json({ message: "Server error during registration" });
    }
}

/**
 * Verify email endpoint (GET /auth/verify?token=...)
 */
export async function verifyEmail(req, res) {
    try {
        const token = req.query.token;
        if (!token) return res.status(400).json({ message: "Verification token required" });

        const user = await User.findOne({ where: { verifyToken: token } });
        if (!user)
            return res.status(400).json({ message: "Invalid verification token" });

        if (user.verifyTokenExpires && new Date() > user.verifyTokenExpires) {
            return res.status(400).json({ message: "Verification token expired" });
        }

        user.verified = true;
        user.verifyToken = null;
        user.verifyTokenExpires = null;
        await user.save();

        return res.json({ message: "✅ Email verified successfully! You can now log in." });
    } catch (err) {
        console.error("Verify Email Error:", err);
        return res.status(500).json({ message: "Server error during email verification" });
    }
}

/**
 * Login existing user
 */
export async function login(req, res) {
    try {
        const { email, password } = req.body;
        if (!email || !password)
            return res.status(400).json({ message: "Email and password required" });

        const user = await User.findOne({ where: { email } });
        if (!user) return res.status(400).json({ message: "Invalid email or password" });

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return res.status(400).json({ message: "Invalid email or password" });

        if (!user.verified)
            return res.status(403).json({ message: "Please verify your email before logging in." });

        const token = signJwt({ id: user.id, role: user.role });

        return res.json({
            token,
            user: {
                id: user.id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                verified: user.verified,
            },
        });
    } catch (err) {
        console.error("Login Error:", err);
        return res.status(500).json({ message: "Server error during login" });
    }
}


//new feature for getting the profile
export async function getProfile(req, res) {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: {
                exclude: [
                    "passwordHash",
                    "resetPasswordToken",
                    "resetPasswordExpires",
                    "verifyToken",
                    "verifyTokenExpires"
                ]
            }
        });

        if (!user) return res.status(404).json({ message: "User not found" });

        return res.json(user);
    } catch (err) {
        console.error("Get Profile Error:", err);
        return res.status(500).json({ message: "Server error fetching profile" });
    }
}



/**
 * Request password reset (sends email)
 */
export async function requestPasswordReset(req, res) {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ message: "Email required" });

        const user = await User.findOne({ where: { email } });
        if (!user) {
            // Always return generic message to avoid exposing valid emails
            return res.json({ message: "If that email exists, a reset link was sent." });
        }

        const token = generateResetToken();
        user.resetPasswordToken = token;
        user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await user.save();

        await sendResetPasswordEmail(user, token);

        return res.json({ message: "Password reset link sent (if account exists)." });
    } catch (err) {
        console.error("Reset Request Error:", err);
        return res.status(500).json({ message: "Server error during password reset request" });
    }
}

/**
 * Reset password using token
 */
export async function resetPassword(req, res) {
    try {
        const token = req.query.token || req.body.token || req.params.token;
        const { password } = req.body;

        if (!token || !password)
            return res.status(400).json({ message: "Token and new password required" });

        const user = await User.findOne({ where: { resetPasswordToken: token } });
        if (!user)
            return res.status(400).json({ message: "Invalid reset token" });

        if (user.resetPasswordExpires && new Date() > user.resetPasswordExpires) {
            return res.status(400).json({ message: "Reset token expired" });
        }

        user.passwordHash = await bcrypt.hash(password, 10);
        user.resetPasswordToken = null;
        user.resetPasswordExpires = null;
        await user.save();

        return res.json({ message: "✅ Password reset successfully. You can now log in." });
    } catch (err) {
        console.error("Reset Password Error:", err);
        return res.status(500).json({ message: "Server error during password reset" });
    }
}
//just added
// ✅ Simple authenticated "who-am-I" endpoint
export async function me(req, res) {
    try {
        const user = await User.findByPk(req.user.id, {
            attributes: {
                exclude: [
                    "passwordHash",
                    "verifyToken",
                    "verifyTokenExpires",
                    "resetPasswordToken",
                    "resetPasswordExpires"
                ]
            }
        });

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        return res.json(user);
    } catch (err) {
        console.error("Me endpoint error:", err);
        return res.status(500).json({ message: "Server error fetching user" });
    }
}
