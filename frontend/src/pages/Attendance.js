import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import './Attendance.css';

const Attendance = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [currentStatus, setCurrentStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showOvertimeModal, setShowOvertimeModal] = useState(false);
  const [overtimeConfirmed, setOvertimeConfirmed] = useState(false);
  const intervalRef = useRef(null);
  const autoCheckoutRef = useRef(null);
  const [selectedMonth, setSelectedMonth] = useState(new Date()); // Current month for employee view
  const [summaryStats, setSummaryStats] = useState({
    daysPresent: 0,
    leavesCount: 0,
    totalWorkingDays: 0
  });
  const [leaves, setLeaves] = useState([]);
  
  // Calculate date range for current month
  const getMonthRange = (date) => {
    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    return {
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0]
    };
  };
  
  const [dateRange, setDateRange] = useState(() => {
    const today = new Date();
    return getMonthRange(today);
  });

  useEffect(() => {
    if (user) {
      // Fetch all data on mount
      const loadData = async () => {
        await fetchCurrentStatus(); // This also fetches todayAttendance
        await fetchAttendance();
        await fetchLeaves();
      };
      loadData();
      
      // Set up interval to update current hours every 30 seconds
      intervalRef.current = setInterval(() => {
        fetchCurrentStatus();
      }, 30000); // Update every 30 seconds

      // Set up auto-checkout at 6 PM
      setupAutoCheckout();
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (autoCheckoutRef.current) {
        clearTimeout(autoCheckoutRef.current);
      }
    };
  }, [user]);

  // Calculate summary statistics
  useEffect(() => {
    const monthRange = getMonthRange(selectedMonth);
    const monthStart = new Date(monthRange.startDate);
    const monthEnd = new Date(monthRange.endDate);
    const totalWorkingDays = Math.ceil((monthEnd - monthStart) / (1000 * 60 * 60 * 24)) + 1;
    
    const daysPresent = attendance.filter(a => {
      const recordDate = new Date(a.date);
      return recordDate >= monthStart && recordDate <= monthEnd && 
             a.status === 'Present' && a.checkIn?.time;
    }).length;
    
    const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
    
    setSummaryStats({
      daysPresent,
      leavesCount: approvedLeaves,
      totalWorkingDays
    });
  }, [attendance, leaves, selectedMonth]);

  // Fetch leaves when month changes
  useEffect(() => {
    if (user) {
      fetchLeaves();
    }
  }, [selectedMonth, user]);

  // Separate effect to check for auto-checkout when status changes
  useEffect(() => {
    if (currentStatus?.checkedIn && !currentStatus?.checkedOut && !overtimeConfirmed) {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Check if it's exactly 6 PM or later (only show once)
      if (currentHour >= 18 && !showOvertimeModal) {
        // Only show if it's been at least 1 minute since check-in (to avoid showing immediately)
        if (currentStatus.checkInTime) {
          const checkInTime = new Date(currentStatus.checkInTime);
          const timeDiff = now - checkInTime;
          const minutesSinceCheckIn = timeDiff / (1000 * 60);
          
          // Only show if checked in for at least 1 minute (to avoid false triggers)
          if (minutesSinceCheckIn >= 1) {
            setShowOvertimeModal(true);
          }
        }
      }
    }
  }, [currentStatus]);

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
      // The useEffect will handle showing the modal if needed
    } catch (error) {
      console.error('Error checking auto-checkout:', error);
    }
  };

  const fetchCurrentStatus = async () => {
    try {
      const response = await api.get('/attendance/status');
      const statusData = response.data;
      setCurrentStatus(statusData);
      
      // Always fetch today's attendance to keep it in sync
      await fetchTodayAttendance();
      
      // If status says checked in but todayAttendance is null, refetch
      if (statusData?.checkedIn && !todayAttendance) {
        await fetchTodayAttendance();
      }
    } catch (error) {
      console.error('Error fetching current status:', error);
      // If status endpoint fails (404), fallback to using todayAttendance
      // This handles cases where the status endpoint might not be available
      await fetchTodayAttendance();
      
      // Create a status object from todayAttendance as fallback
      if (todayAttendance) {
        const checkInTime = todayAttendance.checkIn?.time;
        const checkOutTime = todayAttendance.checkOut?.time;
        
        if (checkInTime && !checkOutTime) {
          // Calculate current hours from check-in time
          const now = new Date();
          const checkIn = new Date(checkInTime);
          const diffMs = now - checkIn;
          const currentHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));
          
          setCurrentStatus({
            checkedIn: true,
            checkedOut: false,
            checkInTime: checkInTime,
            currentHours: currentHours
          });
        } else if (checkInTime && checkOutTime) {
          setCurrentStatus({
            checkedIn: true,
            checkedOut: true,
            checkInTime: checkInTime,
            checkOutTime: checkOutTime,
            workingHours: todayAttendance.workingHours || 0,
            overtime: todayAttendance.overtime || false,
            overtimeHours: todayAttendance.overtimeHours || 0
          });
        } else {
          setCurrentStatus({
            checkedIn: false,
            checkedOut: false,
            currentHours: 0
          });
        }
      } else {
        setCurrentStatus({
          checkedIn: false,
          checkedOut: false,
          currentHours: 0
        });
      }
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?startDate=${today}&endDate=${today}`);
      if (response.data.length > 0) {
        setTodayAttendance(response.data[0]);
      } else {
        setTodayAttendance(null);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
      setTodayAttendance(null);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.get(
        `/attendance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setAttendance(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchLeaves = async () => {
    try {
      const monthRange = getMonthRange(selectedMonth);
      const response = await api.get(`/leaves?startDate=${monthRange.startDate}&endDate=${monthRange.endDate}`);
      setLeaves(response.data || []);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      setLeaves([]);
    }
  };

  // Navigate months
  const navigateMonth = (direction) => {
    const newMonth = new Date(selectedMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setSelectedMonth(newMonth);
    const monthRange = getMonthRange(newMonth);
    setDateRange(monthRange);
    fetchAttendance();
    fetchLeaves();
  };

  // Handle month selector change
  const handleMonthChange = (e) => {
    const monthValue = e.target.value;
    if (monthValue) {
      const [year, month] = monthValue.split('-').map(Number);
      const newMonth = new Date(year, month - 1, 1);
      setSelectedMonth(newMonth);
      const monthRange = getMonthRange(newMonth);
      setDateRange(monthRange);
      fetchAttendance();
      fetchLeaves();
    }
  };

  // Format date as "28/10/2025"
  const formatTableDate = (date) => {
    const d = new Date(date);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Format month display as "Oct"
  const formatMonthDisplay = (date) => {
    return date.toLocaleString('default', { month: 'short' });
  };

  const [message, setMessage] = useState('');

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/checkin');
      setMessage('Checked in successfully');
      // Refresh both status and attendance records
      await fetchCurrentStatus();
      await fetchTodayAttendance();
      setupAutoCheckout(); // Reset auto-checkout timer
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error checking in');
      setTimeout(() => setMessage(''), 5000);
    }
  };

  const handleCheckOut = async (isOvertime = false) => {
    try {
      await api.post('/attendance/checkout', { overtime: isOvertime });
      setMessage(isOvertime ? 'Checked out successfully (Overtime recorded)' : 'Checked out successfully');
      setShowOvertimeModal(false);
      setOvertimeConfirmed(false);
      // Refresh both status and attendance records
      await fetchCurrentStatus();
      await fetchTodayAttendance();
      // Clear message after 3 seconds
      setTimeout(() => setMessage(''), 3000);
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error checking out');
      setTimeout(() => setMessage(''), 5000);
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
    if (!hours && hours !== 0) return '-';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Format date as "22, October 2025"
  const formatDisplayDate = (date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return `${day}, ${month} ${year}`;
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

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchAttendance();
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  const today = new Date();
  
  // Determine check-in status: check currentStatus first, then todayAttendance
  // User is checked in if there's a check-in time and no check-out time
  const hasCheckInTime = currentStatus?.checkInTime || todayAttendance?.checkIn?.time;
  const hasCheckOutTime = currentStatus?.checkOutTime || todayAttendance?.checkOut?.time;
  
  // Check-in detection: prioritize currentStatus.checkedIn (most reliable)
  // If currentStatus says checkedIn is true, user IS checked in regardless of other data
  const isCheckedIn = 
    currentStatus?.checkedIn === true ||  // Explicit check-in status from API (MOST RELIABLE)
    (hasCheckInTime && !hasCheckOutTime); // Fallback: Has check-in time but no check-out
  
  // User is checked out if there's a check-out time or explicit checkedOut status
  const isCheckedOut = 
    currentStatus?.checkedOut === true ||  // Explicit check-out status from API
    (hasCheckOutTime !== undefined && hasCheckOutTime !== null); // Has check-out time
  
  const canCheckIn = !isCheckedIn;
  // Checkout is ALWAYS enabled if user is checked in and not checked out
  // Priority: If currentStatus.checkedIn === true, checkout MUST be enabled
  const canCheckOut = isCheckedIn && !isCheckedOut;
  
  // Debug log to help troubleshoot - check browser console
  console.log('🔍 Attendance Status Debug:', {
    'currentStatus?.checkedIn': currentStatus?.checkedIn,
    'currentStatus?.checkedOut': currentStatus?.checkedOut,
    'currentStatus?.checkInTime': currentStatus?.checkInTime,
    'todayAttendance?.checkIn?.time': todayAttendance?.checkIn?.time,
    'hasCheckInTime': !!hasCheckInTime,
    'hasCheckOutTime': !!hasCheckOutTime,
    'isCheckedIn': isCheckedIn,
    'isCheckedOut': isCheckedOut,
    'canCheckOut': canCheckOut,
    'Full currentStatus': currentStatus,
    'Full todayAttendance': todayAttendance
  });
  const currentHours = getCurrentWorkingHours();
  const isAfter6PM = new Date().getHours() >= 18;
  
  // Determine if we have any attendance data to show
  // Show data if we have currentStatus (even if checkedIn is false) or todayAttendance
  const hasAttendanceData = (currentStatus !== null) || todayAttendance;

  return (
    <Layout>
      <div className="attendance">
        <h1>Attendance</h1>

        {message && <div className={`message ${message.includes('successfully') ? 'message-success' : 'message-error'}`}>{message}</div>}

        <div className="check-in-out">
          <div className="check-card">
            <h3>Today's Attendance</h3>
            {hasAttendanceData ? (
              <div className="attendance-status">
                <div className="status-item">
                  <label>Check In:</label>
                  <p>
                    {currentStatus?.checkInTime
                      ? new Date(currentStatus.checkInTime).toLocaleTimeString()
                      : todayAttendance?.checkIn?.time
                      ? new Date(todayAttendance.checkIn.time).toLocaleTimeString()
                      : 'Not checked in'}
                  </p>
                </div>
                <div className="status-item">
                  <label>Check Out:</label>
                  <p>
                    {currentStatus?.checkOutTime
                      ? new Date(currentStatus.checkOutTime).toLocaleTimeString()
                      : todayAttendance?.checkOut?.time
                      ? new Date(todayAttendance.checkOut.time).toLocaleTimeString()
                      : 'Not checked out'}
                  </p>
                </div>
                <div className="status-item">
                  <label>Working Hours:</label>
                  <p className="working-hours-display">
                    {formatHours(currentHours)}
                    {currentStatus?.overtime && currentStatus.overtimeHours > 0 && (
                      <span className="overtime-badge"> (Overtime: {formatHours(currentStatus.overtimeHours)})</span>
                    )}
                    {todayAttendance?.overtime && todayAttendance.overtimeHours > 0 && (
                      <span className="overtime-badge"> (Overtime: {formatHours(todayAttendance.overtimeHours)})</span>
                    )}
                  </p>
                </div>
                {!isCheckedOut && isCheckedIn && (
                  <div className="status-item live-hours">
                    <label>Current Session:</label>
                    <p className="live-indicator">
                      <span className="pulse-dot"></span>
                      {formatHours(currentHours)} (Live)
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="attendance-status">
                <p style={{ color: '#666', textAlign: 'center', padding: '20px' }}>
                  No attendance record for today. Click "Check In" to start tracking your attendance.
                </p>
              </div>
            )}
            <div className="check-actions">
              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className={`btn-checkin ${!canCheckIn ? 'btn-disabled' : ''}`}
                title={isCheckedIn ? 'You are already checked in' : 'Click to check in'}
              >
                {isCheckedIn ? 'Checked In' : 'Check In'}
              </button>
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
                disabled={!canCheckOut}
                className={`btn-checkout ${!canCheckOut ? 'btn-disabled' : ''}`}
                title={canCheckOut ? 'Click to check out (available at any time)' : isCheckedIn ? 'You are already checked out' : 'Please check in first'}
              >
                Check Out
              </button>
            </div>
          </div>
        </div>

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

        {/* Date Navigation and Summary Statistics */}
        <div className="attendance-month-controls">
          <div className="month-navigation">
            <button onClick={() => navigateMonth('prev')} className="nav-arrow-btn">←</button>
            <button onClick={() => navigateMonth('next')} className="nav-arrow-btn">→</button>
            <input
              type="month"
              value={`${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`}
              onChange={(e) => {
                const [year, month] = e.target.value.split('-').map(Number);
                const newMonth = new Date(year, month - 1, 1);
                setSelectedMonth(newMonth);
                const monthRange = getMonthRange(newMonth);
                setDateRange(monthRange);
                fetchAttendance();
                fetchLeaves();
              }}
              className="month-input"
            />
          </div>
          <div className="summary-stats">
            <div className="stat-box">
              <h3>Count of days present</h3>
              <p>{summaryStats.daysPresent}</p>
            </div>
            <div className="stat-box">
              <h3>Leaves count</h3>
              <p>{summaryStats.leavesCount}</p>
            </div>
            <div className="stat-box">
              <h3>Total working days</h3>
              <p>{summaryStats.totalWorkingDays}</p>
            </div>
          </div>
        </div>

        {/* Current Date Display */}
        <div className="current-date-display">
          {formatDisplayDate(new Date())}
        </div>

        <div className="attendance-table">
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Check In</th>
                <th>Check Out</th>
                <th>Work Hours</th>
                <th>Extra hours</th>
              </tr>
            </thead>
            <tbody>
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No attendance records found for {formatMonthDisplay(selectedMonth)} {selectedMonth.getFullYear()}</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id}>
                    <td>{formatTableDate(record.date)}</td>
                    <td>
                      {record.checkIn?.time
                        ? new Date(record.checkIn.time).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false
                          })
                        : '-'}
                    </td>
                    <td>
                      {record.checkOut?.time
                        ? new Date(record.checkOut.time).toLocaleTimeString('en-US', { 
                            hour: '2-digit', 
                            minute: '2-digit',
                            hour12: false
                          })
                        : '-'}
                    </td>
                    <td>
                      {record.workingHours ? formatHours(record.workingHours) : '-'}
                    </td>
                    <td>
                      {record.overtime && record.overtimeHours > 0 ? (
                        formatHours(record.overtimeHours)
                      ) : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
};

export default Attendance;

