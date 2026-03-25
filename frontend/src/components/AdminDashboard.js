import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const AdminDashboard = ({ user, onLogout }) => {
  const [stats, setStats] = useState({});
  const [students, setStudents] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [payments, setPayments] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [roomForm, setRoomForm] = useState({ roomNumber: '', floor: '', type: 'single', capacity: 1, monthlyRent: '', facilities: '' });
  const [roomDetails, setRoomDetails] = useState(null);
  const [showRoomDetails, setShowRoomDetails] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, studentsRes, roomsRes, bookingsRes, complaintsRes, paymentsRes] = await Promise.all([
        axios.get('/api/admin/dashboard'),
        axios.get('/api/admin/students'),
        axios.get('/api/admin/rooms'),
        axios.get('/api/admin/bookings'),
        axios.get('/api/admin/complaints'),
        axios.get('/api/admin/payments')
      ]);
      setStats(statsRes.data);
      setStudents(studentsRes.data);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
      setComplaints(complaintsRes.data);
      setPayments(paymentsRes.data);
    } catch (error) {
      toast.error('Error fetching data');
    }
  };

  const handleAddRoom = async (e) => {
    e.preventDefault();
    try {
      const roomData = { ...roomForm, facilities: roomForm.facilities.split(',').map(f => f.trim()) };
      await axios.post('/api/admin/rooms', roomData);
      toast.success('Room added successfully');
      setShowModal(false);
      setRoomForm({ roomNumber: '', floor: '', type: 'single', capacity: 1, monthlyRent: '', facilities: '' });
      fetchData();
    } catch (error) {
      toast.error('Error adding room');
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm('Delete this room?')) {
      try {
        await axios.delete(`/api/admin/rooms/${roomId}`);
        toast.success('Room deleted');
        fetchData();
      } catch (error) {
        toast.error('Error deleting room');
      }
    }
  };

  const handleBookingAction = async (bookingId, status) => {
    try {
      await axios.patch(`/api/admin/bookings/${bookingId}`, { status });
      toast.success(`Booking ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Error updating booking');
    }
  };

  const handlePaymentAction = async (paymentId, action) => {
    try {
      await axios.patch(`/api/admin/payments/${paymentId}`, { action });
      toast.success(`Payment ${action === 'accept' ? 'accepted' : 'rejected'}`);
      fetchData();
    } catch (error) {
      toast.error('Error updating payment');
    }
  };

  const viewRoomDetails = async (roomId) => {
    try {
      const res = await axios.get(`/api/admin/rooms/${roomId}/details`);
      setRoomDetails(res.data);
      setShowRoomDetails(true);
    } catch (error) {
      toast.error('Error fetching room details');
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Admin Dashboard</h1>
        <div>
          <span>Welcome, {user.name}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div style={{padding: '0 2.5rem', marginBottom: '2rem'}}>
        {['dashboard', 'students', 'rooms', 'bookings', 'payments', 'complaints'].map(tab => (
          <button 
            key={tab}
            className={`btn ${activeTab === tab ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => setActiveTab(tab)}
            style={{marginRight: '1rem', width: 'auto'}}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="stats-grid">
          <div className="stat-card">
            <h3>Total Students</h3>
            <div className="number">{stats.totalStudents || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Total Rooms</h3>
            <div className="number">{stats.totalRooms || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Occupied Rooms</h3>
            <div className="number">{rooms.filter(r => r.currentOccupancy >= r.capacity).length}/{rooms.length}</div>
          </div>
          <div className="stat-card">
            <h3>Pending Bookings</h3>
            <div className="number">{stats.pendingBookings || 0}</div>
          </div>
          <div className="stat-card">
            <h3>Active Complaints</h3>
            <div className="number">{stats.activeComplaints || 0}</div>
          </div>
        </div>
      )}

      {activeTab === 'students' && (
        <div className="section">
          <h2>Students ({students.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Student ID</th>
                <th>Course</th>
                <th>Year</th>
                <th>Phone</th>
              </tr>
            </thead>
            <tbody>
              {students.map(student => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.email}</td>
                  <td>{student.studentId}</td>
                  <td>{student.course}</td>
                  <td>{student.year}</td>
                  <td>{student.phone}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="section">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2>Rooms ({rooms.length})</h2>
            <button className="btn btn-primary" onClick={() => setShowModal(true)}>Add Room</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Room Number</th>
                <th>Floor</th>
                <th>Type</th>
                <th>Capacity</th>
                <th>Occupancy</th>
                <th>Monthly Rent</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rooms.map(room => (
                <tr key={room._id}>
                  <td>
                    <span 
                      style={{color: '#4f46e5', cursor: 'pointer', textDecoration: 'underline'}}
                      onClick={() => viewRoomDetails(room._id)}
                    >
                      {room.roomNumber}
                    </span>
                  </td>
                  <td>{room.floor}</td>
                  <td>{room.type}</td>
                  <td>{room.capacity}</td>
                  <td>{room.currentOccupancy}/{room.capacity}</td>
                  <td>₹{room.monthlyRent}</td>
                  <td>
                    <button className="btn btn-danger" onClick={() => handleDeleteRoom(room._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="section">
          <h2>Bookings ({bookings.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Room</th>
                <th>Start Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.student?.name}</td>
                  <td>{booking.room?.roomNumber}</td>
                  <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                  <td>₹{booking.totalAmount}</td>
                  <td>{booking.status}</td>
                  <td>
                    {booking.status === 'pending' && (
                      <>
                        <button className="btn btn-success" onClick={() => handleBookingAction(booking._id, 'approved')}>Approve</button>
                        <button className="btn btn-danger" onClick={() => handleBookingAction(booking._id, 'rejected')}>Reject</button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="section">
          <h2>Payment Verifications ({payments.length})</h2>
          {payments.length === 0 ? (
            <p style={{padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px', color: '#065f46'}}>No pending payment verifications.</p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Student ID</th>
                  <th>Room</th>
                  <th>Amount</th>
                  <th>Type</th>
                  <th>Month/Year</th>
                  <th>Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(payment => (
                  <tr key={payment._id}>
                    <td>{payment.student?.name}</td>
                    <td>{payment.student?.studentId}</td>
                    <td>{payment.booking?.room?.roomNumber}</td>
                    <td style={{fontWeight: '600', color: '#10b981'}}>₹{payment.amount}</td>
                    <td>{payment.paymentType}</td>
                    <td>{payment.month} {payment.year}</td>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className="btn btn-success" style={{marginRight: '0.5rem'}} onClick={() => handlePaymentAction(payment._id, 'accept')}>Accept</button>
                      <button className="btn btn-danger" onClick={() => handlePaymentAction(payment._id, 'reject')}>Reject</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="section">
          <h2>Complaints ({complaints.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Student</th>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(complaint => (
                <tr key={complaint._id}>
                  <td>{complaint.student?.name}</td>
                  <td>{complaint.title}</td>
                  <td>{complaint.category}</td>
                  <td>{complaint.status}</td>
                  <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3>Add Room</h3>
              <button onClick={() => setShowModal(false)} style={{fontSize: '1.5rem', border: 'none', background: 'none', cursor: 'pointer'}}>×</button>
            </div>
            <form onSubmit={handleAddRoom}>
              <div className="form-group">
                <label>Room Number</label>
                <input type="text" value={roomForm.roomNumber} onChange={(e) => setRoomForm({...roomForm, roomNumber: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Floor</label>
                <input type="number" value={roomForm.floor} onChange={(e) => setRoomForm({...roomForm, floor: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Type</label>
                <select value={roomForm.type} onChange={(e) => setRoomForm({...roomForm, type: e.target.value})}>
                  <option value="single">Single</option>
                  <option value="double">Double</option>
                  <option value="triple">Triple</option>
                </select>
              </div>
              <div className="form-group">
                <label>Capacity</label>
                <input type="number" value={roomForm.capacity} onChange={(e) => setRoomForm({...roomForm, capacity: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Monthly Rent</label>
                <input type="number" value={roomForm.monthlyRent} onChange={(e) => setRoomForm({...roomForm, monthlyRent: e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Facilities (comma separated)</label>
                <input type="text" value={roomForm.facilities} onChange={(e) => setRoomForm({...roomForm, facilities: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary">Add Room</button>
            </form>
          </div>
        </div>
      )}

      {showRoomDetails && roomDetails && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '600px', maxHeight: '80vh', overflow: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3>Room {roomDetails.room?.roomNumber} Details</h3>
              <button onClick={() => setShowRoomDetails(false)} style={{fontSize: '1.5rem', border: 'none', background: 'none', cursor: 'pointer'}}>×</button>
            </div>
            
            <div style={{marginBottom: '2rem'}}>
              <h4 style={{marginBottom: '1rem', color: '#4f46e5'}}>Room Members ({roomDetails.members?.length || 0})</h4>
              {roomDetails.members && roomDetails.members.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {roomDetails.members.map((member, i) => (
                    <div key={i} style={{padding: '1rem', border: '1px solid #e1e5e9', borderRadius: '8px', background: '#f9fafb'}}>
                      <p style={{margin: '0 0 0.5rem 0', fontWeight: '600'}}>{member.student?.name}</p>
                      <p style={{margin: '0', fontSize: '0.9rem', color: '#666'}}>ID: {member.student?.studentId}</p>
                      <p style={{margin: '0', fontSize: '0.9rem', color: '#666'}}>Email: {member.student?.email}</p>
                      <p style={{margin: '0', fontSize: '0.9rem', color: '#666'}}>Course: {member.student?.course}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{color: '#666'}}>No members allocated yet</p>
              )}
            </div>

            <div>
              <h4 style={{marginBottom: '1rem', color: '#4f46e5'}}>Complaints ({roomDetails.complaints?.length || 0})</h4>
              {roomDetails.complaints && roomDetails.complaints.length > 0 ? (
                <div style={{display: 'flex', flexDirection: 'column', gap: '0.75rem'}}>
                  {roomDetails.complaints.map((complaint, i) => (
                    <div key={i} style={{padding: '1rem', border: '1px solid #e1e5e9', borderRadius: '8px', background: '#fff8f0'}}>
                      <p style={{margin: '0 0 0.5rem 0', fontWeight: '600'}}>{complaint.title}</p>
                      <p style={{margin: '0 0 0.5rem 0', fontSize: '0.9rem'}}>{complaint.description}</p>
                      <p style={{margin: '0', fontSize: '0.85rem', color: '#666'}}>By: {complaint.student?.name} | Status: {complaint.status}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{color: '#666'}}>No complaints from this room</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;