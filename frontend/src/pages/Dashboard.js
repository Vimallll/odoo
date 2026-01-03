import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../utils/api';
import Layout from '../components/Layout';
import KPICard from '../components/KPICard';
import { KPICardSkeleton } from '../components/LoadingSkeleton';
import { Clock, Calendar, TrendingUp, FileText, User, ArrowRight, CheckCircle2, XCircle, Clock as ClockIcon } from 'lucide-react';
import './Dashboard.css';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [attendanceStatus, setAttendanceStatus] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchTodayAttendance();
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

  const fetchTodayAttendance = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const response = await api.get(`/attendance?startDate=${today}&endDate=${today}`);
      if (response.data.length > 0) {
        setAttendanceStatus(response.data[0]);
      }
    } catch (error) {
      console.error('Error fetching attendance:', error);
    }
  };

  const getAttendanceStatus = () => {
    if (!attendanceStatus) return 'Not Checked In';
    if (attendanceStatus.checkIn && !attendanceStatus.checkOut) return 'Checked In';
    if (attendanceStatus.checkIn && attendanceStatus.checkOut) return 'Checked Out';
    return 'Absent';
  };

  const getLeaveBalance = () => {
    // This would come from the API
    return stats?.leaveBalance || { paid: 10, sick: 5, unpaid: 0 };
  };

  if (loading) {
    return (
      <Layout>
        <div className="dashboard">
          <div className="dashboard-header">
            <div>
              <h1>Dashboard</h1>
              <p className="subtitle">Welcome back! Here's your overview.</p>
            </div>
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

  const leaveBalance = getLeaveBalance();

  return (
    <Layout>
      <div className="dashboard">
        <div className="dashboard-header">
          <div>
            <h1>Dashboard</h1>
            <p className="subtitle">Welcome back! Here's your overview.</p>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="kpi-grid">
          <KPICard
            title="Attendance Status"
            value={getAttendanceStatus()}
            icon={<Clock size={24} />}
            color="primary"
          />
          <KPICard
            title="Paid Leave Balance"
            value={leaveBalance.paid}
            change="days remaining"
            icon={<Calendar size={24} />}
            color="success"
          />
          <KPICard
            title="Sick Leave Balance"
            value={leaveBalance.sick}
            change="days remaining"
            icon={<TrendingUp size={24} />}
            color="warning"
          />
          <KPICard
            title="Pending Leaves"
            value={stats?.pendingLeaves || 0}
            icon={<FileText size={24} />}
            color="info"
          />
        </div>

        {/* Quick Actions */}
        <div className="quick-actions-section">
          <h2 className="section-title">Quick Actions</h2>
          <div className="quick-actions-grid">
            <Link to="/profile" className="action-card">
              <div className="action-icon">
                <User size={28} />
              </div>
              <div className="action-content">
                <h3>My Profile</h3>
                <p>View and edit your profile information</p>
              </div>
              <ArrowRight size={20} className="action-arrow" />
            </Link>

            <Link to="/attendance" className="action-card">
              <div className="action-icon">
                <ClockIcon size={28} />
              </div>
              <div className="action-content">
                <h3>Attendance</h3>
                <p>Check in/out and view attendance records</p>
              </div>
              <ArrowRight size={20} className="action-arrow" />
            </Link>

            <Link to="/leaves" className="action-card">
              <div className="action-icon">
                <Calendar size={28} />
              </div>
              <div className="action-content">
                <h3>Leave Requests</h3>
                <p>Apply for leave and track your requests</p>
              </div>
              <ArrowRight size={20} className="action-arrow" />
            </Link>

            <Link to="/payroll" className="action-card">
              <div className="action-icon">
                <FileText size={28} />
              </div>
              <div className="action-content">
                <h3>Payroll</h3>
                <p>View salary details and download payslips</p>
              </div>
              <ArrowRight size={20} className="action-arrow" />
            </Link>
          </div>
        </div>

        {/* Recent Activity Timeline */}
        {stats?.recentLeaves && stats.recentLeaves.length > 0 && (
          <div className="activity-section">
            <h2 className="section-title">Recent Activity</h2>
            <div className="activity-timeline">
              {stats.recentLeaves.slice(0, 5).map((leave, index) => (
                <div key={leave._id} className="timeline-item">
                  <div className="timeline-marker">
                    <div className={`marker-dot marker-${leave.status.toLowerCase()}`}></div>
                    {index < stats.recentLeaves.length - 1 && <div className="timeline-line"></div>}
                  </div>
                  <div className="timeline-content">
                  <div className="timeline-header">
                    <h4>{leave.leaveType} Leave Request</h4>
                    <span className={`badge badge-${leave.status.toLowerCase()}`}>
                      {leave.status === 'Approved' && <CheckCircle2 size={12} />}
                      {leave.status === 'Rejected' && <XCircle size={12} />}
                      {leave.status === 'Pending' && <ClockIcon size={12} />}
                      {leave.status}
                    </span>
                  </div>
                    <p className="timeline-date">
                      {new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                    {leave.remarks && (
                      <p className="timeline-remarks">{leave.remarks}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming Leaves */}
        {stats?.upcomingLeaves && stats.upcomingLeaves.length > 0 && (
          <div className="upcoming-section">
            <h2 className="section-title">Upcoming Leaves</h2>
            <div className="upcoming-cards">
              {stats.upcomingLeaves.map((leave) => (
                <div key={leave._id} className="upcoming-card">
                  <div className="upcoming-date">
                    <div className="date-day">{new Date(leave.startDate).getDate()}</div>
                    <div className="date-month">{new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short' })}</div>
                  </div>
                  <div className="upcoming-info">
                    <h4>{leave.leaveType}</h4>
                    <p>{new Date(leave.startDate).toLocaleDateString()} - {new Date(leave.endDate).toLocaleDateString()}</p>
                    <span className={`badge badge-${leave.status.toLowerCase()}`}>
                      {leave.status}
                    </span>
                  </div>
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
