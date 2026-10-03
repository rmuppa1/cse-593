const router = require('express').Router();
const c = require('../controllers/requestController');
const { authenticate, checkRole } = require('../middlewares/authMiddleware');

router.use(authenticate);

router.post('/', checkRole(['CITIZEN', 'ADMIN']), c.createRequest);
router.get('/', c.getRequests);
router.get('/stats', checkRole(['ADMIN', 'MANAGER']), c.getStats);
router.get('/:id', c.getRequest);
router.patch('/:id/assign', checkRole(['ADMIN', 'MANAGER']), c.assignRequest);
router.patch('/:id/status', checkRole(['ADMIN', 'MANAGER']), c.updateStatus);

module.exports = router;
