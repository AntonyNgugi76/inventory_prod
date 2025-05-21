const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./src/routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
const itemRoutes = require('./src/routes/itemRoutes');
app.use('/api/items', itemRoutes);
const assignmentRoutes = require('./src/routes/assignmentRoutes');
app.use('/api/assignments', assignmentRoutes);

const saleRoutes = require('./src/routes/saleRoutes');
app.use('/api/sales', saleRoutes);

const closingBalanceRoutes = require('./src/routes/closingBalanceRoutes');
app.use('/api/closing-balance', closingBalanceRoutes);

const staffRoutes = require('./src/routes/staffRoute'); // Import staff routes
app.use('/api', staffRoutes);
app.use('/api', closingBalanceRoutes);

const analyticsRoutes = require('./src/routes/analyticsRoutes');
app.use('/api', analyticsRoutes);


const shiftRoutes = require('./src/routes/shiftRoutes');
app.use('/api', shiftRoutes);

const roomRoutes = require('./src/routes/roomRoutes');

app.use('/api/rooms', roomRoutes);
const bookingRoutes = require('./src/routes/bookingRoutes');
app.use('/api/bookings', bookingRoutes);





console.log('we are running....');

// DB + Server
mongoose.connect(process.env.MONGO_URI)
  .then(() => app.listen(process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT}`);
  }))
  .catch(err => console.log(err));
