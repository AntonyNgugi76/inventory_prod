const Booking = require('../models/Booking');
const Room = require('../models/Room');

// Create a new booking
const createBooking = async (req, res) => {
  const { roomId, clientName, staffId, startTime, endTime } = req.body;

  const room = await Room.findById(roomId);
  if (!room) return res.status(404).json({ message: 'Room not found' });

  if (room.status === 'Booked') {
    return res.status(400).json({ message: 'Room is already booked' });
  }

  const booking = new Booking({
    roomId,
    clientName,
    staffId,
    startTime,
    endTime,
    price: 500, // Add fixed price
  });

  await booking.save();

  room.status = 'Booked';
  await room.save();

  res.status(201).json(booking);
};


// Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('roomId');
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Complete a booking (check-out)
const completeBooking = async (req, res) => {
  const { bookingId } = req.params;
  try {
    const booking = await Booking.findByIdAndUpdate(
      bookingId,
      {
        isCompleted: true, // ✅ Correct field
        endTime: new Date(), // ✅ Optionally update checkout time
      },
      { new: true }
    );

    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Update room status to Available
    await Room.findByIdAndUpdate(booking.roomId, { status: 'Available' });

    res.json({ message: 'Booking completed', booking });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


module.exports = {
  createBooking,
  getAllBookings,
  completeBooking,
};
