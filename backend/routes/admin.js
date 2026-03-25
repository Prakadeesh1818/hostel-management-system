const express = require('express');
const User = require('../models/User');
const Room = require('../models/Room');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');
const Complaint = require('../models/Complaint');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', adminAuth, async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalRooms = await Room.countDocuments();
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const activeComplaints = await Complaint.countDocuments({ status: 'open' });

    res.json({ totalStudents, totalRooms, pendingBookings, activeComplaints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/students', adminAuth, async (req, res) => {
  try {
    const students = await User.find({ role: 'student' }).select('-password');
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms/:id/details', adminAuth, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    const members = await Booking.find({ room: req.params.id, status: 'approved' })
      .populate('student', 'name email studentId phone course');
    const complaints = await Complaint.find({ student: { $in: members.map(m => m.student._id) } })
      .populate('student', 'name');
    
    res.json({ room, members, complaints });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/rooms', adminAuth, async (req, res) => {
  try {
    const rooms = await Room.find();
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/rooms', adminAuth, async (req, res) => {
  try {
    const room = new Room(req.body);
    await room.save();
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.delete('/rooms/:id', adminAuth, async (req, res) => {
  try {
    await Room.findByIdAndDelete(req.params.id);
    res.json({ message: 'Room deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/bookings', adminAuth, async (req, res) => {
  try {
    const bookings = await Booking.find().populate('student', 'name email').populate('room', 'roomNumber');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/bookings/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findByIdAndUpdate(req.params.id, { status }, { new: true });

    if (status === 'approved') {
      await Room.findByIdAndUpdate(booking.room, { $inc: { currentOccupancy: 1 } });
      const now = new Date();
      await Payment.create({
        student: booking.student,
        booking: booking._id,
        amount: booking.monthlyRent,
        paymentType: 'rent',
        status: 'pending',
        month: now.toLocaleString('default', { month: 'long' }),
        year: now.getFullYear()
      });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/payments', adminAuth, async (req, res) => {
  try {
    const payments = await Payment.find({ status: 'verifying' })
      .populate('student', 'name email studentId')
      .populate({ path: 'booking', populate: { path: 'room', select: 'roomNumber type' } });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/payments/:id', adminAuth, async (req, res) => {
  try {
    const { action } = req.body;
    const status = action === 'accept' ? 'completed' : 'pending';
    const payment = await Payment.findByIdAndUpdate(req.params.id, { status }, { new: true });
    res.json(payment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/complaints', adminAuth, async (req, res) => {
  try {
    const complaints = await Complaint.find().populate('student', 'name email');
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.patch('/complaints/:id', adminAuth, async (req, res) => {
  try {
    const { status, adminResponse } = req.body;
    const complaint = await Complaint.findByIdAndUpdate(req.params.id, { status, adminResponse }, { new: true });
    res.json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;