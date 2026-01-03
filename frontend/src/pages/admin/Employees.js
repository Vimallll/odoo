import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import EmployeeStatus from '../../components/EmployeeStatus';
import './Admin.css';

const Employees = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setFormData({
      profile: {
        firstName: employee.profile?.firstName || '',
        lastName: employee.profile?.lastName || '',
        phone: employee.profile?.phone || '',
        address: employee.profile?.address || '',
        department: employee.profile?.department || '',
        position: employee.profile?.position || ''
      },
      salary: {
        baseSalary: employee.salary?.baseSalary || 0,
        allowances: employee.salary?.allowances || 0,
        deductions: employee.salary?.deductions || 0
      }
    });
    setEditing(true);
  };

  const handleChange = (e) => {
    const [section, field] = e.target.name.split('.');
    setFormData({
      ...formData,
      [section]: {
        ...formData[section],
        [field]: e.target.value
      }
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/employees/${selectedEmployee._id}`, formData);
      setMessage('Employee updated successfully');
      setEditing(false);
      fetchEmployees();
    } catch (error) {
      setMessage('Error updating employee');
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
        <h1>Employee Management</h1>

        {message && <div className="message">{message}</div>}

        {editing && selectedEmployee && (
          <div className="edit-form-card">
            <h2>Edit Employee: {selectedEmployee.employeeId}</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-section">
                <h3>Profile Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>First Name</label>
                    <input
                      type="text"
                      name="profile.firstName"
                      value={formData.profile?.firstName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Last Name</label>
                    <input
                      type="text"
                      name="profile.lastName"
                      value={formData.profile?.lastName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Phone</label>
                    <input
                      type="text"
                      name="profile.phone"
                      value={formData.profile?.phone}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Department</label>
                    <input
                      type="text"
                      name="profile.department"
                      value={formData.profile?.department}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Position</label>
                    <input
                      type="text"
                      name="profile.position"
                      value={formData.profile?.position}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="form-section">
                <h3>Salary Information</h3>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Base Salary</label>
                    <input
                      type="number"
                      name="salary.baseSalary"
                      value={formData.salary?.baseSalary}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Allowances</label>
                    <input
                      type="number"
                      name="salary.allowances"
                      value={formData.salary?.allowances}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="form-group">
                    <label>Deductions</label>
                    <input
                      type="number"
                      name="salary.deductions"
                      value={formData.salary?.deductions}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="btn-primary">Save Changes</button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="employees-table">
          <table>
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Status</th>
                <th>Email</th>
                <th>Department</th>
                <th>Position</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">No employees found</td>
                </tr>
              ) : (
                employees.map((employee) => (
                  <tr key={employee._id}>
                    <td>{employee.employeeId}</td>
                    <td>
                      {employee.profile?.firstName} {employee.profile?.lastName}
                    </td>
                    <td>
                      <EmployeeStatus employeeId={employee._id} size="small" />
                    </td>
                    <td>{employee.email}</td>
                    <td>{employee.profile?.department || '-'}</td>
                    <td>{employee.profile?.position || '-'}</td>
                    <td>
                      <button
                        onClick={() => handleEdit(employee)}
                        className="btn-edit"
                      >
                        Edit
                      </button>
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

export default Employees;

