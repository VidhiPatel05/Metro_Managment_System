const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

// @route   POST api/admin/login
// @desc    Authenticate station admin and get token
// @access  Public
router.post('/login', adminController.loginAdmin);

module.exports = router;
