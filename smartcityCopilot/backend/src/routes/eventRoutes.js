const express = require('express');
const eventController = require('../controllers/eventController');
const { authenticate, authorize, optionalAuth } = require('../middlewares/authMiddleware');

const router = express.Router();

// Static routes must be declared before the /:id route to avoid being shadowed
router.get('/categories', eventController.getEventCategories);
router.get('/flags', authenticate, authorize(['CITY_ADMIN']), eventController.getEventFlags);
router.get('/', optionalAuth, eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

router.post('/', authenticate, authorize(['CITY_ADMIN']), eventController.createEvent);
router.put('/:id', authenticate, authorize(['CITY_ADMIN']), eventController.updateEvent);
router.delete('/:id', authenticate, authorize(['CITY_ADMIN']), eventController.deleteEvent);

router.post('/:id/register', authenticate, eventController.registerForEvent);
router.post('/:id/flag', authenticate, eventController.flagEvent);
router.put('/:id/block', authenticate, authorize(['CITY_ADMIN']), eventController.setEventBlockedStatus);

module.exports = router;
