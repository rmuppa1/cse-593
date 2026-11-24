import { Router } from 'express';
import { listUsers, reviewUser } from '../controllers/adminController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(authenticate, authorize('ADMIN'));
router.get('/users', listUsers);
router.patch('/users/:id/approval', reviewUser);
export default router;

