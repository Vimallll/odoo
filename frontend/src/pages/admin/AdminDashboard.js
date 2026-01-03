import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import '../Dashboard.css';

const AdminDashboard = () => {
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
        <h1>Admin Dashboard</h1>
        <p className="subtitle">Manage your HR operations efficiently.</p>

        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-info">
              <h3>{stats?.totalEmployees || 0}</h3>
              <p>Total Employees</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-info">
              <h3>{stats?.todayAttendance || 0}</h3>
              <p>Today's Attendance</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📋</div>
            <div className="stat-info">
              <h3>{stats?.pendingLeaves || 0}</h3>
              <p>Pending Leaves</p>
            </div>
          </div>
        </div>

        <div className="dashboard-cards">
          <Link to="/admin/employee-cards" className="card">
            <div className="card-icon">👥</div>
            <h3>Employee Information</h3>
            <p>View all employees in card view</p>
          </Link>

          <Link to="/admin/employees" className="card">
            <div className="card-icon">👤</div>
            <h3>Manage Employees</h3>
            <p>Edit and manage employee data</p>
          </Link>

          <Link to="/admin/attendance" className="card">
            <div className="card-icon">⏱</div>
            <h3>Attendance</h3>
            <p>View all attendance records</p>
          </Link>

          <Link to="/admin/leaves" className="card">
            <div className="card-icon">🏖</div>
            <h3>Leave Requests</h3>
            <p>Approve or reject leaves</p>
          </Link>

          <Link to="/admin/payroll" className="card">
            <div className="card-icon">💰</div>
            <h3>Payroll</h3>
            <p>Manage payroll and salaries</p>
          </Link>

          <Link to="/admin/reports" className="card">
            <div className="card-icon">📊</div>
            <h3>Reports</h3>
            <p>View analytics and reports</p>
          </Link>
        </div>

        {stats?.recentLeaves && stats.recentLeaves.length > 0 && (
          <div className="recent-activity">
            <h2>Recent Leave Requests</h2>
            <div className="activity-list">
              {stats.recentLeaves.map((leave) => (
                <div key={leave._id} className="activity-item">
                  <div className="activity-info">
                    <strong>
                      {leave.employeeId?.profile?.firstName} {leave.employeeId?.profile?.lastName}
                    </strong>
                    <span>
                      {leave.leaveType} - {new Date(leave.startDate).toLocaleDateString()} to{' '}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </span>
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

export default AdminDashboard;

