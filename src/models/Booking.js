const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  roomId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    required: true,
  },
  clientName: String,
  staffId: String,
  startTime: Date,
  endTime: Date,
  isCompleted: {
    type: Boolean,
    default: false,
  },
  price: {
    type: Number,
    default: 500, // Fixed price per room
  }
});


module.exports = mongoose.model('Booking', bookingSchema);
