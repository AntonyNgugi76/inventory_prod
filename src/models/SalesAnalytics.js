const mongoose = require('mongoose');

const salesAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalSalesAmount: { type: Number, required: true },
  totalItemsSold: { type: Number, required: true },
  totalStaffSales: [
    {
      staff: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      totalSalesAmount: { type: Number, required: true },
      totalItemsSold: { type: Number, required: true },
    },
  ],
});

module.exports = mongoose.model('SalesAnalytics', salesAnalyticsSchema);
