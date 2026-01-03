import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import './Admin.css';

const AdminPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    employeeId: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    baseSalary: 0,
    allowances: 0,
    deductions: 0,
    bonus: 0,
    overtime: 0,
    tax: 0
  });
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEmployees();
    fetchPayroll();
  }, [filters]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchPayroll = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.month) params.append('month', filters.month);
      if (filters.year) params.append('year', filters.year);

      const response = await api.get(`/payroll?${params.toString()}`);
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/payroll', formData);
      setMessage('Payroll created/updated successfully');
      setShowForm(false);
      fetchPayroll();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error creating payroll');
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
      <div className="admin-page">
        <div className="page-header">
          <h1>Payroll Management</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Create Payroll'}
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        {showForm && (
          <div className="form-card">
            <h2>Create/Update Payroll</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Employee</label>
                  <select name="employeeId" value={formData.employeeId} onChange={handleChange} required>
                    <option value="">Select Employee</option>
                    {employees.map((emp) => (
                      <option key={emp._id} value={emp._id}>
                        {emp.employeeId} - {emp.profile?.firstName} {emp.profile?.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Month</label>
                  <select name="month" value={formData.month} onChange={handleChange} required>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                      <option key={month} value={month}>
                        {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Year</label>
                  <input
                    type="number"
                    name="year"
                    value={formData.year}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Base Salary</label>
                  <input
                    type="number"
                    name="baseSalary"
                    value={formData.baseSalary}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Allowances</label>
                  <input
                    type="number"
                    name="allowances"
                    value={formData.allowances}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Deductions</label>
                  <input
                    type="number"
                    name="deductions"
                    value={formData.deductions}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Bonus</label>
                  <input
                    type="number"
                    name="bonus"
                    value={formData.bonus}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Overtime</label>
                  <input
                    type="number"
                    name="overtime"
                    value={formData.overtime}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label>Tax</label>
                  <input
                    type="number"
                    name="tax"
                    value={formData.tax}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <button type="submit" className="btn-primary">Create/Update Payroll</button>
            </form>
          </div>
        )}

        <div className="filters">
          <div className="filter-group">
            <label>Month</label>
            <select name="month" value={filters.month} onChange={handleFilterChange}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Year</label>
            <select name="year" value={filters.year} onChange={handleFilterChange}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="data-table">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Month/Year</th>
                <th>Base Salary</th>
                <th>Allowances</th>
                <th>Deductions</th>
                <th>Net Salary</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {payrolls.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No payroll records found</td>
                </tr>
              ) : (
                payrolls.map((payroll) => (
                  <tr key={payroll._id}>
                    <td>
                      {payroll.employeeId?.profile?.firstName} {payroll.employeeId?.profile?.lastName}
                    </td>
                    <td>
                      {new Date(2000, payroll.month - 1).toLocaleString('default', { month: 'long' })}{' '}
                      {payroll.year}
                    </td>
                    <td>${payroll.baseSalary.toLocaleString()}</td>
                    <td>${payroll.allowances.toLocaleString()}</td>
                    <td>${payroll.deductions.toLocaleString()}</td>
                    <td>${payroll.netSalary.toLocaleString()}</td>
                    <td>
                      <span className={`status-badge status-${payroll.status.toLowerCase()}`}>
                        {payroll.status}
                      </span>
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

export default AdminPayroll;

