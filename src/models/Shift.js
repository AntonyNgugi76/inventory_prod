const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const shiftSchema = new Schema({
  staff: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  startTime: { type: Date, default: Date.now },
  endTime: { type: Date },

  openingStock: [{
    item: { type: Schema.Types.ObjectId, ref: 'Item' },
    quantity: Number
  }],

  closingStock: [{
    item: { type: Schema.Types.ObjectId, ref: 'Item' },
    quantity: Number
  }],

  confirmedStock: { type: Boolean, default: false },
  stockRemarks: { type: String },

  handedOverTo: { type: Schema.Types.ObjectId, ref: 'User' },

  totalSalesAmount: { type: Number, default: 0 },
  sales: [{ type: Schema.Types.ObjectId, ref: 'Sale' }], // Reference to sales made during the shift

}, { timestamps: true });

module.exports = mongoose.model('Shift', shiftSchema);
