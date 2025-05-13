// controllers/closingBalanceController.js
const ClosingBalance = require('../models/ClosingBalance'); // Import the ClosingBalance model
const mongoose = require('mongoose');

// Fetch sales for a specific staff member on the current day
exports.getDailySalesForStaff = async (req, res) => {
  const { staffId } = req.params;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  try {
    const closingBalance = await ClosingBalance.findOne({
      staff: staffId,
      date: { $gte: today, $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000) }
    })
      .populate('sales.item', 'name') // Populate just the name field from Item// Populate staff name if needed
      .populate('shift');
    console.log('Querying for:', {
      staffId: staffId,
      todayStart: new Date(today),
      todayEnd: new Date(today.getTime() + 24 * 60 * 60 * 1000)
    });

    // Populate shift details if needed
    console.log("closing", closingBalance);
    if (!closingBalance) {
      return res.status(404).json({
        success: false,
        message: 'No sales found for today'
      });
    }

    // Since items are already embedded, no need to populate
    const response = {
      date: closingBalance.date,
      staff: closingBalance.staff?.name || 'Unknown Staff',
      shift: closingBalance.shift,
      totalSales: closingBalance.totalSales,
      items: closingBalance.sales.map(sale => ({
        itemId: sale.item._id,
        itemName: sale.item.name,
        quantity: sale.quantitySold,
        subtotal: sale.totalAmount
      }))
    };

    res.status(200).json({
      success: true,
      data: response
    });

  } catch (error) {
    console.error('Error fetching daily sales:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching sales data',
      error: error.message
    });
  }
};
exports.getMonthlySalesForStaff = async (req, res) => {
  const { staffId } = req.params;
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1); // First day of the month
  const endOfMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0, 23, 59, 59); // Last day of the month

  try {
    const closingBalances = await ClosingBalance.aggregate([
      {
        $match: {
          staff: new mongoose.Types.ObjectId(staffId),
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $unwind: '$sales' // Unwind the sales array for aggregation
      },
      {
        $group: {
          _id: '$staff', // Group by staff ID
          totalSales: { $sum: '$sales.totalAmount' } // Sum totalAmount for sales
        }
      }
    ]);

    if (!closingBalances || closingBalances.length === 0) {
      return res.status(404).json({ message: 'No sales found for this staff in this month' });
    }

    res.status(200).json(closingBalances);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching monthly sales for staff' });
  }
};

