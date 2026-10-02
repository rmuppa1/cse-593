const express = require('express');
const authController = require('../controllers/authController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

router.get('/pending-users', authenticate, authorize(['CITY_ADMIN']), authController.getPendingUsers);
router.put('/approve/:id', authenticate, authorize(['CITY_ADMIN']), authController.approveUser);
router.put('/reject/:id', authenticate, authorize(['CITY_ADMIN']), authController.rejectUser);

module.exports = router;
