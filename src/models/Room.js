const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: String,
  status: {
    type: String,
    enum: ['Available', 'Booked', 'Occupied', 'OutOfService'],
    default: 'Available'
  }
});

module.exports = mongoose.model('Room', RoomSchema);
