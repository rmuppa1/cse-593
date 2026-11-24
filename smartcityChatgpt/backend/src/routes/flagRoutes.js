import { Router } from 'express';
import { createFlag, listFlags, reviewFlag } from '../controllers/flagController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(authenticate);
router.post('/', createFlag);
router.get('/', authorize('ADMIN'), listFlags);
router.patch('/:id', authorize('ADMIN'), reviewFlag);
export default router;

