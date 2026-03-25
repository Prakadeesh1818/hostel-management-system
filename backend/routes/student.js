const express = require('express');
const crypto = require('crypto');
const Razorpay = require('razorpay');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { auth } = require('../middleware/auth');

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

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

router.post('/payment', auth, async (req, res) => {
  try {
    const { paymentId } = req.body;
    const payment = await Payment.findOneAndUpdate(
      { _id: paymentId, student: req.user._id, status: 'pending' },
      { status: 'completed' },
      { new: true }
    );
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/create-qr', auth, async (req, res) => {
  try {
    const { bookingId, amount, paymentType, month, year } = req.body;
    const qr = await razorpay.qrCode.create({
      type: 'upi_qr',
      name: 'HostelHub',
      usage: 'single_use',
      fixed_amount: true,
      payment_amount: amount * 100,
      description: `${paymentType} - ${month} ${year}`,
      close_by: Math.floor(Date.now() / 1000) + 600
    });
    const payment = new Payment({
      student: req.user._id,
      booking: bookingId,
      amount,
      paymentType,
      month,
      year,
      status: 'pending',
      razorpayQrId: qr.id
    });
    await payment.save();
    res.json({ qrId: qr.id, imageUrl: qr.image_url, paymentId: payment._id });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/payment-status/:paymentId', auth, async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.paymentId);
    if (!payment) return res.status(404).json({ message: 'Payment not found' });
    res.json({ status: payment.status, razorpayPaymentId: payment.razorpayPaymentId });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/payment-webhook', async (req, res) => {
  try {
    const signature = req.headers['x-razorpay-signature'];
    const body = req.body;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');
    if (signature !== expectedSignature) return res.status(400).json({ message: 'Invalid signature' });
    const event = JSON.parse(body);
    if (event.event === 'qr_code.credited') {
      const qrId = event.payload.qr_code.entity.id;
      const razorpayPaymentId = event.payload.payment.entity.id;
      await Payment.findOneAndUpdate(
        { razorpayQrId: qrId },
        { status: 'completed', razorpayPaymentId }
      );
    }
    res.json({ status: 'ok' });
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