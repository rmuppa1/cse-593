const express = require('express');
const router = express.Router();
const requestController = require('../controllers/requestController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

router.get('/', authenticate, requestController.getAllRequests);
router.get('/my', authenticate, requestController.getMyRequests);
router.get('/department', authenticate, requestController.getDepartmentRequests);
router.get('/stats', authenticate, requestController.getRequestStats);
router.get('/:id', authenticate, requestController.getRequestById);
router.post('/', authenticate, requestController.createRequest);
router.put('/:id/status', authenticate, requestController.updateRequestStatus);
router.put('/:id/assign', authenticate, authorize(['CITY_ADMIN', 'DEPT_MANAGER']), requestController.assignRequest);

module.exports = router;