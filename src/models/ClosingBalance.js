const mongoose = require('mongoose');

const closingBalanceSchema = new mongoose.Schema({
  staff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    default: () => new Date().setHours(0, 0, 0, 0)
  },
  sales: [
    {
      item: {
        _id: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Item',
          required: true
        },
        name: {  // Add name field
          type: String,
          required: true
        }
      },
      quantitySold: {
        type: Number,
        required: true
      },
      totalAmount: {
        type: Number,
        required: true
      }
    }
  ],
  totalSales: {
    type: Number,
    default: 0
  },

});

// Pre-save hook to calculate total sales
closingBalanceSchema.pre('save', function (next) {
  if (this.isModified('sales')) {
    // Calculate the total sales
    this.totalSales = this.sales.reduce((total, sale) => total + sale.totalAmount, 0);
  }
  next();
});

module.exports = mongoose.model('ClosingBalance', closingBalanceSchema);
