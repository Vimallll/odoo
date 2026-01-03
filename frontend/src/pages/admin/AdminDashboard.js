import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import KPICard from '../../components/KPICard';
import { KPICardSkeleton, TableSkeleton } from '../../components/LoadingSkeleton';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentEmployees, setRecentEmployees] = useState([]);

  useEffect(() => {
    fetchStats();
    fetchRecentEmployees();
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

  const fetchRecentEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setRecentEmployees(response.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="admin-dashboard">
          <div className="dashboard-header">
            <h1>Admin Dashboard</h1>
            <p className="subtitle">Manage your HR operations efficiently.</p>
          </div>
          <div className="kpi-grid">
            {[...Array(4)].map((_, i) => (
              <KPICardSkeleton key={i} />
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="admin-dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Admin Dashboard</h1>
            <p className="subtitle">Manage your HR operations efficiently.</p>
          </div>
        </div>

        {/* Analytics KPI Cards */}
        <div className="kpi-grid">
          <KPICard
            title="Total Employees"
            value={stats?.totalEmployees || 0}
            change="active employees"
            icon="👥"
            color="primary"
          />
          <KPICard
            title="Today's Attendance"
            value={stats?.todayAttendance || 0}
            change={`${stats?.totalEmployees ? Math.round((stats.todayAttendance / stats.totalEmployees) * 100) : 0}% present`}
            icon="✅"
            color="success"
            trend="up"
          />
          <KPICard
            title="Pending Leaves"
            value={stats?.pendingLeaves || 0}
            change="awaiting approval"
            icon="📋"
            color="warning"
          />
          <KPICard
            title="This Month Payroll"
            value={stats?.monthlyPayroll || 0}
            change="processed"
            icon="💰"
            color="info"
          />
        </div>

        {/* Quick Actions Grid */}
        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/admin/employee-cards" className="action-card">
              <div className="action-icon">👥</div>
              <div className="action-content">
                <h3>Employee Cards</h3>
                <p>View all employees in card view</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/employees" className="action-card">
              <div className="action-icon">👤</div>
              <div className="action-content">
                <h3>Manage Employees</h3>
                <p>Edit and manage employee data</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/attendance" className="action-card">
              <div className="action-icon">⏰</div>
              <div className="action-content">
                <h3>Attendance</h3>
                <p>View all attendance records</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/leaves" className="action-card">
              <div className="action-icon">🏖️</div>
              <div className="action-content">
                <h3>Leave Requests</h3>
                <p>Approve or reject leaves</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/payroll" className="action-card">
              <div className="action-icon">💰</div>
              <div className="action-content">
                <h3>Payroll</h3>
                <p>Manage payroll and salaries</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>

            <Link to="/admin/reports" className="action-card">
              <div className="action-icon">📊</div>
              <div className="action-content">
                <h3>Reports</h3>
                <p>View analytics and reports</p>
              </div>
              <div className="action-arrow">→</div>
            </Link>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="dashboard-grid">
          {/* Recent Leave Requests */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Leave Requests</h3>
              <Link to="/admin/leaves" className="view-all-link">View All →</Link>
            </div>
            {stats?.recentLeaves && stats.recentLeaves.length > 0 ? (
              <div className="leave-requests-list">
                {stats.recentLeaves.slice(0, 5).map((leave) => (
                  <div key={leave._id} className="leave-request-item">
                    <div className="leave-request-info">
                      <div className="leave-request-header">
                        <h4>
                          {leave.employeeId?.profile?.firstName} {leave.employeeId?.profile?.lastName}
                        </h4>
                        <span className={`badge badge-${leave.status.toLowerCase()}`}>
                          {leave.status}
                        </span>
                      </div>
                      <p className="leave-type">{leave.leaveType} Leave</p>
                      <p className="leave-dates">
                        {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                      </p>
                    </div>
                    <Link to={`/admin/leaves`} className="view-details-btn">
                      View →
                    </Link>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No recent leave requests</p>
              </div>
            )}
          </div>

          {/* Recent Employees */}
          <div className="dashboard-card">
            <div className="card-header">
              <h3>Recent Employees</h3>
              <Link to="/admin/employees" className="view-all-link">View All →</Link>
            </div>
            {recentEmployees.length > 0 ? (
              <div className="employees-list">
                {recentEmployees.map((employee) => (
                  <Link
                    key={employee._id}
                    to={`/admin/employees/${employee._id}`}
                    className="employee-item"
                  >
                    <div className="employee-avatar-small">
                      {employee.profile?.profilePicture ? (
                        <img src={employee.profile.profilePicture} alt="Avatar" />
                      ) : (
                        <div className="avatar-placeholder-small">
                          {employee.profile?.firstName?.[0] || employee.email?.[0] || 'U'}
                        </div>
                      )}
                    </div>
                    <div className="employee-info-small">
                      <h4>{employee.profile?.firstName} {employee.profile?.lastName}</h4>
                      <p>{employee.profile?.position || 'Employee'}</p>
                    </div>
                    <div className="employee-arrow">→</div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <p>No employees found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
