const express = require('express');
const requestController = require('../controllers/requestController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

// Static routes must be declared before the /:id route to avoid being shadowed
router.get('/my', authenticate, requestController.getMyRequests);
router.get('/department', authenticate, authorize(['DEPT_MANAGER']), requestController.getDepartmentRequests);
router.get('/stats', authenticate, authorize(['CITY_ADMIN', 'DEPT_MANAGER']), requestController.getRequestStats);
router.get('/', authenticate, requestController.getAllRequests);
router.get('/:id', authenticate, requestController.getRequestById);

router.post('/', authenticate, requestController.createRequest);

router.put('/:id/status', authenticate, authorize(['DEPT_MANAGER', 'CITY_ADMIN']), requestController.updateRequestStatus);
router.put('/:id/assign', authenticate, authorize(['CITY_ADMIN', 'DEPT_MANAGER']), requestController.assignRequest);

module.exports = router;
