const Room = require('../models/Room');

// Create a new room
const createRoom = async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all rooms
const getAllRooms = async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update room status (e.g., when checked out or occupied)
const updateRoomStatus = async (req, res) => {
  const { roomId } = req.params;
  const { status } = req.body;
  try {
    const room = await Room.findByIdAndUpdate(
      roomId,
      { status },
      { new: true }
    );
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createRoom,
  getAllRooms,
  updateRoomStatus,
};
