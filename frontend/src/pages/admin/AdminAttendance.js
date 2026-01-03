import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import './Admin.css';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    employeeId: '',
    startDate: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEmployees();
    fetchAttendance();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchAttendance = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);

      const response = await api.get(`/attendance?${params.toString()}`);
      setAttendance(response.data);
    } catch (error) {
      console.error('Error fetching attendance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSearch = () => {
    setLoading(true);
    fetchAttendance();
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
        <h1>Attendance Management</h1>

        <div className="filters">
          <div className="filter-group">
            <label>Employee</label>
            <select name="employeeId" value={filters.employeeId} onChange={handleFilterChange}>
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.employeeId} - {emp.profile?.firstName} {emp.profile?.lastName}
                </option>
              ))}
            </select>
          </div>
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
            Search
          </button>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
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
                  <td colSpan="6" className="no-data">No attendance records found</td>
                </tr>
              ) : (
                attendance.map((record) => (
                  <tr key={record._id}>
                    <td>
                      {record.employeeId?.profile?.firstName} {record.employeeId?.profile?.lastName}
                    </td>
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

export default AdminAttendance;

