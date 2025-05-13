const SalesAnalytics = require('../models/SalesAnalytics');

// Get monthly sales analytics for a given month and year
exports.getMonthlySalesAnalytics = async (req, res) => {
  const { year, month } = req.params;

  try {
    const sales = await SalesAnalytics.aggregate([
      {
        $match: {
          date: {
            $gte: new Date(`${year}-${month}-01`),
            $lt: new Date(`${year}-${parseInt(month) + 1}-01`),
          },
        },
      },
      {
        $group: {
          _id: { $month: '$date' },
          totalSalesAmount: { $sum: '$totalSalesAmount' },
          totalItemsSold: { $sum: '$totalItemsSold' },
        },
      },
    ]);

    res.status(200).json(sales);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching sales analytics' });
  }
};
// Get daily sales analytics for a specific date
exports.getDailySalesAnalytics = async (req, res) => {
  const { year, month, day } = req.params;

  try {
    const startDate = new Date(`${year}-${month}-${day}T00:00:00.000Z`);
    const endDate = new Date(`${year}-${month}-${day}T23:59:59.999Z`);

    const dailyAnalytics = await SalesAnalytics.findOne({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate('totalStaffSales.staff', 'name'); // optional: populate staff info

    if (!dailyAnalytics) {
      return res.status(404).json({ message: 'No sales analytics found for this date' });
    }

    res.status(200).json(dailyAnalytics);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error fetching daily sales analytics' });
  }
};

