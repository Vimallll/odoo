import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const [checkInStatus, setCheckInStatus] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    fetchTodayAttendance();
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchTodayAttendance = async () => {
    if (user?.role === 'Employee') {
      try {
        const today = new Date().toISOString().split('T')[0];
        const response = await api.get(`/attendance?startDate=${today}&endDate=${today}`);
        if (response.data.length > 0) {
          setCheckInStatus(response.data[0]);
        }
      } catch (error) {
        console.error('Error fetching attendance:', error);
      }
    }
  };

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/checkin');
      await fetchTodayAttendance();
    } catch (error) {
      alert(error.response?.data?.error || 'Error checking in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/checkout');
      await fetchTodayAttendance();
    } catch (error) {
      alert(error.response?.data?.error || 'Error checking out');
    }
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
              {checkInStatus?.checkIn?.time && !checkInStatus?.checkOut?.time ? (
                <>
                  <button onClick={handleCheckOut} className="btn-checkout">
                    Check Out
                  </button>
                  <span className="status-indicator checked-in"></span>
                </>
              ) : (
                <>
                  <button onClick={handleCheckIn} className="btn-checkin">
                    Check In
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
      <main className="main-content">{children}</main>
    </div>
  );
};

export default Layout;

