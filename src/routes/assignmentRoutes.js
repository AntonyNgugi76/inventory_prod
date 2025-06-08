const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const User = require('../models/User');
const ItemAssignment = require('../models/ItemAssignment');
const { authenticate, authorizeAdmin } = require('../middleware/auth');

// Assign item to staff
router.post('/assign', authenticate, authorizeAdmin, async (req, res) => {
  const { itemId, staffId, quantity } = req.body;

  try {
    const item = await Item.findById(itemId);
    const staff = await User.findById(staffId);

    if (!item || !staff || staff.role !== 'staff') {
      return res.status(400).json({ error: 'Invalid item or staff ID' });
    }

    if (quantity > item.totalQuantity) {
      return res.status(400).json({ error: 'Not enough stock to assign' });
    }

    // Check if the staff already has this item assigned
    let assignment = await ItemAssignment.findOne({ staff: staffId, item: itemId });

    if (assignment) {
      // If assignment exists, update the quantityAssigned
      assignment.quantityAssigned += quantity;
      await assignment.save();
      res.status(200).json({ message: 'Item quantity updated', assignment });
    } else {
      // If no assignment exists, create a new assignment record
      assignment = new ItemAssignment({
        item: itemId,
        staff: staffId,
        quantityAssigned: quantity,
      });

      await assignment.save();
      res.status(201).json({ message: 'Item assigned successfully', assignment });
    }

    // Reduce quantity from the total stock
    item.totalQuantity -= quantity;
    await item.save();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fetch items assigned to the logged-in staff
router.get('/my-items', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Access denied. Staff only.' });
    }

    const assignments = await ItemAssignment.find({ staff: req.user._id })
      .populate('item')
      .sort({ assignedAt: -1 });

    res.status(200).json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all item assignments for a specific staff (Admin only)
router.get('/staff/:staffId/assignments', authenticate, authorizeAdmin, async (req, res) => {
  const { staffId } = req.params;

  try {
    const staff = await User.findById(staffId);
    if (!staff || staff.role !== 'staff') {
      return res.status(400).json({ error: 'Invalid staff ID or not a staff member' });
    }

    const assignments = await ItemAssignment.find({ staff: staffId }).populate('item');

    res.status(200).json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update quantityAssigned for an item assignment (Admin only)
router.patch('/:assignmentId', authenticate, authorizeAdmin, async (req, res) => {
  const { assignmentId } = req.params;
  const { quantityAssigned } = req.body;

  if (quantityAssigned == null || quantityAssigned < 0) {
    return res.status(400).json({ error: 'Invalid quantity value' });
  }

  try {
    const assignment = await ItemAssignment.findById(assignmentId).populate('item');
    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    const item = assignment.item;
    const oldQty = assignment.quantityAssigned;
    const diff = quantityAssigned - oldQty;

    if (diff > 0 && item.totalQuantity < diff) {
      return res.status(400).json({ error: 'Not enough stock to increase quantity' });
    }

    // Update assignment and item stock
    assignment.quantityAssigned = quantityAssigned;
    item.totalQuantity -= diff;
    await assignment.save();
    await item.save();

    res.status(200).json({
      message: 'Assignment updated successfully',
      oldQuantity: oldQty,
      newQuantity: quantityAssigned,
      itemRemaining: item.totalQuantity,
      assignment,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});



module.exports = router;
