import { Router } from 'express';
import { getProfileHandler, updateProfileHandler } from '../controllers/profileController.js';

const router = Router();

router.get('/', getProfileHandler);
router.patch('/', updateProfileHandler);

export default router;
