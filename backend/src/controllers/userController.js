// backend/src/controllers/userController.js
import { Op } from "sequelize";
import { User } from "../models/index.js";

/**
 * GET /api/users/me
 * Returns the authenticated user's details
 */
export async function getMe(req, res) {
    try {
        const user = req.user;
        if (!user) return res.status(404).json({ message: "User not found" });

        const { passwordHash, verifyToken, resetPasswordToken, ...safeUser } = user.toJSON();
        return res.json({ user: safeUser });
    } catch (err) {
        console.error("getMe error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/users/:id
 * Fetch a user by ID
 */
export async function getUserById(req, res) {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: { exclude: ["passwordHash", "verifyToken", "resetPasswordToken"] },
        });

        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user);
    } catch (err) {
        console.error("getUserById error:", err);
        res.status(500).json({ message: "Server error" });
    }
}

/**
 * PUT /api/users/me
 * Update authenticated user's profile
 */
export async function updateMe(req, res) {
    try {
        const allowed = [
            "firstName",
            "lastName",
            "phoneNumber",
            "location",
            "roomType",
            "budgetMin",
            "budgetMax",
            "hobbies",
            "gender",
            "preferredGender",
        ];

        // Update only allowed fields
        allowed.forEach((key) => {
            if (req.body[key] !== undefined) req.user[key] = req.body[key];
        });

        // Convert hobbies array to CSV string if needed
        if (Array.isArray(req.user.hobbies)) {
            req.user.hobbies = req.user.hobbies.join(",");
        }

        await req.user.save();

        const { passwordHash, verifyToken, resetPasswordToken, ...safeUser } = req.user.toJSON();
        return res.json({ user: safeUser });
    } catch (err) {
        console.error("updateMe error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}

/**
 * GET /api/users/search
 * Search users by filters
 */
export async function searchUsers(req, res) {
    try {
        const {
            query,
            location,
            roomType,
            budgetMin,
            budgetMax,
            hobbies,
            activities,
            gender,
        } = req.query;

        const where = { role: "user" };

        if (query) {
            where[Op.or] = [
                { firstName: { [Op.like]: `%${query}%` } },
                { lastName: { [Op.like]: `%${query}%` } },
                { email: { [Op.like]: `%${query}%` } },
            ];
        }

        if (location) where.location = { [Op.like]: `%${location}%` };
        if (roomType) where.roomType = roomType;
        if (gender) where.gender = gender;

        if (hobbies) where.hobbies = { [Op.like]: `%${hobbies}%` };
        if (activities) where.activities = { [Op.like]: `%${activities}%` };

        // Budget overlap logic
        if (budgetMin && budgetMax) {
            where[Op.and] = [
                { budgetMin: { [Op.lte]: parseFloat(budgetMax) } },
                { budgetMax: { [Op.gte]: parseFloat(budgetMin) } },
            ];
        } else if (budgetMin) {
            where.budgetMax = { [Op.gte]: parseFloat(budgetMin) };
        } else if (budgetMax) {
            where.budgetMin = { [Op.lte]: parseFloat(budgetMax) };
        }

        const users = await User.findAll({
            where,
            attributes: {
                exclude: ["passwordHash", "verifyToken", "resetPasswordToken"],
            },
            order: [["updatedAt", "DESC"]],
        });

        return res.json({ users });

    } catch (err) {
        console.error("searchUsers error:", err);
        return res.status(500).json({ message: "Server error" });
    }
}
