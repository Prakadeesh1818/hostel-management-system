const express = require('express');
const Room = require('../models/Room');
const User = require('../models/User');
const Booking = require('../models/Booking');
const Complaint = require('../models/Complaint');
const Payment = require('../models/Payment');

const router = express.Router();

router.get('/stats', async (req, res) => {
  try {
    const totalRooms = await Room.countDocuments();
    const availableRooms = await Room.countDocuments({ 
      $expr: { $lt: ['$currentOccupancy', '$capacity'] } 
    });
    const totalStudents = await User.countDocuments({ role: 'student' });
    const pendingBookings = await Booking.countDocuments({ status: 'pending' });
    const approvedBookings = await Booking.countDocuments({ status: 'approved' });
    const activeComplaints = await Complaint.countDocuments({ status: 'open' });
    const resolvedComplaints = await Complaint.countDocuments({ status: 'resolved' });
    const totalPayments = await Payment.countDocuments();
    const pendingPayments = await Payment.countDocuments({ status: 'pending' });
    
    const students = await User.find({ role: 'student' }).select('name email studentId course year').limit(50);
    
    const roomsByType = await Room.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          available: {
            $sum: {
              $cond: [{ $lt: ['$currentOccupancy', '$capacity'] }, 1, 0]
            }
          },
          minPrice: { $min: '$monthlyRent' },
          maxPrice: { $max: '$monthlyRent' },
          avgPrice: { $avg: '$monthlyRent' }
        }
      }
    ]);

    const roomsByFloor = await Room.aggregate([
      {
        $group: {
          _id: '$floor',
          count: { $sum: 1 },
          available: {
            $sum: {
              $cond: [{ $lt: ['$currentOccupancy', '$capacity'] }, 1, 0]
            }
          }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const recentBookings = await Booking.find()
      .populate('student', 'name email')
      .populate('room', 'roomNumber type')
      .sort({ createdAt: -1 })
      .limit(10);

    const recentComplaints = await Complaint.find()
      .populate('student', 'name email')
      .sort({ createdAt: -1 })
      .limit(10);

    const studentsByCourse = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$course',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    const studentsByYear = await User.aggregate([
      { $match: { role: 'student' } },
      {
        $group: {
          _id: '$year',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const studentRoomMapping = await Booking.find({ status: 'approved' })
      .populate('student', 'name email studentId')
      .populate('room', 'roomNumber floor type')
      .select('student room');

    res.json({
      totalRooms,
      availableRooms,
      occupiedRooms: totalRooms - availableRooms,
      totalStudents,
      pendingBookings,
      approvedBookings,
      activeComplaints,
      resolvedComplaints,
      totalPayments,
      pendingPayments,
      students,
      roomsByType,
      roomsByFloor,
      recentBookings,
      recentComplaints,
      studentsByCourse,
      studentsByYear,
      studentRoomMapping
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;