import { Router } from 'express';
import { getActiveUsersHandler, getCurrentUser } from '../controllers/authController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/me', requireAuth, getCurrentUser);
router.get('/active-users', requireAuth, getActiveUsersHandler);

export default router;
