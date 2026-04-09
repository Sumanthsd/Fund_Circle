import { Router } from 'express';
import authRoutes from './authRoutes.js';
import cycleRoutes from './cycleRoutes.js';
import memberRoutes from './memberRoutes.js';
import profileRoutes from './profileRoutes.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.use('/auth', authRoutes);
router.use(requireAuth);
router.use('/cycles', cycleRoutes);
router.use('/members', memberRoutes);
router.use('/profile', profileRoutes);

export default router;
