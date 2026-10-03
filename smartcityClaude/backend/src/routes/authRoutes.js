const router = require('express').Router();
const { register, login, me, listPending, approveUser, rejectUser, createStaff } = require('../controllers/authController');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticate, me);
router.get('/pending', authenticate, checkRole(['ADMIN']), listPending);
router.patch('/users/:id/approve', authenticate, checkRole(['ADMIN']), approveUser);
router.delete('/users/:id/reject', authenticate, checkRole(['ADMIN']), rejectUser);
router.post('/staff', authenticate, checkRole(['ADMIN']), createStaff);

module.exports = router;
