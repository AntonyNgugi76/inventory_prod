const SalesAnalytics = require('../models/SalesAnalytics');

// Function to collect daily sales and save it in the database
exports.collectDailySales = async () => {
  const date = new Date();
  const dailySales = await SalesAnalytics.findOne({ date: date.setHours(0, 0, 0, 0) });

  if (dailySales) {
    return; // If daily sales are already collected for today, no need to collect again
  }

  // Fetch sales data from the "Sales" model (or however you're storing transactions)
  const salesData = await Sales.find({
    createdAt: { $gte: new Date().setHours(0, 0, 0, 0), $lt: new Date().setHours(23, 59, 59, 999) },
  });

  let totalSalesAmount = 0;
  let totalItemsSold = 0;
  let staffSales = {};

  salesData.forEach(sale => {
    totalSalesAmount += sale.totalAmount;
    totalItemsSold += sale.quantitySold;

    if (!staffSales[sale.staff]) {
      staffSales[sale.staff] = { totalSalesAmount: 0, totalItemsSold: 0 };
    }

    staffSales[sale.staff].totalSalesAmount += sale.totalAmount;
    staffSales[sale.staff].totalItemsSold += sale.quantitySold;
  });

  // Save sales data to the database
  const newSalesAnalytics = new SalesAnalytics({
    date,
    totalSalesAmount,
    totalItemsSold,
    totalStaffSales: Object.keys(staffSales).map(staffId => ({
      staff: staffId,
      totalSalesAmount: staffSales[staffId].totalSalesAmount,
      totalItemsSold: staffSales[staffId].totalItemsSold,
    })),
  });

  await newSalesAnalytics.save();
};
