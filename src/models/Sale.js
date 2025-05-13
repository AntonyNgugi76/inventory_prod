const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const saleSchema = new Schema({
  staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  shift: { type: Schema.Types.ObjectId, ref: 'Shift', required: true }, // Link to the active shift
  item: { type: Schema.Types.ObjectId, ref: 'Item', required: true },
  quantitySold: { type: Number, required: true },
  pricePerItem: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  soldAt: { type: Date, default: Date.now }
});

const Sale = mongoose.model('Sale', saleSchema);
module.exports = Sale;
