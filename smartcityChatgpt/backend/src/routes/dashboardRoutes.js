import { Router } from 'express';
import { getDashboard } from '../controllers/dashboardController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/', authenticate, authorize('ADMIN', 'MANAGER'), getDashboard);
export default router;

