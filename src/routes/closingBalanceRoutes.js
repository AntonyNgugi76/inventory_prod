const express = require('express');
const router = express.Router();
const Sale = require('../models/Sale');
const Item = require('../models/Item');
const Shift = require('../models/Shift');
const ClosingBalance = require('../models/ClosingBalance');
const { authenticate } = require('../middleware/auth');
const closingBalanceController = require('../controllers/closingBalanceController');


router.post('/close-shift-balance/:shiftId', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Only staff can close balance' });
    }

    const shiftId = req.params.shiftId;

    // Get the shift with staff populated
    const shift = await Shift.findById(shiftId).populate('staff', 'name');
    if (!shift) {
      return res.status(404).json({ error: 'Shift not found' });
    }

    // Get all sales for that shift
    const sales = await Sale.find({ shift: shiftId })
      .populate('item', 'name price')
      .lean();

    if (sales.length === 0) {
      return res.status(400).json({ error: 'No sales recorded in this shift' });
    }

    // Summarize sales
    const salesSummary = sales.reduce((acc, sale) => {
      const existing = acc.find(item => item.item._id.equals(sale.item._id));
      if (existing) {
        existing.quantitySold += sale.quantitySold;
        existing.totalAmount += sale.totalAmount;
      } else {
        acc.push({
          item: {
            _id: sale.item._id,
            name: sale.item.name,
            price: sale.item.price
          },
          quantitySold: sale.quantitySold,
          totalAmount: sale.totalAmount
        });
      }
      return acc;
    }, []);

    const totalSalesAmount = salesSummary.reduce(
      (sum, sale) => sum + sale.totalAmount, 0
    );

    // Save closing balance with staff as ObjectId
    const closingBalance = await ClosingBalance.findOneAndUpdate(
      { shift: shiftId },
      {
        shift: shiftId,
        staff: shift.staff._id, // store only ObjectId
        date: shift.startTime,
        sales: salesSummary,
        totalSales: totalSalesAmount
      },
      { upsert: true, new: true, strict: false }
    ).populate('staff', 'name'); // populate after save

    res.status(200).json({
      message: 'Shift sales closed successfully',
      closingBalance: {
        ...closingBalance.toObject(),
        staffName: closingBalance.staff.name
      }
    });

  } catch (err) {
    console.error('Error closing shift balance:', err);
    res.status(500).json({
      error: 'Failed to close shift balance',
      details: err.message
    });
  }
});




router.get('/sales/daily/:staffId', closingBalanceController.getDailySalesForStaff);
// routes/closingBalanceRoutes.js
router.get('/sales/monthly/:staffId', closingBalanceController.getMonthlySalesForStaff); // New route




module.exports = router;
