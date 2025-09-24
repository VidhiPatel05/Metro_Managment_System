const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// @route   POST api/admin/login
// @desc    Authenticate station admin and get token
// @access  Public
router.post('/login', adminController.loginAdmin);

// Lines management
router.get('/lines', adminController.getLines);
router.post('/lines', adminController.addLine);

// Stations management
router.get('/stations', adminController.getStations);
router.post('/stations', adminController.addStation);

module.exports = router;
