// backend/src/controllers/adminController.js
import { User, Chat, Message } from "../models/index.js";
import { getIo } from "../utils/io.js";

// --- USER MANAGEMENT ---
export async function listUsers(req, res) {
    try {
        const users = await User.findAll({
            attributes: { exclude: ["passwordHash", "verifyToken", "resetPasswordToken"] },
            order: [["createdAt", "DESC"]],
        });

        res.json({ users });
    } catch (err) {
        console.error("List users error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

export async function updateUserRole(req, res) {
    try {
        const { id } = req.params;
        const { role } = req.body;

        if (!["user", "admin", "superAdmin"].includes(role))
            return res.status(400).json({ message: "Invalid role" });

        if (req.user.role !== "superAdmin" && role === "superAdmin")
            return res.status(403).json({ message: "Only superAdmin can assign this role" });

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        user.role = role;
        await user.save();

        getIo().emit("admin_user_update", {
            action: "role_changed",
            user: { id: user.id, role: user.role },
        });

        res.json({ user: { id: user.id, email: user.email, role: user.role } });
    } catch (err) {
        console.error("Update role error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

export async function deleteUser(req, res) {
    try {
        const { id } = req.params;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        // Delete the user; related chats and messages will cascade automatically
        await user.destroy();

        // Emit real-time update to admins/clients
        getIo().emit("admin_user_update", {
            action: "deleted",
            user: { id },
        });

        res.json({ message: "User deleted successfully" });
    } catch (err) {
        console.error("Delete user error:", err);

        // More informative error for foreign key issues (if cascade not set)
        if (err.name === "SequelizeForeignKeyConstraintError") {
            return res.status(400).json({
                message: "Cannot delete user: still referenced in chats or messages",
            });
        }

        res.status(500).json({ message: "Server error" });
    }
}



// --- DASHBOARD STATS ---
export async function getDashboardStats(req, res) {
    try {
        const totalUsers = await User.count();
        const verifiedUsers = await User.count({ where: { Verified: true } });
        const totalChats = await Chat.count();
        const totalMessages = await Message.count();

        res.json({ totalUsers, verifiedUsers, totalChats, totalMessages });
    } catch (err) {
        console.error("Dashboard stats error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

// --- SIMPLE STATS API ---
export async function getStats(req, res) {
    try {
        const users = await User.count();
        const chats = await Chat.count();
        const messages = await Message.count();

        res.json({ users, chats, messages });
    } catch (err) {
        console.error("Stats error:", err);
        res.status(500).json({ message: "Server error" });
    }
}
export async function updateUser(req, res) {
    try {
        const { id } = req.params;
        const { email, role } = req.body;

        const user = await User.findByPk(id);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (email) user.email = email;
        if (role) {
            if (!["user", "admin", "superAdmin"].includes(role))
                return res.status(400).json({ message: "Invalid role" });
            if (req.user.role !== "superAdmin" && role === "superAdmin")
                return res.status(403).json({ message: "Only superAdmin can assign this role" });
            user.role = role;
        }

        await user.save();

        getIo().emit("admin_user_update", {
            action: "role_changed",
            user: { id: user.id, email: user.email, role: user.role },
        });

        res.json({ user });
    } catch (err) {
        console.error("Update user error:", err);
        res.status(500).json({ message: "Server error" });
    }
}
