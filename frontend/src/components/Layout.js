import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeConfirmed, setOvertimeConfirmed] = useState(false);
  const dropdownRef = useRef(null);
  const intervalRef = useRef(null);
  const autoCheckoutRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'Employee') {
      fetchCurrentStatus();
      
      // Set up interval to update current hours every 30 seconds
      intervalRef.current = setInterval(() => {
        fetchCurrentStatus();
      }, 30000);

      // Set up auto-checkout at 6 PM
      setupAutoCheckout();
    }

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (autoCheckoutRef.current) {
        clearTimeout(autoCheckoutRef.current);
      }
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [user]);

  const setupAutoCheckout = () => {
    const now = new Date();
    const sixPM = new Date();
    sixPM.setHours(18, 0, 0, 0); // 6 PM

    // If already past 6 PM, check immediately
    if (now >= sixPM) {
      checkAutoCheckout();
    } else {
      // Otherwise, schedule for 6 PM
      const msUntil6PM = sixPM - now;
      autoCheckoutRef.current = setTimeout(() => {
        checkAutoCheckout();
      }, msUntil6PM);
    }
  };

  const checkAutoCheckout = async () => {
    try {
      await fetchCurrentStatus();
    } catch (error) {
      console.error('Error checking auto-checkout:', error);
    }
  };

  const fetchCurrentStatus = async () => {
    if (user?.role === 'Employee') {
      try {
        const response = await api.get('/attendance/status');
        setCurrentStatus(response.data);
      } catch (error) {
        console.error('Error fetching current status:', error);
        setCurrentStatus(null);
      }
    }
  };

  // Check for auto-checkout when status changes
  useEffect(() => {
    if (currentStatus?.checkedIn && !currentStatus?.checkedOut && !overtimeConfirmed) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's exactly 6 PM or later (only show once)
      if (currentHour >= 18 && !showOvertimeModal) {
        // Only show if it's been at least 1 minute since check-in
        if (currentStatus.checkInTime) {
          const checkInTime = new Date(currentStatus.checkInTime);
          const timeDiff = now - checkInTime;
          const minutesSinceCheckIn = timeDiff / (1000 * 60);
          
          if (minutesSinceCheckIn >= 1) {
            setShowOvertimeModal(true);
          }
        }
      }
    }
  }, [currentStatus, overtimeConfirmed, showOvertimeModal]);

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/checkin');
      await fetchCurrentStatus();
      setupAutoCheckout(); // Reset auto-checkout timer
    } catch (error) {
      alert(error.response?.data?.error || 'Error checking in');
    }
  };

  const handleCheckOut = async (isOvertime = false) => {
    try {
      await api.post('/attendance/checkout', { overtime: isOvertime });
      setShowOvertimeModal(false);
      setOvertimeConfirmed(false);
      await fetchCurrentStatus();
    } catch (error) {
      alert(error.response?.data?.error || 'Error checking out');
    }
  };

  const handleOvertimeContinue = () => {
    setOvertimeConfirmed(true);
    setShowOvertimeModal(false);
    // Don't checkout, let them continue working
  };

  const handleOvertimeCheckout = () => {
    handleCheckOut(true);
  };

  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '0h 0m';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${h}h ${m}m`;
  };

  const getCurrentWorkingHours = () => {
    if (currentStatus?.checkedOut) {
      return currentStatus.workingHours || 0;
    }
    if (currentStatus?.checkedIn && currentStatus.currentHours !== undefined) {
      return currentStatus.currentHours;
    }
    return 0;
  };

  const handleLogout = () => {
    logout();
    navigate('/signin');
  };

  const isAdmin = user?.role === 'HR' || user?.role === 'Admin';

  return (
    <div className="layout">
      <nav className="navbar">
        <div className="nav-brand">
          <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'}>
            <h2>Dayflow</h2>
          </Link>
        </div>
        <div className="nav-links">
          {isAdmin ? (
            <>
              <Link to="/admin/dashboard">Dashboard</Link>
              <Link to="/admin/employees">Employees</Link>
              <Link to="/admin/attendance">Attendance</Link>
              <Link to="/admin/leaves">Leave Requests</Link>
              <Link to="/admin/payroll">Payroll</Link>
              <Link to="/admin/reports">Reports</Link>
            </>
          ) : (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <Link to="/profile">Profile</Link>
              <Link to="/attendance">Attendance</Link>
              <Link to="/leaves">Leave Requests</Link>
              <Link to="/payroll">Payroll</Link>
            </>
          )}
        </div>
        <div className="nav-user">
          {!isAdmin && (
            <div className="check-in-out">
              {currentStatus?.checkedIn && !currentStatus?.checkedOut ? (
                <>
                  <div className="hours-display">
                    <span className="hours-text">{formatHours(getCurrentWorkingHours())}</span>
                    {currentStatus.overtime && currentStatus.overtimeHours > 0 && (
                      <span className="overtime-badge-nav">OT: {formatHours(currentStatus.overtimeHours)}</span>
                    )}
                  </div>
                  <button 
                    onClick={() => {
                      const now = new Date();
                      const isAfter6PM = now.getHours() >= 18;
                      // Show overtime modal only if after 6 PM and overtime not confirmed
                      // Otherwise, allow checkout at any time (mid-day checkout is allowed)
                      if (isAfter6PM && !overtimeConfirmed) {
                        setShowOvertimeModal(true);
                      } else {
                        // Checkout immediately (mid-day or after overtime confirmation)
                        handleCheckOut(isAfter6PM && overtimeConfirmed);
                      }
                    }} 
                    className="btn-checkout"
                    title="Click to check out (available at any time)"
                  >
                    Check Out
                  </button>
                  <span className="status-indicator checked-in pulse"></span>
                </>
              ) : (
                <>
                  <button 
                    onClick={handleCheckIn} 
                    className={`btn-checkin ${currentStatus?.checkedIn ? 'btn-disabled' : ''}`}
                    disabled={currentStatus?.checkedIn}
                  >
                    {currentStatus?.checkedIn ? 'Checked In' : 'Check In'}
                  </button>
                  <span className="status-indicator checked-out"></span>
                </>
              )}
            </div>
          )}
          <div className="user-avatar-dropdown" ref={dropdownRef}>
            <div
              className="avatar-container"
              onClick={() => setShowDropdown(!showDropdown)}
            >
              {user?.profile?.profilePicture ? (
                <img src={user.profile.profilePicture} alt="Avatar" className="avatar-img" />
              ) : (
                <div className="avatar-placeholder">
                  {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                </div>
              )}
            </div>
            {showDropdown && (
              <div className="dropdown-menu">
                <Link to="/profile" onClick={() => setShowDropdown(false)}>
                  My Profile
                </Link>
                <button onClick={handleLogout}>Log Out</button>
              </div>
            )}
          </div>
        </div>
      </nav>
      
      {/* Overtime Modal */}
      {showOvertimeModal && (
        <div className="modal-overlay" onClick={() => setShowOvertimeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h3>Office Hours Ended</h3>
            <p>It's past 6 PM (Office hours: 9 AM - 6 PM).</p>
            {currentStatus?.currentHours && (
              <p className="modal-hours">Current working hours: <strong>{formatHours(currentStatus.currentHours)}</strong></p>
            )}
            <p>Would you like to:</p>
            <div className="modal-actions">
              <button onClick={handleOvertimeContinue} className="btn-overtime-continue">
                Continue Working (Overtime)
              </button>
              <button onClick={handleOvertimeCheckout} className="btn-overtime-checkout">
                Check Out Now
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

