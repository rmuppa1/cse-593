const router = require('express').Router();
const c = require('../controllers/eventController');
const { authenticate, optionalAuth, checkRole } = require('../middlewares/authMiddleware');

router.get('/', optionalAuth, c.getEvents);
router.get('/flags', authenticate, checkRole(['ADMIN']), c.listFlags);
router.patch('/flags/:id/review', authenticate, checkRole(['ADMIN']), c.reviewFlag);
router.get('/:id', optionalAuth, c.getEvent);
router.post('/', authenticate, checkRole(['ADMIN']), c.createEvent);
router.put('/:id', authenticate, checkRole(['ADMIN']), c.updateEvent);
router.delete('/:id', authenticate, checkRole(['ADMIN']), c.deleteEvent);
router.post('/:id/rsvp', authenticate, c.toggleRsvp);
router.post('/:id/flag', authenticate, checkRole(['CITIZEN']), c.flagEvent);
router.patch('/:id/block', authenticate, checkRole(['ADMIN']), c.setBlocked);

module.exports = router;
