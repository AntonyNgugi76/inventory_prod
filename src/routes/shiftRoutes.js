const express = require('express');
const router = express.Router();
const Shift = require('../models/Shift');
const Sale = require('../models/Sale');
const Item = require('../models/Item');
const { protect } = require('../middleware/authMiddleware');

// POST /start-shift// POST /start-shift
router.post('/start-shift', protect, async (req, res) => {
  try {
    const staffId = req.user.id;

    // Check if staff has an open shift already
    const openShift = await Shift.findOne({ staff: staffId, endTime: null });
    if (openShift) {
      return res.status(400).json({ message: 'You already have an active shift.' });
    }

    // Get current stock snapshot
    const items = await Item.find();
    const stockSnapshot = items.map(item => ({
      item: item._id,
      quantity: item.totalQuantity
    }));

    // Get confirmation & remarks from body
    const { confirmedStock, stockRemarks } = req.body;

    // Create the shift
    const newShift = new Shift({
      staff: staffId,
      openingStock: stockSnapshot,
      confirmedStock: confirmedStock || false,
      stockRemarks: stockRemarks || ''
    });

    // Save the shift
    await newShift.save();

    // Now populate the item names in the saved shift
    await newShift.populate({
      path: 'openingStock.item',
      select: 'name'  // Only select the 'name' field from the Item model
    });

    res.status(201).json({ message: 'Shift started successfully.', shift: newShift });

  } catch (error) {
    console.error('Start shift error:', error);
    res.status(500).json({ error: 'Failed to start shift.' });
  }
});



// POST /close-shift
router.post('/close-shift', protect, async (req, res) => {
  try {
    const staffId = req.user.id;

    const openShift = await Shift.findOne({ staff: staffId, endTime: null });
    if (!openShift) {
      return res.status(400).json({ message: 'No active shift to close.' });
    }

    openShift.endTime = Date.now();

    const { handedOverTo, expenses } = req.body;

    if (handedOverTo) {
      openShift.handedOverTo = handedOverTo;
    }

    if (Array.isArray(expenses)) {
      openShift.expenses = openShift.expenses || [];

      expenses.forEach(exp => {
        if (exp.description && exp.amount != null) {
          openShift.expenses.push({
            description: exp.description,
            amount: exp.amount,
            addedBy: staffId
          });
        }
      });
    }

    await openShift.save();

    res.status(200).json({ message: 'Shift closed successfully.', shift: openShift });

  } catch (error) {
    console.error('Close shift error:', error);
    res.status(500).json({ error: 'Failed to close shift.' });
  }
});



router.get('/check-shift', protect, async (req, res) => {
  try {
    const staffId = req.user.id;

    const activeShift = await Shift.findOne({ staff: staffId, endTime: null });

    if (activeShift) {
      return res.status(200).json({ hasActiveShift: true, shift: activeShift });
    } else {
      return res.status(200).json({ hasActiveShift: false });
    }
  } catch (error) {
    console.error('Check shift error:', error);
    res.status(500).json({ error: 'Failed to check shift.' });
  }
});

router.get('/sales-per-shift', protect, async (req, res) => {
  try {
    // Ensure only admins or managers can view all shifts
    if (req.user.role !== 'admin' && req.user.role !== 'manager') {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all shifts with staff info
    const shifts = await Shift.find({})
      .populate('staff', 'name')
      .sort({ startTime: -1 });

    const salesPerShift = await Promise.all(
      shifts.map(async (shift) => {
        // Get sales for the shift
        const sales = await Sale.find({ shift: shift._id })
          .populate('item', 'name price')
          .lean();

        // Summarize items sold
        const itemsSold = [];
        let totalSales = 0;

        sales.forEach((sale) => {
          const existing = itemsSold.find(i => i.item._id.equals(sale.item._id));
          if (existing) {
            existing.quantitySold += sale.quantitySold;
            existing.totalAmount += sale.totalAmount;
          } else {
            itemsSold.push({
              item: {
                _id: sale.item._id,
                name: sale.item.name,
                price: sale.item.price
              },
              quantitySold: sale.quantitySold,
              totalAmount: sale.totalAmount
            });
          }
          totalSales += sale.totalAmount;
        });

        return {
          shiftId: shift._id,
          staffName: shift.staff?.name || 'Unknown',
          startTime: shift.startTime,
          endTime: shift.endTime,
          totalSales,
          itemsSold
        };
      })
    );

    res.status(200).json({
      totalShifts: salesPerShift.length,
      shifts: salesPerShift
    });
  } catch (err) {
    console.error('Error fetching sales per shift:', err);
    res.status(500).json({ error: 'Failed to fetch sales per shift', details: err.message });
  }
});
router.get('/expenses', protect, async (req, res) => {
  try {
    const { filter } = req.query;

    let dateFilter = {};

    const now = new Date();

    if (filter === 'today') {
      // Start of today (midnight)
      const startOfDay = new Date(now);
      startOfDay.setHours(0, 0, 0, 0);

      // Start of tomorrow
      const endOfDay = new Date(startOfDay);
      endOfDay.setDate(startOfDay.getDate() + 1);

      dateFilter = {
        'expenses.timestamp': { $gte: startOfDay, $lt: endOfDay }
      };
    } else if (filter === 'month') {
      // Start of the month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      // Start of next month
      const startOfNextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

      dateFilter = {
        'expenses.timestamp': { $gte: startOfMonth, $lt: startOfNextMonth }
      };
    }

    const shiftsWithExpenses = await Shift.find({
      'expenses.0': { $exists: true },
      ...dateFilter
    })
      .populate('expenses.addedBy', 'name email')
      .select('expenses startTime endTime staff');

    // Flatten and filter expenses to ensure match
    const allExpenses = shiftsWithExpenses.flatMap(shift =>
      shift.expenses
        .filter(exp => {
          if (!dateFilter['expenses.timestamp']) return true;
          const ts = new Date(exp.timestamp);
          return ts >= dateFilter['expenses.timestamp'].$gte && ts < dateFilter['expenses.timestamp'].$lt;
        })
        .map(exp => ({
          ...exp.toObject(),
          shiftId: shift._id,
          staff: shift.staff,
          startTime: shift.startTime,
          endTime: shift.endTime,
        }))
    );

    res.status(200).json({ count: allExpenses.length, expenses: allExpenses });

  } catch (err) {
    console.error('Error fetching expenses:', err);
    res.status(500).json({ error: 'Failed to retrieve expenses' });
  }
});




module.exports = router;
