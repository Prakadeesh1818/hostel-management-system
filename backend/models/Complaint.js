const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['maintenance', 'cleanliness', 'security', 'food', 'other'], required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' },
  adminResponse: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);