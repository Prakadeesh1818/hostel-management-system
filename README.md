# Hostel Management System

A complete MERN stack hostel management system with separate frontend and backend.

## Features

### Admin Features
- Dashboard with statistics
- Student management
- Room management (add/delete rooms)
- Booking approval system
- Complaint management

### Student Features
- Student registration and login
- Room browsing and booking
- Payment management
- Complaint system

## Project Structure

```
HOSTEL_SYSTEM/
├── backend/                # Node.js/Express API
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── middleware/        # Authentication middleware
│   ├── server.js          # Main server file
│   ├── setup.js           # Database setup
│   └── package.json
├── frontend/              # React application
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── App.js         # Main App component
│   │   └── App.css        # Styles
│   └── package.json
└── install.bat           # Installation script
```

## Installation

1. **Run installation script:**
   ```bash
   install.bat
   ```

2. **Start backend:**
   ```bash
   cd backend
   npm run dev
   ```

3. **Start frontend:**
   ```bash
   cd frontend
   npm start
   ```

## Login Credentials

- **Admin**: admin@hostel.com / admin123
- **Student**: student@hostel.com / student123

## API Endpoints

- `POST /api/auth/register` - Student registration
- `POST /api/auth/login` - Login
- `GET /api/admin/dashboard` - Admin dashboard stats
- `GET /api/admin/students` - Get all students
- `POST /api/admin/rooms` - Add room
- `DELETE /api/admin/rooms/:id` - Delete room
- `GET /api/student/rooms` - Get available rooms
- `POST /api/student/book-room` - Book room
- `POST /api/student/payment` - Make payment
- `POST /api/student/complaint` - Raise complaint

## Technology Stack

- **Backend**: Node.js, Express.js, MongoDB, JWT
- **Frontend**: React.js, Axios, React Router
- **Database**: MongoDB with Mongoose

The system is now clean, organized, and error-free!