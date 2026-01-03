import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import './Auth.css';

const VerifyEmailOTP = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = React.useContext(AuthContext);
  
  const userId = location.state?.userId;
  const email = location.state?.email;
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (!userId || !email) {
      navigate('/signup');
    }
  }, [userId, email, navigate]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleOtpChange = (index, value) => {
    if (value.length > 1) return; // Only allow single digit
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError('');

    // Auto-focus next input
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newOtp = pastedData.split('');
      setOtp(newOtp);
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/verify-email-otp', {
        userId,
        otp: otpString
      });

      // Auto-login after verification
      await login(response.data.token, response.data.user);
      
      // Redirect based on role
      if (response.data.user.role === 'Employee') {
        navigate('/profile', { state: { message: 'Email verified successfully! Please complete your profile.' } });
      } else {
        navigate('/admin/dashboard', { state: { message: 'Email verified successfully!' } });
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.error || 'Invalid OTP. Please try again.');
      setOtp(['', '', '', '', '', '']);
      document.getElementById('otp-0')?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setError('');
    
    try {
      await api.post('/auth/resend-verification-otp', { userId });
      setCountdown(60); // 60 second countdown
      setError('');
    } catch (err) {
      setError(err.response?.data?.error || 'Error resending OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  if (!userId || !email) {
    return null;
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">
            <div className="auth-logo-icon">🌊</div>
            <h1>Emporia</h1>
          </div>
          <p className="tagline">Every workday, perfectly aligned.</p>
          <h2>Verify Your Email</h2>
        </div>

        <p style={{ textAlign: 'center', color: '#666', marginBottom: '20px' }}>
          We've sent a 6-digit OTP to <strong>{email}</strong>
        </p>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className="otp-container">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={index === 0 ? handlePaste : undefined}
                className="otp-input"
                autoFocus={index === 0}
                required
              />
            ))}
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>
        </form>

        <div className="otp-actions">
          <p style={{ textAlign: 'center', color: '#666', margin: '20px 0' }}>
            Didn't receive the OTP?
          </p>
          <button
            type="button"
            onClick={handleResendOTP}
            disabled={resendLoading || countdown > 0}
            className="btn-resend"
          >
            {resendLoading 
              ? 'Sending...' 
              : countdown > 0 
                ? `Resend OTP (${countdown}s)` 
                : 'Resend OTP'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailOTP;

