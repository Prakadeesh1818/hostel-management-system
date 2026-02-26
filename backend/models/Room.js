const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  floor: { type: Number, required: true },
  type: { type: String, enum: ['single', 'double', 'triple'], required: true },
  capacity: { type: Number, required: true },
  currentOccupancy: { type: Number, default: 0 },
  monthlyRent: { type: Number, required: true },
  facilities: [{ type: String }],
  isAvailable: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);