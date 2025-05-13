const express = require('express');
const router = express.Router();
const Item = require('../models/Item');
const { authenticate, authorizeAdmin } = require('../middleware/auth');
// const { authenticate, authorizeAdmin } = require('../middleware/authMiddleware');

// Create an item
router.post('/', authenticate, authorizeAdmin, async (req, res) => {
  const { name, description, price, totalQuantity, lowStockThreshold } = req.body;

  try {
    // Check if an item with the same name exists (case-insensitive)
    const existingItem = await Item.findOne({ name: new RegExp(`^${name}$`, 'i') });

    if (existingItem) {
      // Increment quantity and update other fields if necessary
      existingItem.totalQuantity += totalQuantity;
      existingItem.description = description;
      existingItem.price = price;
      existingItem.lowStockThreshold = lowStockThreshold;

      await existingItem.save();
      return res.status(200).json({ message: 'Item quantity updated', item: existingItem });
    }

    // Create a new item if it doesn't exist
    const newItem = new Item({ name, description, price, totalQuantity, lowStockThreshold });
    await newItem.save();
    res.status(201).json({ message: 'New item created', item: newItem });

  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});


// Fetch all items
router.get('/', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const items = await Item.find();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update an item
router.put('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const updatedItem = await Item.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!updatedItem) return res.status(404).json({ error: 'Item not found' });
    res.json(updatedItem);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete an item
router.delete('/:id', authenticate, authorizeAdmin, async (req, res) => {
  try {
    const deletedItem = await Item.findByIdAndDelete(req.params.id);
    if (!deletedItem) return res.status(404).json({ error: 'Item not found' });
    res.json({ message: 'Item deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
router.get('/low-stock', authenticate, authorizeAdmin, async (req, res) => {
  try {
    let threshold = req.query.threshold || 5;

    // Parse the threshold into a number
    threshold = parseInt(threshold, 10);

    if (isNaN(threshold)) {
      return res.status(400).json({ error: 'Threshold must be a valid number.' });
    }

    // Find low stock items
    const lowStockItems = await Item.find({ totalQuantity: { $lt: threshold } })
      .select('name totalQuantity');

    res.status(200).json({
      count: lowStockItems.length,
      items: lowStockItems,
    });
  } catch (err) {
    res.status(500).json({ error: 'Server error: ' + err.message });
  }
});

module.exports = router;
