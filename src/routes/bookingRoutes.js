const express = require('express');
const router = express.Router();
const {
  createBooking,
  getAllBookings,
  completeBooking,
} = require('../controllers/bookingController');

// Create a new booking
router.post('/', createBooking);

// Get all bookings
router.get('/', getAllBookings);

// Complete (check-out) a booking
router.put('/:bookingId/complete', completeBooking);

module.exports = router;
