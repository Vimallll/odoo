import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await api.get('/reports/dashboard');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="dashboard">
        <h1>Employee Dashboard</h1>
        <p className="subtitle">Welcome back! Here's your overview.</p>

        <div className="dashboard-cards">
          <Link to="/profile" className="card">
            <div className="card-icon">👤</div>
            <h3>Profile</h3>
            <p>View and edit your profile</p>
          </Link>

          <Link to="/attendance" className="card">
            <div className="card-icon">⏱</div>
            <h3>Attendance</h3>
            <p>Check in/out and view records</p>
          </Link>

          <Link to="/leaves" className="card">
            <div className="card-icon">🏖</div>
            <h3>Leave Requests</h3>
            <p>Apply and track your leaves</p>
          </Link>

          <Link to="/payroll" className="card">
            <div className="card-icon">💰</div>
            <h3>Payroll</h3>
            <p>View salary and payslips</p>
          </Link>
        </div>

        {stats?.recentLeaves && stats.recentLeaves.length > 0 && (
          <div className="recent-activity">
            <h2>Recent Leave Requests</h2>
            <div className="activity-list">
              {stats.recentLeaves.map((leave) => (
                <div key={leave._id} className="activity-item">
                  <div className="activity-info">
                    <strong>{leave.leaveType} Leave</strong>
                    <span>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</span>
                  </div>
                  <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Dashboard;

