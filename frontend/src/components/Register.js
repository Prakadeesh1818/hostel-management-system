import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Register = ({ onLogin }) => {
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', studentId: '', phone: '', course: '', year: '', address: '', guardianName: '', guardianPhone: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [step, setStep] = useState(1);

  const validateStep = (currentStep) => {
    const newErrors = {};
    
    if (currentStep === 1) {
      if (!formData.name) newErrors.name = 'Name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
      if (!formData.password) newErrors.password = 'Password is required';
      else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
      if (!formData.studentId) newErrors.studentId = 'Student ID is required';
    } else if (currentStep === 2) {
      if (!formData.phone) newErrors.phone = 'Phone is required';
      if (!formData.course) newErrors.course = 'Course is required';
      if (!formData.year) newErrors.year = 'Year is required';
      if (!formData.address) newErrors.address = 'Address is required';
      if (!formData.guardianName) newErrors.guardianName = 'Guardian name is required';
      if (!formData.guardianPhone) newErrors.guardianPhone = 'Guardian phone is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(1)) {
      setStep(2);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateStep(2)) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      const res = await axios.post('/api/auth/register', formData);
      onLogin(res.data.user, res.data.token);
      toast.success('Registration successful! Welcome to HostelHub! 🎉');
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      toast.error(message);
      setErrors({ general: message });
    }
    setLoading(false);
  };

  return (
    <div className="professional-register">
      <div className="register-background">
        <div className="geometric-shapes">
          <div className="shape hexagon"></div>
          <div className="shape triangle"></div>
          <div className="shape circle"></div>
          <div className="shape square"></div>
        </div>
      </div>
      
      <div className="register-container">
        <div className="register-sidebar">
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-symbol">🏠</div>
              <h1>HostelHub</h1>
            </div>
            <p className="brand-tagline">Join Our Premium Community</p>
            <div className="stats-preview">
              <div className="stat">
                <span className="stat-number">30+</span>
                <span className="stat-label">Premium Rooms</span>
              </div>
              <div className="stat">
                <span className="stat-number">500+</span>
                <span className="stat-label">Happy Students</span>
              </div>
              <div className="stat">
                <span className="stat-number">24/7</span>
                <span className="stat-label">Support</span>
              </div>
            </div>
          </div>
          
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Modern Furnished Rooms</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>High-Speed WiFi</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Secure Payment Gateway</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>24/7 Security & Support</span>
            </div>
          </div>
        </div>

        <div className="register-form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Create Your Account</h2>
              <p>Join thousands of students who call HostelHub home</p>
              
              <div className="progress-indicator">
                <div className={`step ${step >= 1 ? 'active' : ''}`}>
                  <span className="step-number">1</span>
                  <span className="step-label">Personal Info</span>
                </div>
                <div className="progress-line"></div>
                <div className={`step ${step >= 2 ? 'active' : ''}`}>
                  <span className="step-number">2</span>
                  <span className="step-label">Additional Details</span>
                </div>
              </div>
            </div>

            {errors.general && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}

            <form onSubmit={step === 1 ? (e) => { e.preventDefault(); handleNext(); } : handleSubmit} className="register-form">
              {step === 1 && (
                <div className="form-step">
                  <h3 className="step-title">Personal Information</h3>
                  
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Full Name *</label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className={errors.name ? 'error' : ''}
                      />
                      {errors.name && <span className="error-text">{errors.name}</span>}
                    </div>

                    <div className="input-group">
                      <label>Student ID *</label>
                      <input
                        type="text"
                        value={formData.studentId}
                        onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                        className={errors.studentId ? 'error' : ''}
                      />
                      {errors.studentId && <span className="error-text">{errors.studentId}</span>}
                    </div>

                    <div className="input-group full-width">
                      <label>Email Address *</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className={errors.email ? 'error' : ''}
                      />
                      {errors.email && <span className="error-text">{errors.email}</span>}
                    </div>

                    <div className="input-group full-width">
                      <label>Password *</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({...formData, password: e.target.value})}
                        className={errors.password ? 'error' : ''}
                      />
                      {errors.password && <span className="error-text">{errors.password}</span>}
                    </div>
                  </div>

                  <button type="submit" className="next-btn">
                    Continue to Next Step →
                  </button>
                </div>
              )}

              {step === 2 && (
                <div className="form-step">
                  <div className="step-header">
                    <button type="button" className="back-btn" onClick={() => setStep(1)}>
                      ← Back
                    </button>
                    <h3 className="step-title">Additional Details</h3>
                  </div>
                  
                  <div className="form-grid">
                    <div className="input-group">
                      <label>Phone Number *</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        className={errors.phone ? 'error' : ''}
                      />
                      {errors.phone && <span className="error-text">{errors.phone}</span>}
                    </div>

                    <div className="input-group">
                      <label>Course *</label>
                      <input
                        type="text"
                        value={formData.course}
                        onChange={(e) => setFormData({...formData, course: e.target.value})}
                        className={errors.course ? 'error' : ''}
                      />
                      {errors.course && <span className="error-text">{errors.course}</span>}
                    </div>

                    <div className="input-group">
                      <label>Academic Year *</label>
                      <select
                        value={formData.year}
                        onChange={(e) => setFormData({...formData, year: e.target.value})}
                        className={errors.year ? 'error' : ''}
                      >
                        <option value="">Select Year</option>
                        <option value="1">1st Year</option>
                        <option value="2">2nd Year</option>
                        <option value="3">3rd Year</option>
                        <option value="4">4th Year</option>
                      </select>
                      {errors.year && <span className="error-text">{errors.year}</span>}
                    </div>

                    <div className="input-group">
                      <label>Guardian Name *</label>
                      <input
                        type="text"
                        value={formData.guardianName}
                        onChange={(e) => setFormData({...formData, guardianName: e.target.value})}
                        className={errors.guardianName ? 'error' : ''}
                      />
                      {errors.guardianName && <span className="error-text">{errors.guardianName}</span>}
                    </div>

                    <div className="input-group">
                      <label>Guardian Phone *</label>
                      <input
                        type="tel"
                        value={formData.guardianPhone}
                        onChange={(e) => setFormData({...formData, guardianPhone: e.target.value})}
                        className={errors.guardianPhone ? 'error' : ''}
                      />
                      {errors.guardianPhone && <span className="error-text">{errors.guardianPhone}</span>}
                    </div>

                    <div className="input-group full-width">
                      <label>Address *</label>
                      <textarea
                        value={formData.address}
                        onChange={(e) => setFormData({...formData, address: e.target.value})}
                        rows="3"
                        className={errors.address ? 'error' : ''}
                      />
                      {errors.address && <span className="error-text">{errors.address}</span>}
                    </div>
                  </div>

                  <button type="submit" className="register-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="loading-spinner"></div>
                        Creating Account...
                      </>
                    ) : (
                      'Create Account'
                    )}
                  </button>
                </div>
              )}
            </form>

            <div className="signin-section">
              <p>Already have an account? <Link to="/login">Sign In</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;