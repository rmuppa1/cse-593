import { Router } from 'express';
import { createRequest, getRequest, listManagers, listRequests, updateRequest } from '../controllers/requestController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();
router.use(authenticate);
router.get('/managers', authorize('ADMIN'), listManagers);
router.get('/', listRequests);
router.get('/:id', getRequest);
router.post('/', authorize('CITIZEN'), createRequest);
router.patch('/:id', authorize('ADMIN', 'MANAGER'), updateRequest);
export default router;

