const cron = require('node-cron');
const { collectDailySales } = require('../controllers/salesController');

// Schedule to run the sales collection every midnight
cron.schedule('0 0 0 * * *', () => {
  collectDailySales();
});
