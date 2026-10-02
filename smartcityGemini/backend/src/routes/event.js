const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const { authenticate, isAdmin } = require('../middlewares/authMiddleware');

// Specific routes before param routes
router.get('/categories', eventController.getEventCategories);

// General event routes
router.get('/', eventController.getAllEvents);
router.post('/', authenticate, isAdmin, eventController.createEvent);

// Single event routes
router.get('/:id', eventController.getEventById);
router.put('/:id', authenticate, isAdmin, eventController.updateEvent);
router.delete('/:id', authenticate, isAdmin, eventController.deleteEvent);
router.post('/:id/register', authenticate, eventController.registerForEvent);

module.exports = router;
