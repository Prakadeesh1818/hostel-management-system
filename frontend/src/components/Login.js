import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Login = ({ onLogin }) => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    const savedEmail = localStorage.getItem('rememberUser');
    if (savedEmail) {
      setFormData(prev => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email is invalid';
    if (!formData.password) newErrors.password = 'Password is required';
    else if (formData.password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    
    setLoading(true);
    setErrors({});
    
    try {
      console.log('Attempting login with:', formData);
      const res = await axios.post('/api/auth/login', formData);
      console.log('Login response:', res.data);
      
      if (rememberMe) {
        localStorage.setItem('rememberUser', formData.email);
      } else {
        localStorage.removeItem('rememberUser');
      }
      onLogin(res.data.user, res.data.token);
      toast.success(`Welcome back, ${res.data.user.name}! 🎉`);
    } catch (error) {
      console.error('Login error:', error.response?.data || error.message);
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      toast.error(message);
      setErrors({ general: message });
    }
    setLoading(false);
  };

  return (
    <div className="professional-login">
      <div className="login-background">
        <div className="geometric-shapes">
          <div className="shape hexagon"></div>
          <div className="shape triangle"></div>
          <div className="shape circle"></div>
          <div className="shape square"></div>
        </div>
      </div>
      
      <div className="login-container">
        <div className="login-sidebar">
          <div className="brand-section">
            <div className="brand-logo">
              <div className="logo-symbol">🏠</div>
              <h1>HostelHub</h1>
            </div>
            <p className="brand-tagline">Professional Hostel Management System</p>
          </div>
          
          <div className="features-list">
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>30+ Premium Rooms</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Secure Payment System</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>24/7 Support</span>
            </div>
            <div className="feature">
              <span className="feature-icon">✓</span>
              <span>Modern Facilities</span>
            </div>
          </div>
        </div>

        <div className="login-form-section">
          <div className="form-container">
            <div className="form-header">
              <h2>Welcome Back</h2>
              <p>Sign in to your account to continue</p>
            </div>

            {errors.general && (
              <div className="error-banner">
                <span className="error-icon">⚠️</span>
                {errors.general}
              </div>
            )}

            <form onSubmit={handleSubmit} className="login-form">
              <div className="input-group">
                <label>Email Address</label>
                <div className="input-container">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="Enter your email address"
                    className={errors.email ? 'error' : ''}
                  />
                  <span className="input-icon">📧</span>
                </div>
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>

              <div className="input-group">
                <label>Password</label>
                <div className="input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                    placeholder="Enter your password"
                    className={errors.password ? 'error' : ''}
                  />
                  <span className="input-icon">🔒</span>
                  <button
                    type="button"
                    className="password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? '👁️' : '👁️🗨️'}
                  </button>
                </div>
                {errors.password && <span className="error-text">{errors.password}</span>}
              </div>

              <div className="form-options">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span className="checkbox-custom"></span>
                  Remember me
                </label>
                <Link to="#" className="forgot-link">Forgot Password?</Link>
              </div>

              <button type="submit" className="signin-btn" disabled={loading}>
                {loading ? (
                  <>
                    <div className="loading-spinner"></div>
                    Signing In...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="signup-section">
              <p>Don't have an account? <Link to="/register">Create Account</Link></p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;