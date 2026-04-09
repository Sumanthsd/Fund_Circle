import { Router } from 'express';
import {
  createMemberHandler,
  deleteMemberHandler,
  getMembersHandler,
  updateMemberHandler,
} from '../controllers/memberController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getMembersHandler);
router.post('/', requireAdmin, createMemberHandler);
router.patch('/:id', updateMemberHandler);
router.delete('/:id', requireAdmin, deleteMemberHandler);

export default router;
