import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const StudentDashboard = ({ user, onLogout }) => {
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [payments, setPayments] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [profile, setProfile] = useState(user);
  const [activeTab, setActiveTab] = useState('profile');
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState('');
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bill, setBill] = useState(null);
  const [qrModal, setQrModal] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [profileRes, roomsRes, bookingsRes, paymentsRes, complaintsRes] = await Promise.all([
        axios.get('/api/student/profile'),
        axios.get('/api/student/rooms'),
        axios.get('/api/student/bookings'),
        axios.get('/api/student/payments'),
        axios.get('/api/student/complaints')
      ]);
      setProfile(profileRes.data);
      setRooms(roomsRes.data);
      setBookings(bookingsRes.data);
      setPayments(paymentsRes.data);
      setComplaints(complaintsRes.data);
    } catch (error) {
      toast.error('Error fetching data');
    }
  };

  const handleBookRoom = async () => {
    try {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1);

      await axios.post('/api/student/book-room', {
        roomId: selectedRoom._id,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });

      toast.success('Room booking request submitted!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Error booking room');
    }
  };

  const handlePayment = async (paymentId, paymentData) => {
    try {
      const res = await axios.post(`/api/student/generate-qr/${paymentId}`);
      setQrModal({ imageUrl: res.data.imageUrl, amount: res.data.amount, paymentId, paymentData });
    } catch (error) {
      toast.error('Error generating QR code');
    }
  };

  const handleQrPaid = async () => {
    try {
      await axios.post('/api/student/payment', { paymentId: qrModal.paymentId });
      setQrModal(null);
      setBill({
        receiptNo: qrModal.paymentId.slice(-8).toUpperCase(),
        studentName: profile.name,
        studentId: profile.studentId || 'N/A',
        ...qrModal.paymentData,
        date: new Date().toLocaleDateString()
      });
      setModalType('bill');
      setShowModal(true);
      fetchData();
    } catch (error) {
      toast.error('Error recording payment');
    }
  };

  const handleComplaint = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    try {
      await axios.post('/api/student/complaint', {
        title: formData.get('title'),
        description: formData.get('description'),
        category: formData.get('category')
      });
      toast.success('Complaint submitted!');
      setShowModal(false);
      fetchData();
    } catch (error) {
      toast.error('Error submitting complaint');
    }
  };

  const openModal = (type, room = null) => {
    setModalType(type);
    setSelectedRoom(room);
    setBill(null);
    setShowModal(true);
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Student Dashboard</h1>
        <div>
          <span>Welcome, {profile.name}</span>
          <button className="btn btn-secondary" onClick={onLogout}>Logout</button>
        </div>
      </div>

      <div style={{padding: '0 2.5rem', marginBottom: '2rem'}}>
        {['profile', 'rooms', 'bookings', 'payments', 'complaints'].map(tab => (
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

      {activeTab === 'rooms' && (
        <div className="section">
          <h2>Available Rooms ({rooms.length})</h2>
          {bookings.some(b => ['pending', 'approved'].includes(b.status)) && (
            <p style={{padding: '0.75rem 1rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', color: '#92400e', marginBottom: '1rem'}}>
              ⚠️ You already have an active booking. Only one room per student is allowed.
            </p>
          )}
          <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1rem'}}>
            {rooms.map(room => (
              <div key={room._id} style={{border: '1px solid #ddd', padding: '1rem', borderRadius: '8px'}}>
                <h3>Room {room.roomNumber}</h3>
                <p><strong>Floor:</strong> {room.floor}</p>
                <p><strong>Type:</strong> {room.type}</p>
                <p><strong>Capacity:</strong> {room.capacity}</p>
                <p><strong>Occupancy:</strong> {room.currentOccupancy}/{room.capacity}</p>
                <p><strong>Monthly Rent:</strong> ₹{room.monthlyRent}</p>
                {room.facilities && room.facilities.length > 0 && (
                  <div><strong>Facilities:</strong> {room.facilities.join(', ')}</div>
                )}
                <button
                  className="btn btn-primary"
                  onClick={() => openModal('bookRoom', room)}
                  disabled={room.currentOccupancy >= room.capacity || bookings.some(b => ['pending', 'approved'].includes(b.status))}
                  style={{marginTop: '1rem'}}
                >
                  {room.currentOccupancy >= room.capacity ? 'Full' : bookings.some(b => ['pending','approved'].includes(b.status)) ? 'Already Booked' : 'Book Room'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'bookings' && (
        <div className="section">
          <h2>My Bookings ({bookings.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Room</th>
                <th>Type</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Amount</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map(booking => (
                <tr key={booking._id}>
                  <td>{booking.room?.roomNumber}</td>
                  <td>{booking.room?.type}</td>
                  <td>{new Date(booking.startDate).toLocaleDateString()}</td>
                  <td>{new Date(booking.endDate).toLocaleDateString()}</td>
                  <td>₹{booking.totalAmount}</td>
                  <td>{booking.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'payments' && (
        <div className="section">
          <h2>My Payments ({payments.length})</h2>
          <table className="table">
            <thead>
              <tr>
                <th>Amount</th>
                <th>Type</th>
                <th>Month/Year</th>
                <th>Status</th>
                <th>Date</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map(payment => {
                const booking = bookings.find(b => b._id === (payment.booking?._id || payment.booking));
                return (
                  <tr key={payment._id}>
                    <td>₹{payment.amount}</td>
                    <td>{payment.paymentType}</td>
                    <td>{payment.month} {payment.year}</td>
                    <td>
                      <span style={{padding: '0.2rem 0.6rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '600',
                        background: payment.status === 'completed' ? '#d1fae5' : '#fef3c7',
                        color: payment.status === 'completed' ? '#065f46' : '#92400e'}}>
                        {payment.status}
                      </span>
                    </td>
                    <td>{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td>
                      {payment.status === 'pending' && (
                        <button className="btn btn-primary" style={{padding: '0.25rem 0.75rem', fontSize: '0.8rem'}} onClick={() => handlePayment(payment._id, {
                          roomNumber: booking?.room?.roomNumber || 'N/A',
                          roomType: booking?.room?.type || 'N/A',
                          amount: payment.amount,
                          paymentType: payment.paymentType,
                          month: payment.month,
                          year: payment.year
                        })}>Pay ₹{payment.amount}</button>
                      )}
                      {payment.status === 'completed' && (
                        <button className="btn btn-secondary" style={{padding: '0.25rem 0.75rem', fontSize: '0.8rem'}} onClick={() => {
                          setBill({
                            receiptNo: payment._id.slice(-8).toUpperCase(),
                            studentName: profile.name,
                            studentId: profile.studentId || 'N/A',
                            roomNumber: booking?.room?.roomNumber || 'N/A',
                            roomType: booking?.room?.type || 'N/A',
                            amount: payment.amount,
                            paymentType: payment.paymentType,
                            month: payment.month,
                            year: payment.year,
                            date: new Date(payment.createdAt).toLocaleDateString()
                          });
                          setModalType('bill');
                          setShowModal(true);
                        }}>🧾 Bill</button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'complaints' && (
        <div className="section">
          <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
            <h2>My Complaints ({complaints.length})</h2>
            <button className="btn btn-primary" onClick={() => openModal('complaint')}>Raise Complaint</button>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Status</th>
                <th>Date</th>
                <th>Response</th>
              </tr>
            </thead>
            <tbody>
              {complaints.map(complaint => (
                <tr key={complaint._id}>
                  <td>{complaint.title}</td>
                  <td>{complaint.category}</td>
                  <td>{complaint.status}</td>
                  <td>{new Date(complaint.createdAt).toLocaleDateString()}</td>
                  <td>{complaint.adminResponse || 'No response yet'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'profile' && (
        <div className="section">
          <h2>My Profile</h2>
          <div style={{maxWidth: '800px', margin: '0 auto'}}>
            <div style={{background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', padding: '2rem', borderRadius: '16px 16px 0 0', textAlign: 'center', color: 'white'}}>
              <div style={{width: '100px', height: '100px', borderRadius: '50%', background: 'white', margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem', color: '#4f46e5', fontWeight: '700'}}>
                {profile.name?.charAt(0).toUpperCase()}
              </div>
              <h3 style={{margin: '0 0 0.5rem 0', fontSize: '1.5rem'}}>{profile.name}</h3>
              <p style={{margin: 0, opacity: 0.9}}>{profile.email}</p>
            </div>
            
            <div style={{background: 'white', padding: '2rem', border: '1px solid #e1e5e9', borderTop: 'none'}}>
              <h4 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#4f46e5', borderBottom: '2px solid #4f46e5', paddingBottom: '0.5rem'}}>Personal Information</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem'}}>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Student ID</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.studentId || 'N/A'}</p>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Email</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.email}</p>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Phone</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.phone || 'N/A'}</p>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Course</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.course || 'N/A'}</p>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Year</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.year || 'N/A'}</p>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Guardian Name</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.guardianName || 'N/A'}</p>
                </div>
                <div>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Guardian Phone</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.guardianPhone || 'N/A'}</p>
                </div>
                <div style={{gridColumn: '1 / -1'}}>
                  <label style={{display: 'block', fontSize: '0.875rem', fontWeight: '600', color: '#6b7280', marginBottom: '0.5rem'}}>Address</label>
                  <p style={{margin: 0, fontSize: '1rem', color: '#1a1a1a', padding: '0.5rem', background: '#f9fafb', borderRadius: '6px'}}>{profile.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            <div style={{background: 'white', padding: '2rem', border: '1px solid #e1e5e9', borderTop: 'none'}}>
              <h4 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#4f46e5', borderBottom: '2px solid #4f46e5', paddingBottom: '0.5rem'}}>Current Room Allocation</h4>
              {bookings.filter(b => b.status === 'approved').length > 0 ? (
                <div style={{display: 'grid', gap: '1rem'}}>
                  {bookings.filter(b => b.status === 'approved').map(booking => (
                    <div key={booking._id} style={{padding: '1rem', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '8px'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <p style={{margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '600', color: '#1a1a1a'}}>Room {booking.room?.roomNumber}</p>
                          <p style={{margin: '0 0 0.25rem 0', fontSize: '0.9rem', color: '#6b7280'}}>Type: {booking.room?.type}</p>
                          <p style={{margin: 0, fontSize: '0.9rem', color: '#6b7280'}}>Monthly Rent: ₹{booking.monthlyRent}</p>
                        </div>
                        <div style={{textAlign: 'right'}}>
                          <span style={{display: 'inline-block', padding: '0.5rem 1rem', background: '#10b981', color: 'white', borderRadius: '20px', fontSize: '0.875rem', fontWeight: '600'}}>Active</span>
                          <p style={{margin: '0.5rem 0 0 0', fontSize: '0.875rem', color: '#6b7280'}}>Since: {new Date(booking.startDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{margin: 0, padding: '1rem', background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: '8px', color: '#92400e'}}>No room allocated yet. Please book a room from the Rooms tab.</p>
              )}
            </div>

            <div style={{background: 'white', padding: '2rem', border: '1px solid #e1e5e9', borderTop: 'none'}}>
              <h4 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#4f46e5', borderBottom: '2px solid #4f46e5', paddingBottom: '0.5rem'}}>Account Statistics</h4>
              <div style={{display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem'}}>
                <div style={{padding: '1rem', background: '#eff6ff', borderRadius: '8px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#2563eb'}}>{bookings.length}</p>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Total Bookings</p>
                </div>
                <div style={{padding: '1rem', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#10b981'}}>{bookings.filter(b => b.status === 'approved').length}</p>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Approved</p>
                </div>
                <div style={{padding: '1rem', background: '#fef3c7', borderRadius: '8px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#f59e0b'}}>{bookings.filter(b => b.status === 'pending').length}</p>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Pending</p>
                </div>
                <div style={{padding: '1rem', background: '#fee2e2', borderRadius: '8px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '2rem', fontWeight: '700', color: '#ef4444'}}>{bookings.filter(b => b.status === 'rejected').length}</p>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Rejected</p>
                </div>
              </div>
            </div>

            <div style={{background: 'white', padding: '2rem', border: '1px solid #e1e5e9', borderTop: 'none'}}>
              <h4 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#4f46e5', borderBottom: '2px solid #4f46e5', paddingBottom: '0.5rem'}}>Payment Summary</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <div style={{padding: '1rem', background: '#f9fafb', borderRadius: '8px'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280'}}>Total Payments</p>
                  <p style={{margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a'}}>{payments.length}</p>
                </div>
                <div style={{padding: '1rem', background: '#f9fafb', borderRadius: '8px'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280'}}>Total Amount Paid</p>
                  <p style={{margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#10b981'}}>₹{payments.reduce((sum, p) => sum + (p.amount || 0), 0)}</p>
                </div>
                <div style={{padding: '1rem', background: '#f9fafb', borderRadius: '8px'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '0.875rem', color: '#6b7280'}}>Last Payment</p>
                  <p style={{margin: 0, fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a'}}>{payments.length > 0 ? new Date(payments[payments.length - 1].createdAt).toLocaleDateString() : 'N/A'}</p>
                </div>
              </div>
            </div>

            <div style={{background: 'white', padding: '2rem', border: '1px solid #e1e5e9', borderTop: 'none', borderRadius: '0 0 16px 16px'}}>
              <h4 style={{margin: '0 0 1rem 0', fontSize: '1.1rem', color: '#4f46e5', borderBottom: '2px solid #4f46e5', paddingBottom: '0.5rem'}}>Complaint Status</h4>
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem'}}>
                <div style={{padding: '1rem', background: '#f9fafb', borderRadius: '8px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#1a1a1a'}}>{complaints.length}</p>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Total Complaints</p>
                </div>
                <div style={{padding: '1rem', background: '#fef3c7', borderRadius: '8px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#f59e0b'}}>{complaints.filter(c => c.status === 'open').length}</p>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Open</p>
                </div>
                <div style={{padding: '1rem', background: '#f0fdf4', borderRadius: '8px', textAlign: 'center'}}>
                  <p style={{margin: '0 0 0.5rem 0', fontSize: '1.5rem', fontWeight: '700', color: '#10b981'}}>{complaints.filter(c => c.status === 'resolved').length}</p>
                  <p style={{margin: 0, fontSize: '0.875rem', color: '#6b7280'}}>Resolved</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
          <div style={{backgroundColor: 'white', padding: '2rem', borderRadius: '8px', width: '400px', maxHeight: '80vh', overflow: 'auto'}}>
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem'}}>
              <h3>
                {modalType === 'bookRoom' && 'Book Room'}
                {modalType === 'bill' && '🧾 Payment Receipt'}
                {modalType === 'complaint' && 'Raise Complaint'}
              </h3>
      <button onClick={() => { setShowModal(false); setSelectedRoom(null); setBill(null); }}>×</button>
            </div>

            {modalType === 'bookRoom' && selectedRoom && (
              <div>
                <p><strong>Room:</strong> {selectedRoom.roomNumber}</p>
                <p><strong>Type:</strong> {selectedRoom.type}</p>
                <p><strong>Monthly Rent:</strong> ₹{selectedRoom.monthlyRent}</p>
                <p><strong>Total Amount:</strong> ₹{selectedRoom.monthlyRent * 3}</p>
                <button className="btn btn-primary" onClick={handleBookRoom}>Confirm Booking</button>
              </div>
            )}

            {modalType === 'bill' && bill && (
              <div style={{fontFamily: 'monospace'}}>
                <div style={{textAlign: 'center', borderBottom: '2px dashed #ddd', paddingBottom: '1rem', marginBottom: '1rem'}}>
                  <p style={{margin: 0, fontSize: '1.3rem', fontWeight: '700', color: '#4f46e5'}}>🏠 HostelHub</p>
                  <p style={{margin: '0.25rem 0 0', fontSize: '0.85rem', color: '#6b7280'}}>Payment Receipt</p>
                </div>
                <div style={{display: 'grid', gap: '0.5rem', fontSize: '0.9rem', marginBottom: '1rem'}}>
                  {[['Receipt No', `#${bill.receiptNo}`], ['Date', bill.date], ['Student', bill.studentName], ['Student ID', bill.studentId], ['Room', `${bill.roomNumber} (${bill.roomType})`], ['Payment For', `${bill.paymentType.toUpperCase()} - ${bill.month} ${bill.year}`], ['Amount Paid', `₹${bill.amount}`], ['Status', '✅ PAID']].map(([label, value]) => (
                    <div key={label} style={{display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px dotted #eee'}}>
                      <span style={{color: '#6b7280'}}>{label}</span>
                      <span style={{fontWeight: '600', color: label === 'Amount Paid' ? '#10b981' : label === 'Status' ? '#10b981' : '#1a1a1a'}}>{value}</span>
                    </div>
                  ))}
                </div>
                <div style={{textAlign: 'center', borderTop: '2px dashed #ddd', paddingTop: '1rem'}}>
                  <p style={{margin: 0, fontSize: '0.8rem', color: '#6b7280'}}>Thank you for your payment!</p>
                </div>
                <button className="btn btn-primary" style={{width: '100%', marginTop: '1rem'}} onClick={() => { setShowModal(false); setBill(null); }}>Close</button>
              </div>
            )}

            {modalType === 'complaint' && (
              <form onSubmit={handleComplaint}>
                <div className="form-group">
                  <label>Title</label>
                  <input type="text" name="title" required />
                </div>
                <div className="form-group">
                  <label>Description</label>
                  <textarea name="description" rows="4" required />
                </div>
                <div className="form-group">
                  <label>Category</label>
                  <select name="category">
                    <option value="maintenance">Maintenance</option>
                    <option value="cleanliness">Cleanliness</option>
                    <option value="security">Security</option>
                    <option value="food">Food</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <button type="submit" className="btn btn-primary">Submit Complaint</button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

      {qrModal && (
        <div style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000}}>
          <div style={{backgroundColor: 'white', padding: '2rem', borderRadius: '12px', width: '340px', textAlign: 'center'}}>
            <h3 style={{margin: '0 0 0.5rem 0', color: '#4f46e5'}}>Scan to Pay</h3>
            <p style={{margin: '0 0 1rem 0', fontSize: '0.85rem', color: '#6b7280'}}>Use any UPI app to scan and pay. Bill generates automatically.</p>
            <div style={{display: 'inline-block', padding: '1rem', background: 'white', borderRadius: '12px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', marginBottom: '1rem'}}>
              <img src={qrModal.imageUrl} alt="UPI QR" style={{width: '200px', height: '200px'}} />
            </div>
            <div style={{padding: '0.75rem', background: '#eff6ff', borderRadius: '8px', marginBottom: '1rem'}}>
              <p style={{margin: 0, fontSize: '1.25rem', fontWeight: '700', color: '#10b981'}}>₹{qrModal.amount}</p>
              <p style={{margin: '0.25rem 0 0', fontSize: '0.8rem', color: '#6b7280'}}>⏳ Waiting for payment... QR expires in 10 min</p>
            </div>
            <button className="btn btn-primary" style={{width: '100%', marginBottom: '0.5rem'}} onClick={handleQrPaid}>✅ I've Paid – Generate Bill</button>
            <button className="btn btn-secondary" style={{width: '100%'}} onClick={() => setQrModal(null)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentDashboard;
    </div>
  );
};

export default StudentDashboard;