const express = require('express');
const userController = require('../controllers/userController');
const { authenticate, authorize } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', authenticate, authorize(['CITY_ADMIN']), userController.getAllUsers);

module.exports = router;
