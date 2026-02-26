const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');
const Room = require('./models/Room');

const setupDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    await User.deleteMany({});
    await Room.deleteMany({});

    const admin = new User({
      name: 'Admin User',
      email: 'admin@hostel.com',
      password: 'admin123',
      role: 'admin'
    });
    await admin.save();

    const student = new User({
      name: 'John Doe',
      email: 'student@hostel.com',
      password: 'student123',
      studentId: 'STU001',
      phone: '9876543210',
      course: 'Computer Science',
      year: 2,
      address: '123 Main Street',
      guardianName: 'Jane Doe',
      guardianPhone: '9876543211'
    });
    await student.save();

    const rooms = [];
    const roomTypes = ['single', 'double', 'triple'];
    const facilities = [
      ['WiFi', 'AC', 'Study Table'],
      ['WiFi', 'Fan', 'Wardrobe'],
      ['WiFi', 'AC', 'Balcony', 'Study Table'],
      ['WiFi', 'Fan', 'Attached Bathroom'],
      ['WiFi', 'AC', 'Mini Fridge', 'Study Table'],
      ['WiFi', 'Fan', 'Wardrobe', 'Study Table']
    ];

    for (let i = 1; i <= 30; i++) {
      const floor = Math.ceil(i / 10);
      const roomNumber = `${floor}${String(i % 10 || 10).padStart(2, '0')}`;
      const type = roomTypes[Math.floor(Math.random() * roomTypes.length)];
      const capacity = type === 'single' ? 1 : type === 'double' ? 2 : 3;
      const baseRent = type === 'single' ? 8000 : type === 'double' ? 6000 : 5000;
      const monthlyRent = baseRent + (floor * 500) + Math.floor(Math.random() * 1000);
      const roomFacilities = facilities[Math.floor(Math.random() * facilities.length)];

      rooms.push({
        roomNumber,
        floor,
        type,
        capacity,
        monthlyRent,
        facilities: roomFacilities,
        currentOccupancy: 0,
        isAvailable: true
      });
    }

    await Room.insertMany(rooms);

    console.log('Setup Complete!');
    console.log('Admin: admin@hostel.com / admin123');
    console.log('Student: student@hostel.com / student123');
    process.exit(0);
  } catch (error) {
    console.error('Setup error:', error);
    process.exit(1);
  }
};

setupDatabase();