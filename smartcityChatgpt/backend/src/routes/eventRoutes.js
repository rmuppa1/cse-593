import { Router } from 'express';
import { createEvent, deleteEvent, getEvent, listEvents, registerForEvent, updateEvent } from '../controllers/eventController.js';
import { authenticate, authorize } from '../middlewares/authMiddleware.js';

const router = Router();
router.get('/', listEvents);
router.get('/:id', getEvent);
router.post('/', authenticate, authorize('ADMIN'), createEvent);
router.patch('/:id', authenticate, authorize('ADMIN'), updateEvent);
router.delete('/:id', authenticate, authorize('ADMIN'), deleteEvent);
router.post('/:id/register', authenticate, authorize('CITIZEN'), registerForEvent);
export default router;

