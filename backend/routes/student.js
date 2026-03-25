const express = require('express');
const QRCode = require('qrcode');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { auth } = require('../middleware/auth');

const router = express.Router();

router.get('/profile', auth, async (req, res) => {
  try {
    res.json(req.user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms', auth, async (req, res) => {
  try {
    const rooms = await Room.find({ isAvailable: true });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/book-room', auth, async (req, res) => {
  try {
    const { roomId, startDate, endDate } = req.body;

    const existingBooking = await Booking.findOne({
      student: req.user._id,
      status: { $in: ['pending', 'approved'] }
    });
    if (existingBooking) {
      return res.status(400).json({ message: 'You already have an active or pending booking' });
    }

    const room = await Room.findById(roomId);
    if (!room || room.currentOccupancy >= room.capacity) {
      return res.status(400).json({ message: 'Room not available' });
    }

    const booking = new Booking({
      student: req.user._id,
      room: roomId,
      startDate,
      endDate,
      monthlyRent: room.monthlyRent,
      totalAmount: room.monthlyRent * 3
    });

    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/bookings', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ student: req.user._id }).populate('room', 'roomNumber type');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/generate-qr/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findOne({ _id: req.params.paymentId, student: req.user._id, status: 'pending' });
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    const upiUrl = `upi://pay?pa=${process.env.UPI_ID}&pn=HostelHub&am=${payment.amount}&cu=INR&tn=${payment.paymentType}-${payment.month}-${payment.year}`;
    const imageUrl = await QRCode.toDataURL(upiUrl, { width: 300, margin: 2 });
    res.json({ imageUrl, amount: payment.amount });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/payment', auth, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, student: req.user._id, status: 'pending' },
      { status: 'verifying' },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/payments', auth, async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id }).populate('booking');
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/complaint', auth, async (req, res) => {
  try {
    const { title, description, category } = req.body;
    const complaint = new Complaint({ student: req.user._id, title, description, category });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/complaints', auth, async (req, res) => {
  try {
    const complaints = await Complaint.find({ student: req.user._id });
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;