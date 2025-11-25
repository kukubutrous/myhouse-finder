// backend/src/routes/userRoutes.js
import express from 'express';
import { auth, isAdmin } from '../middleware/authMiddleware.js';
import { getUserById } from "../controllers/userController.js";//just added
import { getMe, updateMe, searchUsers } from '../controllers/userController.js';

const router = express.Router();

router.get('/me', auth, getMe);
router.put('/me', auth, updateMe);
router.get('/', auth, searchUsers);
router.get("/:id", getUserById);//just added

export default router;
