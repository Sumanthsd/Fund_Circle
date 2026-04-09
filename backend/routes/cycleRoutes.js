import { Router } from 'express';
import {
  createCycleHandler,
  deleteCycleHandler,
  getCyclesHandler,
  randomDrawHandler,
  startCycleHandler,
  updateContributionHandler,
} from '../controllers/cycleController.js';
import { requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

router.get('/', getCyclesHandler);
router.post('/', requireAdmin, createCycleHandler);
router.delete('/:id', requireAdmin, deleteCycleHandler);
router.post('/:id/start', requireAdmin, startCycleHandler);
router.patch('/contributions/:id', requireAdmin, updateContributionHandler);
router.post('/months/:id/random-draw', requireAdmin, randomDrawHandler);

export default router;
