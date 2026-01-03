import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
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
  const isEmployee = user?.role === 'Employee';

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  // Navigation items
  const employeeNavItems = [
    { path: '/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/profile', label: 'Profile', icon: '👤' },
    { path: '/attendance', label: 'Attendance', icon: '⏰' },
    { path: '/leaves', label: 'Leave Requests', icon: '🏖️' },
    { path: '/payroll', label: 'Payroll', icon: '💰' },
  ];

  const adminNavItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/employee-cards', label: 'Employees', icon: '👥' },
    { path: '/admin/attendance', label: 'Attendance', icon: '⏰' },
    { path: '/admin/leaves', label: 'Leave Requests', icon: '🏖️' },
    { path: '/admin/payroll', label: 'Payroll', icon: '💰' },
    { path: '/admin/reports', label: 'Reports', icon: '📈' },
  ];

  const navItems = isAdmin ? adminNavItems : employeeNavItems;

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="sidebar-brand">
            <div className="brand-icon">🌊</div>
            {!sidebarCollapsed && <span className="brand-text">Emporia</span>}
          </Link>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? 'active' : ''}`}
              title={sidebarCollapsed ? item.label : ''}
            >
              <span className="nav-icon">{item.icon}</span>
              {!sidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="user-info">
              <div className="user-name">
                {user?.profile?.firstName || user?.email?.split('@')[0] || 'User'}
              </div>
              <div className="user-role">{user?.role}</div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <h1 className="page-title">
              {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </h1>
          </div>

          <div className="topbar-right">
            {isEmployee && (
              <div className="check-in-out-widget">
                <button 
                  onClick={handleCheckIn} 
                  disabled={checkInStatus?.checkIn?.time}
                  className={`btn btn-success btn-sm ${checkInStatus?.checkIn?.time ? 'btn-disabled' : ''}`}
                >
                  Check In
                </button>
                <button 
                  onClick={handleCheckOut} 
                  disabled={!checkInStatus?.checkIn?.time || checkInStatus?.checkOut?.time}
                  className={`btn btn-danger btn-sm ${!checkInStatus?.checkIn?.time || checkInStatus?.checkOut?.time ? 'btn-disabled' : ''}`}
                >
                  Check Out
                </button>
                <div className={`status-dot ${checkInStatus?.checkIn?.time && !checkInStatus?.checkOut?.time ? 'active' : 'inactive'}`}></div>
              </div>
            )}

            <div className="notifications-icon">
              <button className="icon-btn" aria-label="Notifications">
                🔔
              </button>
            </div>

            <div className="user-menu" ref={dropdownRef}>
              <button
                className="user-menu-trigger"
                onClick={() => setShowDropdown(!showDropdown)}
              >
                {user?.profile?.profilePicture ? (
                  <img src={user.profile.profilePicture} alt="Avatar" className="user-avatar" />
                ) : (
                  <div className="user-avatar-placeholder">
                    {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                )}
                <span className="user-name-short">
                  {user?.profile?.firstName || user?.email?.split('@')[0] || 'User'}
                </span>
                <span className="dropdown-arrow">▼</span>
              </button>

              {showDropdown && (
                <div className="user-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">
                      {user?.profile?.profilePicture ? (
                        <img src={user.profile.profilePicture} alt="Avatar" />
                      ) : (
                        <div className="avatar-placeholder-large">
                          {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="dropdown-user-info">
                      <div className="dropdown-name">
                        {user?.profile?.firstName} {user?.profile?.lastName}
                      </div>
                      <div className="dropdown-email">{user?.email}</div>
                      {user?.profile && (
                        <div className="profile-completion">
                          <span>Profile: {Math.round((Object.values(user.profile).filter(v => v).length / 10) * 100)}%</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <Link to="/profile" className="dropdown-item" onClick={() => setShowDropdown(false)}>
                    <span className="dropdown-icon">👤</span>
                    My Profile
                  </Link>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item logout" onClick={handleLogout}>
                    <span className="dropdown-icon">🚪</span>
                    Log Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
