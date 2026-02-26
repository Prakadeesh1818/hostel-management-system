import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';

const Chatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { text: 'Hello! I\'m your HostelHub AI Assistant. I can provide real-time information about room availability, pricing, and more. What would you like to know?', sender: 'bot' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get('/api/chatbot/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getBotResponse = (userMessage) => {
    const msg = userMessage.toLowerCase().trim();
    
    if (/^(hi|hello|hey|hii|helo|namaste|good morning|good afternoon|good evening)$/i.test(msg)) {
      return 'Hello! 👋 Welcome to HostelHub! I\'m here to assist you with real-time information.\n\nI can help you with:\n• Room availability & booking\n• Student information & analytics\n• Live statistics & reports\n• Pricing & payments\n• Facilities & amenities\n• Complaints & support\n\nWhat would you like to know?';
    }

    if (/thank|thanks|thanku|thank you|thx/i.test(msg)) {
      return 'You\'re welcome! 😊 Feel free to ask if you need anything else. I\'m here to help!';
    }

    if (/bye|goodbye|see you|exit|close/i.test(msg)) {
      return 'Goodbye! 👋 Have a great day! Feel free to come back anytime you need assistance. Take care!';
    }

    if (!stats) {
      return '⏳ Loading real-time data... Please wait a moment.';
    }

    // Student names and list
    if (/student name|list of student|all student|who are the student|show student/i.test(msg)) {
      if (stats.students && stats.students.length > 0) {
        const studentList = stats.students.slice(0, 10).map((s, i) => 
          `${i + 1}. ${s.name} (${s.studentId}) - ${s.course}, Year ${s.year}`
        ).join('\n');
        return `👥 Registered Students (Showing ${Math.min(10, stats.students.length)} of ${stats.totalStudents}):\n\n${studentList}\n\n📊 Total Students: ${stats.totalStudents}\n\nFor complete list, check the admin dashboard!`;
      }
      return `👥 Total Students: ${stats.totalStudents}\n\nStudent details are available in the admin dashboard.`;
    }

    // Student room mapping
    if (/which room|room number|student room|who is in room|room allocation|room assignment/i.test(msg)) {
      if (stats.studentRoomMapping && stats.studentRoomMapping.length > 0) {
        const roomMapping = stats.studentRoomMapping.map((m, i) => 
          `${i + 1}. ${m.student?.name || 'N/A'} (${m.student?.studentId || 'N/A'}) → Room ${m.room?.roomNumber || 'N/A'} (Floor ${m.room?.floor || 'N/A'})`
        ).join('\n');
        return `🏠 Student-Room Allocation:\n\n${roomMapping}\n\n📊 Total Allocated: ${stats.studentRoomMapping.length} students\n\nAll approved bookings shown above!`;
      }
      return '🏠 No room allocations yet. Students need to book rooms and get admin approval.';
    }

    // Course-wise analysis
    if (/course|courses|program|branch|department/i.test(msg)) {
      if (stats.studentsByCourse && stats.studentsByCourse.length > 0) {
        const courseInfo = stats.studentsByCourse.map(c => 
          `• ${c._id || 'Not Specified'}: ${c.count} students`
        ).join('\n');
        return `📚 Students by Course:\n\n${courseInfo}\n\n📊 Total: ${stats.totalStudents} students across ${stats.studentsByCourse.length} courses`;
      }
      return 'Course-wise data is being updated. Please check back shortly.';
    }

    // Year-wise analysis
    if (/year|batch|semester/i.test(msg)) {
      if (stats.studentsByYear && stats.studentsByYear.length > 0) {
        const yearInfo = stats.studentsByYear.map(y => 
          `• Year ${y._id}: ${y.count} students`
        ).join('\n');
        return `🎓 Students by Academic Year:\n\n${yearInfo}\n\n📊 Total: ${stats.totalStudents} students`;
      }
      return 'Year-wise data is being updated. Please check back shortly.';
    }

    // Recent bookings
    if (/recent booking|latest booking|new booking|who booked/i.test(msg)) {
      if (stats.recentBookings && stats.recentBookings.length > 0) {
        const bookingList = stats.recentBookings.slice(0, 5).map((b, i) => 
          `${i + 1}. ${b.student?.name || 'N/A'} - Room ${b.room?.roomNumber || 'N/A'} (${b.status})`
        ).join('\n');
        return `📋 Recent Bookings:\n\n${bookingList}\n\n✅ Approved: ${stats.approvedBookings}\n⏳ Pending: ${stats.pendingBookings}\n\nTotal bookings tracked in real-time!`;
      }
      return `📋 Booking Status:\n\n✅ Approved: ${stats.approvedBookings}\n⏳ Pending: ${stats.pendingBookings}`;
    }

    // Recent complaints
    if (/recent complaint|latest complaint|new complaint|who complained/i.test(msg)) {
      if (stats.recentComplaints && stats.recentComplaints.length > 0) {
        const complaintList = stats.recentComplaints.slice(0, 5).map((c, i) => 
          `${i + 1}. ${c.student?.name || 'N/A'} - ${c.title} (${c.status})`
        ).join('\n');
        return `🛠️ Recent Complaints:\n\n${complaintList}\n\n📊 Active: ${stats.activeComplaints}\n✅ Resolved: ${stats.resolvedComplaints}\n\nAll complaints tracked in real-time!`;
      }
      return `🛠️ Complaint Status:\n\n📊 Active: ${stats.activeComplaints}\n✅ Resolved: ${stats.resolvedComplaints}`;
    }

    // Payment analysis
    if (/payment|paid|transaction|revenue/i.test(msg)) {
      return `💳 Payment Analytics:\n\n📊 Total Payments: ${stats.totalPayments || 0}\n⏳ Pending: ${stats.pendingPayments || 0}\n✅ Completed: ${(stats.totalPayments || 0) - (stats.pendingPayments || 0)}\n\n💰 All transactions are tracked securely!\n\nFor detailed payment reports, check the admin dashboard.`;
    }

    // Database analysis
    if (/analysis|analyze|report|summary|overview/i.test(msg)) {
      const occupancyRate = ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1);
      const avgPricePerType = stats.roomsByType.map(t => 
        `• ${t._id}: ₹${Math.round(t.avgPrice || 0)}/month`
      ).join('\n');
      
      return `📊 Complete Database Analysis:\n\n🏠 ROOMS:\n• Total: ${stats.totalRooms}\n• Available: ${stats.availableRooms}\n• Occupancy: ${occupancyRate}%\n\n👥 STUDENTS:\n• Total: ${stats.totalStudents}\n• Courses: ${stats.studentsByCourse?.length || 0}\n\n📋 BOOKINGS:\n• Approved: ${stats.approvedBookings}\n• Pending: ${stats.pendingBookings}\n\n🛠️ COMPLAINTS:\n• Active: ${stats.activeComplaints}\n• Resolved: ${stats.resolvedComplaints}\n\n💰 AVG PRICING:\n${avgPricePerType}\n\n📈 All data updated in real-time!`;
    }

    if (/available|availability|vacant|empty|free room/i.test(msg)) {
      const roomTypeInfo = stats.roomsByType.map(type => 
        `• ${type._id.charAt(0).toUpperCase() + type._id.slice(1)}: ${type.available}/${type.count} available (₹${type.minPrice}-${type.maxPrice}/month)`
      ).join('\n');
      
      const floorInfo = stats.roomsByFloor.map(floor => 
        `• Floor ${floor._id}: ${floor.available}/${floor.count} available`
      ).join('\n');

      return `🏠 Real-Time Room Availability:\n\n📊 Total Available: ${stats.availableRooms}/${stats.totalRooms} rooms\n\n🛏️ By Room Type:\n${roomTypeInfo}\n\n🏢 By Floor:\n${floorInfo}\n\n✅ You can book rooms instantly from your student dashboard!`;
    }

    if (/stat|statistics|data|number|count|how many/i.test(msg)) {
      return `📊 Live HostelHub Statistics:\n\n🏠 Total Rooms: ${stats.totalRooms}\n✅ Available: ${stats.availableRooms}\n🔒 Occupied: ${stats.occupiedRooms}\n\n👥 Total Students: ${stats.totalStudents}\n⏳ Pending Bookings: ${stats.pendingBookings}\n🛠️ Active Complaints: ${stats.activeComplaints}\n\n📈 Updated in real-time!`;
    }

    if (/room type|types of room|single|double|triple/i.test(msg)) {
      const roomInfo = stats.roomsByType.map(type => {
        const typeName = type._id.charAt(0).toUpperCase() + type._id.slice(1);
        const capacity = type._id === 'single' ? '1 person' : type._id === 'double' ? '2 persons' : '3 persons';
        return `\n🛏️ ${typeName} Rooms:\n• Total: ${type.count} rooms\n• Available: ${type.available} rooms\n• Capacity: ${capacity}\n• Price: ₹${type.minPrice}-${type.maxPrice}/month`;
      }).join('\n');

      return `🏠 Room Types Available:\n${roomInfo}\n\n✨ All rooms include WiFi, study table, and wardrobe!`;
    }

    if (/price|prices|cost|rent|expensive|cheap|affordable|rate|rates/i.test(msg)) {
      const pricingInfo = stats.roomsByType.map(type => {
        const typeName = type._id.charAt(0).toUpperCase() + type._id.slice(1);
        return `• ${typeName}: ₹${type.minPrice}-${type.maxPrice}/month (${type.available} available)`;
      }).join('\n');

      return `💰 Current Room Pricing:\n\n${pricingInfo}\n\n✅ Includes: WiFi, Electricity, Water\n💵 Initial Deposit: 3 months rent\n📅 Payment: Monthly in advance\n\n📊 Prices vary by floor and facilities!`;
    }

    if (/book|booking|reserve|reservation/i.test(msg)) {
      return `📋 Booking Information:\n\n✅ Available Rooms: ${stats.availableRooms}\n⏳ Pending Bookings: ${stats.pendingBookings}\n\n📝 How to Book:\n1. Login to your student dashboard\n2. Browse available rooms\n3. Select your preferred room\n4. Submit booking request\n5. Admin approval within 24 hours\n\n💳 Payment after approval!`;
    }

    if (/student|students|occupancy|occupied|tenant/i.test(msg)) {
      const occupancyRate = ((stats.occupiedRooms / stats.totalRooms) * 100).toFixed(1);
      return `👥 Student & Occupancy Info:\n\n🎓 Total Students: ${stats.totalStudents}\n🏠 Total Rooms: ${stats.totalRooms}\n🔒 Occupied Rooms: ${stats.occupiedRooms}\n✅ Available Rooms: ${stats.availableRooms}\n📊 Occupancy Rate: ${occupancyRate}%\n\n🚀 Join our growing community!`;
    }

    if (/complaint|complain|issue|problem|trouble|report|maintenance|repair|fix/i.test(msg)) {
      return `🛠️ Complaint Management:\n\n📊 Active Complaints: ${stats.activeComplaints}\n\n📝 How to Raise Complaint:\n1. Go to "Complaints" section\n2. Select category\n3. Describe your issue\n4. Submit\n\n⏱️ Response Time: Within 24 hours\n✅ Track status in real-time\n\nFor urgent issues: +91-1234567890`;
    }

    if (/facility|facilities|amenities|amenity|service|services|feature|features/i.test(msg)) {
      return '✨ Our Premium Facilities:\n\n🌐 High-Speed WiFi (24/7)\n❄️ AC/Fan Options\n📚 Study Tables & Chairs\n👔 Spacious Wardrobes\n🛿 Attached/Common Bathrooms\n🔒 24/7 Security & CCTV\n🧺 Laundry Service\n🍽️ Common Kitchen\n🚗 Parking Space\n🏋️ Gym & Recreation Area\n📺 Common TV Room\n🌳 Garden Area';
    }

    if (/payment|pay|money|transaction|deposit|fee|charge|billing/i.test(msg)) {
      return '💳 Payment Information:\n\n• Secure online payment gateway\n• Accept all major cards & UPI\n• Initial deposit: 3 months rent\n• Monthly rent payment\n• Payment history tracking\n• Instant payment confirmation\n\nAll transactions are encrypted and secure. You can make payments through your student dashboard.';
    }

    if (/contact|support|help|call|email|phone|reach|connect/i.test(msg)) {
      return '📞 Contact & Support:\n\n📧 Email: support@hostelhub.com\n📱 Phone: +91-1234567890\n⏰ Available: 24/7\n\n🏢 Office Hours:\nMon-Sat: 9:00 AM - 6:00 PM\nSunday: 10:00 AM - 4:00 PM\n\n📍 Address:\nHostelHub, University Road\nCity, State - 123456\n\n💬 You can also raise complaints through your dashboard for faster resolution!';
    }

    if (/register|registration|signup|sign up|account|join|enroll/i.test(msg)) {
      return '📝 Registration Process:\n\n1. Click "Create Account" on login page\n2. Fill personal information (Step 1):\n   • Full Name\n   • Student ID\n   • Email\n   • Password\n\n3. Fill additional details (Step 2):\n   • Phone Number\n   • Course & Year\n   • Guardian Information\n   • Address\n\n4. Submit and login!\n\n⏱️ Takes less than 2 minutes\n✅ Instant account activation\n🔒 Your data is secure';
    }

    return `🤔 I'm not sure about that. Let me help you with:\n\n💡 Popular Topics:\n• "Student names" - View registered students\n• "Course analysis" - Students by course\n• "Recent bookings" - Latest booking activity\n• "Database analysis" - Complete overview\n• "Room availability" - ${stats.availableRooms} available now!\n• "Statistics" - Live stats\n• "Pricing" - Room rates\n\nJust type any topic you're interested in!`;
  };

  const handleClearChat = () => {
    setMessages([
      { text: 'Hello! I\'m your HostelHub AI Assistant. I can provide real-time information about room availability, pricing, and more. What would you like to know?', sender: 'bot' }
    ]);
    fetchStats();
  };

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage = { text: input, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    setTimeout(() => {
      const botResponse = { text: getBotResponse(input), sender: 'bot' };
      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
      fetchStats();
    }, 800);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickQuestions = [
    '👥 Student names',
    '🏠 Room allocation',
    '📋 Recent bookings',
    '🛠️ Recent complaints',
    '💳 Payment analysis',
    '📊 Database analysis'
  ];

  const handleQuickQuestion = (question) => {
    const cleanQuestion = question.replace(/[🏠📊💰📞]/g, '').trim();
    setInput(cleanQuestion);
    setTimeout(() => {
      const userMessage = { text: cleanQuestion, sender: 'user' };
      setMessages(prev => [...prev, userMessage]);
      setIsTyping(true);
      setTimeout(() => {
        const botResponse = { text: getBotResponse(cleanQuestion), sender: 'bot' };
        setMessages(prev => [...prev, botResponse]);
        setIsTyping(false);
        fetchStats();
      }, 800);
    }, 100);
  };

  return (
    <>
      <div className={`chatbot-container ${isOpen ? 'open' : ''}`}>
        <div className="chatbot-header">
          <div className="chatbot-title">
            <span className="chatbot-icon">🤖</span>
            <div>
              <h4>HostelHub AI Assistant</h4>
              <span className="chatbot-status">● Online</span>
            </div>
          </div>
          <div className="chatbot-actions">
            <button className="clear-btn" onClick={handleClearChat} title="Clear Chat">🗑️</button>
            <button className="chatbot-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
        </div>

        <div className="chatbot-messages">
          {messages.map((msg, index) => (
            <div key={index} className={`message ${msg.sender}`}>
              <div className="message-bubble">{msg.text}</div>
            </div>
          ))}
          {isTyping && (
            <div className="message bot">
              <div className="message-bubble typing">
                <span></span><span></span><span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length > 1 && (
          <div className="quick-questions">
            <p className="quick-title">Quick Questions:</p>
            {quickQuestions.map((q, i) => (
              <button key={i} onClick={() => handleQuickQuestion(q)} className="quick-btn">
                {q}
              </button>
            ))}
          </div>
        )}

        <div className="chatbot-input">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask me anything..."
          />
          <button onClick={handleSend} disabled={!input.trim()}>
            <span>➤</span>
          </button>
        </div>
      </div>

      <button className="chatbot-toggle" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? '✕' : '💬'}
        {!isOpen && <span className="chat-badge">AI</span>}
      </button>
    </>
  );
};

export default Chatbot;