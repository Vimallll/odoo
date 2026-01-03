import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import './Attendance.css';

const Attendance = () => {
  const { user } = useContext(AuthContext);
  const [attendance, setAttendance] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
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
      if (response.data.length > 0) {
        setTodayAttendance(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching today attendance:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const response = await api.get(
        `/attendance?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`
      );
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const [message, setMessage] = useState('');

  const handleCheckIn = async () => {
    try {
      await api.post('/attendance/checkin');
      setMessage('Checked in successfully');
      fetchTodayAttendance();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error checking in');
    }
  };

  const handleCheckOut = async () => {
    try {
      await api.post('/attendance/checkout');
      setMessage('Checked out successfully');
      fetchTodayAttendance();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error checking out');
    }
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
  const canCheckIn = !todayAttendance || !todayAttendance.checkIn?.time;
  const canCheckOut = todayAttendance?.checkIn?.time && !todayAttendance?.checkOut?.time;

  return (
    <Layout>
      <div className="attendance">
        <h1>Attendance</h1>

        {message && <div className="message">{message}</div>}

        <div className="check-in-out">
          <div className="check-card">
            <h3>Today's Attendance</h3>
            {todayAttendance ? (
              <div className="attendance-status">
                <div className="status-item">
                  <label>Check In:</label>
                  <p>
                    {todayAttendance.checkIn?.time
                      ? new Date(todayAttendance.checkIn.time).toLocaleTimeString()
                      : 'Not checked in'}
                  </p>
                </div>
                <div className="status-item">
                  <label>Check Out:</label>
                  <p>
                    {todayAttendance.checkOut?.time
                      ? new Date(todayAttendance.checkOut.time).toLocaleTimeString()
                      : 'Not checked out'}
                  </p>
                </div>
                {todayAttendance.workingHours > 0 && (
                  <div className="status-item">
                    <label>Working Hours:</label>
                    <p>{todayAttendance.workingHours} hours</p>
                  </div>
                )}
              </div>
            ) : (
              <p>No attendance record for today</p>
            )}
            <div className="check-actions">
              <button
                onClick={handleCheckIn}
                disabled={!canCheckIn}
                className="btn-checkin"
              >
                Check In
              </button>
              <button
                onClick={handleCheckOut}
                disabled={!canCheckOut}
                className="btn-checkout"
              >
                Check Out
              </button>
            </div>
          </div>
        </div>

        <div className="attendance-filters">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={dateRange.startDate}
              onChange={handleDateChange}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={dateRange.endDate}
              onChange={handleDateChange}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">
            Search
          </button>
        </div>

        <div className="attendance-table">
          <table>
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
              {attendance.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">No attendance records found</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id}>
                    <td>{new Date(record.date).toLocaleDateString()}</td>
                    <td>
                      <span className={`status-badge status-${record.status.toLowerCase().replace('-', '')}`}>
                        {record.status}
                      </span>
                    </td>
                    <td>
                      {record.checkIn?.time
                        ? new Date(record.checkIn.time).toLocaleTimeString()
                        : '-'}
                    </td>
                    <td>
                      {record.checkOut?.time
                        ? new Date(record.checkOut.time).toLocaleTimeString()
                        : '-'}
                    </td>
                    <td>{record.workingHours || '-'}</td>
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

