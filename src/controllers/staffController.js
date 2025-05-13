// controllers/staffController.js
const User = require('../models/User'); // Import the User model

// Fetch all staff members
exports.getAllStaff = async (req, res) => {
  try {
    const staffMembers = await User.find({ role: 'staff' }); // Only staff users
    res.status(200).json(staffMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching staff members' });
  }
};
