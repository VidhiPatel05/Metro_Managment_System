const express = require('express');
const router = express.Router();
const ticketController = require('../controllers/ticketController');

// Routes
router.post('/', ticketController.bookTicket);
router.get('/', ticketController.getTickets);
router.patch('/:id/pay', ticketController.updatePayment);
router.get('/stations', ticketController.getStations);

module.exports = router;
