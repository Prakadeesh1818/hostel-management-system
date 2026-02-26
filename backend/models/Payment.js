const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  booking: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  amount: { type: Number, required: true },
  paymentType: { type: String, enum: ['rent', 'deposit'], required: true },
  status: { type: String, enum: ['pending', 'completed'], default: 'pending' },
  month: { type: String },
  year: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Payment', paymentSchema);