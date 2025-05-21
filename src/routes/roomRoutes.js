const express = require('express');
const router = express.Router();
const {
  createRoom,
  getAllRooms,
  updateRoomStatus,
} = require('../controllers/roomController');

// Create a room
router.post('/', createRoom);

// Get all rooms
router.get('/', getAllRooms);

// Update room status (e.g., to Available, Occupied)
router.put('/:roomId/status', updateRoomStatus);

module.exports = router;
