const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth'); // Import the auth middleware

// @route   POST api/users/register
// @desc    Register a new user
// @access  Public
router.post('/register', userController.registerUser);

// @route   POST api/users/login
// @desc    Authenticate user and get token
// @access  Public
router.post('/login', userController.loginUser);

// @route   GET api/users/stations
// @desc    Get all metro stations
// @access  Public
router.get('/stations', userController.getStations);

// @route   POST api/users/book-ticket
// @desc    Book a new ticket
// @access  Private
router.post('/book-ticket', auth, userController.bookTicket);

// @route   POST api/users/create-order
// @desc    Create a new Razorpay order
// @access  Private
router.post('/create-order', auth, userController.createOrder);

// @route   POST api/users/verify-payment
// @desc    Verify Razorpay payment signature and update database
// @access  Private
router.post('/verify-payment', auth, userController.verifyPayment);

// @route   GET api/users/my-tickets
// @desc    Get all tickets for the authenticated user
// @access  Private
router.get('/my-tickets', auth, userController.getTickets);

// @route   GET api/users/profile
// @desc    Get profile for the authenticated user
// @access  Private
router.get('/profile', auth, userController.getProfile);

// @route   GET api/users/travel-history
// @desc    Get completed trips for the authenticated user
// @access  Private
router.get('/travel-history', auth, userController.getTravelHistory);

// @route   GET api/users/travel-stats
// @desc    Get aggregated travel stats for the authenticated user
// @access  Private
router.get('/travel-stats', auth, userController.getTravelStats);

module.exports = router;