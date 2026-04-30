import { Router } from 'express';
import { getDataRevisionHandler } from '../controllers/realtimeController.js';

const router = Router();

router.get('/version', getDataRevisionHandler);

export default router;

