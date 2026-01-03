import React, { useContext, useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../utils/api';
import { 
  LayoutDashboard, Home, Users, Clock, Calendar, DollarSign, FileText, 
  Settings, LogOut, Menu, X, Bell, ChevronDown, User, CheckCircle2, 
  XCircle, AlertCircle
} from 'lucide-react';
import './Layout.css';

const Layout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [showDropdown, setShowDropdown] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeConfirmed, setOvertimeConfirmed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  const isActive = (path) => location.pathname === path;

  const sidebarMenuItems = isAdmin ? [
    { path: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/admin/employees', label: 'Employees', icon: Users },
    { path: '/admin/attendance', label: 'Attendance', icon: Clock },
    { path: '/admin/leaves', label: 'Leave Requests', icon: Calendar },
    { path: '/admin/payroll', label: 'Payroll', icon: DollarSign },
    { path: '/admin/reports', label: 'Reports', icon: FileText },
  ] : [
    { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { path: '/profile', label: 'Profile', icon: User },
    { path: '/attendance', label: 'Attendance', icon: Clock },
    { path: '/leaves', label: 'Leave Requests', icon: Calendar },
    { path: '/payroll', label: 'Payroll', icon: DollarSign },
  ];

  return (
    <div className={`layout ${sidebarCollapsed ? 'sidebar-collapsed' : ''} ${mobileMenuOpen ? 'mobile-menu-open' : ''}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to={isAdmin ? '/admin/dashboard' : '/dashboard'} className="sidebar-brand">
            <div className="brand-icon">D</div>
            {!sidebarCollapsed && <span className="brand-text">Dayflow</span>}
          </Link>
          <button 
            className="sidebar-toggle"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            aria-label="Toggle sidebar"
          >
            {sidebarCollapsed ? <Menu size={20} /> : <X size={20} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {sidebarMenuItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`sidebar-item ${isActive(item.path) ? 'active' : ''}`}
                onClick={() => setMobileMenuOpen(false)}
              >
                <Icon size={20} className="sidebar-icon" />
                {!sidebarCollapsed && <span className="sidebar-label">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          {!sidebarCollapsed && (
            <div className="sidebar-user-info">
              <div className="sidebar-user-avatar">
                {user?.profile?.profilePicture ? (
                  <img src={user.profile.profilePicture} alt="Avatar" />
                ) : (
                  <div className="avatar-placeholder-small">
                    {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                  </div>
                )}
              </div>
              <div className="sidebar-user-details">
                <div className="sidebar-user-name">
                  {user?.profile?.firstName} {user?.profile?.lastName}
                </div>
                <div className="sidebar-user-role">{user?.role}</div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-wrapper">
        {/* Top Bar */}
        <header className="topbar">
          <div className="topbar-left">
            <button 
              className="mobile-menu-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <Menu size={24} />
            </button>
            <div className="topbar-title">
              {sidebarMenuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
            </div>
          </div>

          <div className="topbar-right">
            {!isAdmin && (
              <div className="check-in-out-topbar">
                {currentStatus?.checkedIn && !currentStatus?.checkedOut ? (
                  <div className="check-status-group">
                    <div className="hours-display-topbar">
                      <span className="hours-text-topbar">{formatHours(getCurrentWorkingHours())}</span>
                      {currentStatus.overtime && currentStatus.overtimeHours > 0 && (
                        <span className="overtime-badge-topbar">OT: {formatHours(currentStatus.overtimeHours)}</span>
                      )}
                    </div>
                    <button 
                      onClick={() => {
                        const now = new Date();
                        const isAfter6PM = now.getHours() >= 18;
                        if (isAfter6PM && !overtimeConfirmed) {
                          setShowOvertimeModal(true);
                        } else {
                          handleCheckOut(isAfter6PM && overtimeConfirmed);
                        }
                      }} 
                      className="btn-checkout-topbar"
                      title="Check out"
                    >
                      <XCircle size={16} />
                      Check Out
                    </button>
                    <span className="status-indicator-topbar checked-in pulse"></span>
                  </div>
                ) : (
                  <div className="check-status-group">
                    <button 
                      onClick={handleCheckIn} 
                      className={`btn-checkin-topbar ${currentStatus?.checkedIn ? 'btn-disabled' : ''}`}
                      disabled={currentStatus?.checkedIn}
                    >
                      <CheckCircle2 size={16} />
                      {currentStatus?.checkedIn ? 'Checked In' : 'Check In'}
                    </button>
                    <span className="status-indicator-topbar checked-out"></span>
                  </div>
                )}
              </div>
            )}

            <div className="topbar-actions">
              <button className="topbar-icon-btn" aria-label="Notifications">
                <Bell size={20} />
                <span className="notification-badge">3</span>
              </button>

              <div className="user-dropdown" ref={dropdownRef}>
                <button
                  className="user-dropdown-trigger"
                  onClick={() => setShowDropdown(!showDropdown)}
                >
                  <div className="user-avatar-small">
                    {user?.profile?.profilePicture ? (
                      <img src={user.profile.profilePicture} alt="Avatar" />
                    ) : (
                      <div className="avatar-placeholder-small">
                        {user?.profile?.firstName?.[0] || user?.email?.[0] || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="user-info-small">
                    <div className="user-name-small">
                      {user?.profile?.firstName} {user?.profile?.lastName}
                    </div>
                    <div className="user-role-small">{user?.role}</div>
                  </div>
                  <ChevronDown size={16} className={`dropdown-arrow ${showDropdown ? 'open' : ''}`} />
                </button>
                {showDropdown && (
                  <div className="dropdown-menu-modern">
                    <Link to="/profile" onClick={() => setShowDropdown(false)} className="dropdown-item">
                      <User size={16} />
                      <span>My Profile</span>
                    </Link>
                    <Link to="/profile" onClick={() => setShowDropdown(false)} className="dropdown-item">
                      <Settings size={16} />
                      <span>Settings</span>
                    </Link>
                    <div className="dropdown-divider"></div>
                    <button onClick={handleLogout} className="dropdown-item danger">
                      <LogOut size={16} />
                      <span>Log Out</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>
      
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

        {/* Main Content */}
        <main className="main-content">{children}</main>
      </div>

      {/* Mobile Overlay */}
      {mobileMenuOpen && (
        <div className="mobile-overlay" onClick={() => setMobileMenuOpen(false)}></div>
      )}

      {/* Overtime Modal */}
      {showOvertimeModal && (
        <div className="modal-overlay" onClick={() => setShowOvertimeModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <AlertCircle size={24} className="modal-icon" />
              <h3>Office Hours Ended</h3>
            </div>
            <div className="modal-body">
              <p>It's past 6 PM (Office hours: 9 AM - 6 PM).</p>
              {currentStatus?.currentHours && (
                <div className="modal-hours">
                  <span className="modal-hours-label">Current working hours:</span>
                  <strong>{formatHours(currentStatus.currentHours)}</strong>
                </div>
              )}
              <p>Would you like to:</p>
            </div>
            <div className="modal-actions">
              <button onClick={handleOvertimeContinue} className="btn btn-secondary">
                Continue Working (Overtime)
              </button>
              <button onClick={handleOvertimeCheckout} className="btn btn-primary">
                Check Out Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;

