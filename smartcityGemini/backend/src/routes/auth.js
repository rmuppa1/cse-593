const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../middlewares/authMiddleware');

// Auth routes
router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', authenticate, authController.getMe);
router.post('/change-password', authenticate, authController.changePassword);

// Admin user approval endpoints
router.get('/pending-users', authenticate, authController.listPendingApprovals);
router.get('/users', authController.getAllUsersWithApproval);
router.post('/approve-user', authenticate, authController.approveUserAccount);
router.post('/reject-user', authenticate, authController.rejectUserAccount);

module.exports = router;
