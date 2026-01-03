import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import Toast from '../components/Toast';
import './Attendance.css';

const Attendance = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTodayAttendance();
    fetchAttendance();
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?startDate=${today}&endDate=${today}`);
      if (response.data && response.data.length > 0) {
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
      setLoading(true);
      const response = await api.get(
        `/attendance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      showToast('Error fetching attendance records', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const handleCheckIn = async () => {
    try {
      const response = await api.post('/attendance/checkin');
      showToast('Checked in successfully!', 'success');
      // Immediately refresh attendance data to update button states
      await fetchTodayAttendance();
      await fetchAttendance();
    } catch (error) {
      showToast(error.response?.data?.error || 'Error checking in', 'error');
    }
  };

  const handleCheckOut = async () => {
    try {
      const response = await api.post('/attendance/checkout');
      showToast('Checked out successfully!', 'success');
      // Immediately refresh attendance data to update button states
      await fetchTodayAttendance();
      await fetchAttendance();
    } catch (error) {
      showToast(error.response?.data?.error || 'Error checking out', 'error');
    }
  };

  const handleDateChange = (e) => {
    setDateRange({ ...dateRange, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    fetchAttendance();
  };

  // Calculate button states based on current attendance
  // canCheckIn: true if no attendance record OR no check-in time exists
  const canCheckIn = !todayAttendance || !todayAttendance.checkIn?.time;
  
  // canCheckOut: true if check-in exists AND check-out doesn't exist
  const canCheckOut = todayAttendance?.checkIn?.time && !todayAttendance?.checkOut?.time;

  const getStatusColor = (status) => {
    const colors = {
      Present: 'success',
      Absent: 'error',
      'Half-day': 'warning',
      Leave: 'info'
    };
    return colors[status] || 'info';
  };

  const getStatusIcon = (status) => {
    const icons = {
      Present: '✅',
      Absent: '❌',
      'Half-day': '⏰',
      Leave: '🏖️'
    };
    return icons[status] || '❓';
  };

  return (
    <Layout>
      <div className="attendance-page">
        <div className="page-header">
          <div>
            <h1>Attendance</h1>
            <p className="subtitle">Track your daily attendance and working hours</p>
          </div>
        </div>

        {/* Today's Attendance Card */}
        <div className="today-attendance-card">
          <div className="card-header-modern">
            <div>
              <h3>Today's Attendance</h3>
              <p className="card-subtitle">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
            <div className={`status-indicator-large ${todayAttendance?.checkIn?.time && !todayAttendance?.checkOut?.time ? 'active' : 'inactive'}`}>
              <div className={`status-dot-large ${todayAttendance?.checkIn?.time && !todayAttendance?.checkOut?.time ? 'active' : ''}`}></div>
            </div>
          </div>

          {todayAttendance ? (
            <div className="attendance-details-grid">
              <div className="detail-item">
                <div className="detail-label">Check In</div>
                <div className="detail-value">
                  {todayAttendance.checkIn?.time
                    ? new Date(todayAttendance.checkIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'Not checked in'}
                </div>
              </div>
              <div className="detail-item">
                <div className="detail-label">Check Out</div>
                <div className="detail-value">
                  {todayAttendance.checkOut?.time
                    ? new Date(todayAttendance.checkOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                    : 'Not checked out'}
                </div>
              </div>
              {todayAttendance.workingHours > 0 && (
                <div className="detail-item">
                  <div className="detail-label">Working Hours</div>
                  <div className="detail-value highlight">{todayAttendance.workingHours.toFixed(1)} hrs</div>
                </div>
              )}
              <div className="detail-item">
                <div className="detail-label">Status</div>
                <div className="detail-value">
                  <span className={`badge badge-${getStatusColor(todayAttendance.status)}`}>
                    {getStatusIcon(todayAttendance.status)} {todayAttendance.status}
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-attendance-today">
              <p>No attendance record for today</p>
            </div>
          )}

          <div className="check-in-out-actions">
            <button
              onClick={handleCheckIn}
              disabled={!canCheckIn}
              className={`btn btn-success btn-large ${!canCheckIn ? 'btn-disabled' : ''}`}
            >
              <span className="btn-icon">✓</span>
              Check In
            </button>
            <button
              onClick={handleCheckOut}
              disabled={!canCheckOut}
              className={`btn btn-danger btn-large ${!canCheckOut ? 'btn-disabled' : ''}`}
            >
              <span className="btn-icon">✕</span>
              Check Out
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="attendance-filters-modern">
          <div className="filters-header">
            <h3>Attendance History</h3>
            <p className="filter-subtitle">View your attendance records</p>
          </div>
          <div className="filters-content">
            <div className="filter-input-group">
              <label>Start Date</label>
              <input
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="input"
              />
            </div>
            <div className="filter-input-group">
              <label>End Date</label>
              <input
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                className="input"
              />
            </div>
            <button onClick={handleSearch} className="btn btn-primary">
              Search
            </button>
          </div>
        </div>

        {/* Attendance Table */}
        <div className="attendance-table-modern">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading attendance records...</p>
            </div>
          ) : attendance.length === 0 ? (
            <div className="empty-state-modern">
              <div className="empty-icon">📅</div>
              <h3>No Attendance Records</h3>
              <p>No attendance records found for the selected date range.</p>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="modern-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Status</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Working Hours</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((record) => (
                    <tr key={record._id}>
                      <td className="date-cell">
                        <div className="date-day">{new Date(record.date).getDate()}</div>
                        <div className="date-month-year">
                          {new Date(record.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                        </div>
                      </td>
                      <td>
                        <span className={`badge badge-${getStatusColor(record.status)}`}>
                          {getStatusIcon(record.status)} {record.status}
                        </span>
                      </td>
                      <td>
                        {record.checkIn?.time
                          ? new Date(record.checkIn.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : <span className="text-muted">-</span>}
                      </td>
                      <td>
                        {record.checkOut?.time
                          ? new Date(record.checkOut.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
                          : <span className="text-muted">-</span>}
                      </td>
                      <td className="hours-cell">
                        {record.workingHours ? (
                          <span className="hours-badge">{record.workingHours.toFixed(1)} hrs</span>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Attendance;
