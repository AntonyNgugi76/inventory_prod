const express = require('express');
const Shift = require('../models/Shift');
const router = express.Router();
const Sale = require('../models/Sale');
const Item = require('../models/Item');
const ItemAssignment = require('../models/ItemAssignment');
const { authenticate } = require('../middleware/auth');
const mongoose = require('mongoose');
const { protect, adminOnly } = require('../middleware/authMiddleware'); // Adjust the path accordingly


// Staff sells an assigned item
router.post('/sell', authenticate, async (req, res) => {
  const { itemId, quantity } = req.body;

  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Only staff can sell items' });
    }

    // 1. Check for active shift
    const activeShift = await Shift.findOne({ staff: req.user._id, endTime: null });
    if (!activeShift) {
      return res.status(400).json({ error: 'No active shift. Please start your shift first.' });
    }

    // 2. Check item assignment
    const assignment = await ItemAssignment.findOne({
      staff: req.user._id,
      item: itemId
    });

    if (!assignment || assignment.quantityAssigned < quantity) {
      return res.status(400).json({ error: 'Not enough assigned quantity' });
    }

    // 3. Get item details
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const pricePerItem = item.price;
    const totalAmount = pricePerItem * quantity;

    // 4. Reduce assigned quantity
    assignment.quantityAssigned -= quantity;
    await assignment.save();

    // 5. Create sale record
    const sale = new Sale({
      staff: req.user._id,
      shift: activeShift._id,
      item: itemId,
      quantitySold: quantity,
      pricePerItem,
      totalAmount
    });

    await sale.save();
    res.status(201).json({ message: 'Item sold', sale });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;


// View sales for current day
router.get('/my-daily-sales', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'staff') {
      return res.status(403).json({ error: 'Staff only' });
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const end = new Date();
    end.setHours(23, 59, 59, 999);

    const sales = await Sale.find({
      staff: req.user._id,
      soldAt: { $gte: start, $lte: end }
    }).populate('item');

    res.status(200).json(sales);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/today-sales', protect, adminOnly, async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)); // Set time to 00:00:00
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)); // Set time to 23:59:59

    const todaysSales = await Sale.find({
      soldAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('staff', 'name email')  // Populate staff details like name and email
      .populate('item', 'name price');  // Populate item details like name and price

    if (todaysSales.length === 0) {
      return res.status(404).json({ message: 'No sales today.' });
    }

    const totalSalesValue = todaysSales.reduce((acc, sale) => {
      return acc + sale.quantitySold * sale.item.price; // Sum up the total sales
    }, 0);

    const response = {
      totalSalesValue: totalSalesValue,
      sales: todaysSales.map(sale => ({
        saleId: sale._id,
        itemName: sale.item.name,
        quantitySold: sale.quantitySold,
        itemPrice: sale.item.price,
        totalPrice: sale.quantitySold * sale.item.price, // Total price for that sale
        staff: {
          name: sale.staff.name,
          email: sale.staff.email
        },
        soldAt: sale.soldAt,
      }))
    };

    res.status(200).json(response);

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.get('/recent', protect, adminOnly, async (req, res) => {
  try {
    const recentSales = await Sale.find()
      .sort({ soldAt: -1 })
      .limit(10)
      .populate('item', 'name')
      .populate('staff', 'name email');

    const formattedSales = recentSales.map(sale => ({
      itemName: sale.item.name,
      staffName: sale.staff.name,
      staffEmail: sale.staff.email,
      quantitySold: sale.quantitySold,
      soldAt: sale.soldAt,
    }));

    res.json({ recentSales: formattedSales });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch recent sales' });
  }
});




module.exports = router;
