import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import './Admin.css';

const Reports = () => {
  const [attendanceReport, setAttendanceReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    try {
      const params = new URLSearchParams();
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);

      const response = await api.get(`/reports/attendance?${params.toString()}`);
      setAttendanceReport(response.data);
    } catch (error) {
      console.error('Error fetching report:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setLoading(true);
    fetchReport();
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
      <div className="admin-page">
        <h1>Reports & Analytics</h1>

        <div className="filters">
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="date"
              name="startDate"
              value={filters.startDate}
              onChange={handleFilterChange}
            />
          </div>
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="date"
              name="endDate"
              value={filters.endDate}
              onChange={handleFilterChange}
            />
          </div>
          <button onClick={handleSearch} className="btn-primary">
            Generate Report
          </button>
        </div>

        {attendanceReport && (
          <div className="report-summary">
            <h2>Attendance Summary</h2>
            <div className="summary-grid">
              <div className="summary-card">
                <h3>Total Days</h3>
                <p>{attendanceReport.totalDays}</p>
              </div>
              <div className="summary-card">
                <h3>Present</h3>
                <p className="positive">{attendanceReport.present}</p>
              </div>
              <div className="summary-card">
                <h3>Absent</h3>
                <p className="negative">{attendanceReport.absent}</p>
              </div>
              <div className="summary-card">
                <h3>Half Day</h3>
                <p>{attendanceReport.halfDay}</p>
              </div>
              <div className="summary-card">
                <h3>On Leave</h3>
                <p>{attendanceReport.onLeave}</p>
              </div>
              <div className="summary-card">
                <h3>Total Working Hours</h3>
                <p>{attendanceReport.totalWorkingHours.toFixed(2)}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Reports;

