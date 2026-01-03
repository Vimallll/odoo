import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { isProfileComplete } from '../utils/profileCompletion';
import './Auth.css';

const SignIn = () => {
  const location = useLocation();
  const [formData, setFormData] = useState({
    email: location.state?.email || '',
    password: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(location.state?.message || '');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useContext(AuthContext);

  // Clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => {
        setSuccess('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      console.log('🔐 Attempting to sign in...', formData.email);
      const response = await api.post('/auth/signin', formData);
      console.log('✅ Signin successful:', response.data);
      
      await login(response.data.token, response.data.user);
      
      // Fetch full user profile to check completion
      try {
        const fullUserResponse = await api.get('/auth/me');
        const fullUser = fullUserResponse.data;
        
        // Check profile completion and redirect accordingly
        if (response.data.user.role === 'Employee') {
          if (!isProfileComplete(fullUser)) {
            navigate('/profile', { state: { message: 'Please complete your profile to continue', requireCompletion: true } });
          } else {
            navigate('/dashboard');
          }
        } else {
          navigate('/admin/dashboard');
        }
      } catch (error) {
        // If error fetching profile, still allow navigation
        if (response.data.user.role === 'Employee') {
          navigate('/dashboard');
        } else {
          navigate('/admin/dashboard');
        }
      }
    } catch (err) {
      console.error('❌ Signin error:', err);
      console.error('Error response:', err.response?.data);
      const errorMessage = err.response?.data?.error || err.message || 'Invalid credentials. Please check your email and password.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1>Dayflow</h1>
          <p>Every workday, perfectly aligned.</p>
          <h2>Sign In</h2>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Signing In...' : 'Sign In'}
          </button>
        </form>

        <p className="auth-footer">
          Don't have an account? <Link to="/signup">Sign Up</Link>
        </p>
      </div>
    </div>
  );
};

export default SignIn;

