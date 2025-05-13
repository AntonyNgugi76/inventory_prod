// routes/staffRoutes.js
const express = require('express');
const router = express.Router();
const staffController = require('../controllers/staffController'); // Import the staff controller

// Route to fetch all staff members
router.get('/staff', staffController.getAllStaff);

module.exports = router;
