import { Router } from 'express';
import {
  createCycleHandler,
  deleteCycleHandler,
  getCyclesHandler,
  randomDrawHandler,
  updateContributionHandler,
} from '../controllers/cycleController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getCyclesHandler);
router.post('/', requireAdmin, createCycleHandler);
router.delete('/:id', requireAdmin, deleteCycleHandler);
router.patch('/contributions/:id', requireAdmin, updateContributionHandler);
router.post('/months/:id/random-draw', requireAdmin, randomDrawHandler);

export default router;
