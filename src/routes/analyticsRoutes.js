const express = require('express');
const router = express.Router();
const {
  getDailySalesAnalytics,
  getMonthlySalesAnalytics,
} = require('../controllers/analyticsController');

// Route: GET daily sales analytics
router.get('/sales/analytics/daily/:year/:month/:day', getDailySalesAnalytics);

// Route: GET monthly sales analytics
router.get('/sales/analytics/monthly/:year/:month', getMonthlySalesAnalytics);

module.exports = router;
