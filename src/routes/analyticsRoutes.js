const express = require('express');
const router = express.Router();
const {
  getDailySalesAnalytics,
  getMonthlySalesAnalytics,
  getMonthlySales
} = require('../controllers/analyticsController');

// Route: GET daily sales analytics
router.get('/sales/analytics/daily/:year/:month/:day', getDailySalesAnalytics);

// Route: GET monthly sales analytics
router.get('/sales/analytics/monthly/:year/:month', getMonthlySalesAnalytics);

// const { getMonthlySales } = require('../controllers/analyticsController');

router.get('/monthly-room-sales', getMonthlySales);

module.exports = router;


module.exports = router;
