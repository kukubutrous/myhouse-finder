// backend/src/routes/adminRoutes.js

// backend/src/routes/adminRoutes.js
import express from "express";
import { auth, isAdmin } from "../middleware/authMiddleware.js";
import {
  listUsers,
  updateUserRole,
  deleteUser,
  getDashboardStats,
  getStats,
  updateUser
} from "../controllers/adminController.js";

const router = express.Router();

// --- USERS ---
router.get("/users", auth, isAdmin, listUsers);
router.put("/users/:id/role", auth, isAdmin, updateUserRole);
router.delete("/users/:id", auth, isAdmin, deleteUser);
router.put("/users/:id", auth, isAdmin, updateUser);

// --- STATS ---
router.get("/stats", auth, isAdmin, getStats);

// --- DASHBOARD ---
router.get("/dashboard/stats", auth, isAdmin, getDashboardStats);


export default router;

