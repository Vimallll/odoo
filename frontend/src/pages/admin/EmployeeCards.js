import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import EmployeeStatus from '../../components/EmployeeStatus';
import './EmployeeCards.css';

const EmployeeCards = () => {
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    department: '',
    designation: '',
    status: 'Active'
  });
  const [sortBy, setSortBy] = useState('name-asc');
  const [showJobDetailsModal, setShowJobDetailsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [jobDetailsForm, setJobDetailsForm] = useState({
    department: '',
    position: '',
    joiningDate: ''
  });
  const [message, setMessage] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    applyFiltersAndSort();
  }, [employees, searchTerm, filters, sortBy]);

  const fetchEmployees = async () => {
    try {
      const response = await api.get('/employees');
      console.log('📥 Fetched employees:', response.data.length);
      console.log('📧 Sample employee email:', response.data[0]?.email);
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = () => {
    let filtered = [...employees];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(emp => 
        emp.profile?.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.profile?.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeId?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Department filter
    if (filters.department) {
      filtered = filtered.filter(emp => emp.profile?.department === filters.department);
    }

    // Designation filter
    if (filters.designation) {
      filtered = filtered.filter(emp => emp.profile?.position === filters.designation);
    }

    // Status filter
    if (filters.status) {
      filtered = filtered.filter(emp => 
        filters.status === 'Active' ? emp.isActive : !emp.isActive
      );
    }

    // Sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name-asc':
          return (a.profile?.firstName || '').localeCompare(b.profile?.firstName || '');
        case 'name-desc':
          return (b.profile?.firstName || '').localeCompare(a.profile?.firstName || '');
        case 'id-asc':
          return (a.employeeId || '').localeCompare(b.employeeId || '');
        case 'id-desc':
          return (b.employeeId || '').localeCompare(a.employeeId || '');
        case 'dept-asc':
          return (a.profile?.department || '').localeCompare(b.profile?.department || '');
        case 'join-newest':
          return new Date(b.profile?.joiningDate || 0) - new Date(a.profile?.joiningDate || 0);
        case 'join-oldest':
          return new Date(a.profile?.joiningDate || 0) - new Date(b.profile?.joiningDate || 0);
        default:
          return 0;
      }
    });

    setFilteredEmployees(filtered);
  };

  const getDepartments = () => {
    const depts = [...new Set(employees.map(emp => emp.profile?.department).filter(Boolean))];
    return depts.sort();
  };

  const getDesignations = () => {
    const desigs = [...new Set(employees.map(emp => emp.profile?.position).filter(Boolean))];
    return desigs.sort();
  };

  const handleViewEmployee = (employeeId) => {
    navigate(`/admin/employees/${employeeId}`);
  };

  const handleOpenJobDetails = (employee) => {
    setSelectedEmployee(employee);
    setJobDetailsForm({
      department: employee.profile?.department || '',
      position: employee.profile?.position || '',
      joiningDate: employee.profile?.joiningDate 
        ? new Date(employee.profile.joiningDate).toISOString().split('T')[0] 
        : ''
    });
    setShowJobDetailsModal(true);
    setMessage('');
  };

  const handleCloseJobDetails = () => {
    setShowJobDetailsModal(false);
    setSelectedEmployee(null);
    setJobDetailsForm({
      department: '',
      position: '',
      joiningDate: ''
    });
    setMessage('');
  };

  const handleJobDetailsChange = (e) => {
    const { name, value } = e.target;
    setJobDetailsForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveJobDetails = async (e) => {
    e.preventDefault();
    setMessage('');
    
    try {
      const updateData = {
        profile: {
          department: jobDetailsForm.department || '',
          position: jobDetailsForm.position || '',
          joiningDate: jobDetailsForm.joiningDate || null
        }
      };

      await api.put(`/employees/${selectedEmployee._id}`, updateData);
      
      setMessage('Job details updated successfully!');
      
      // Refresh employee list
      await fetchEmployees();
      
      // Close modal after 1.5 seconds
      setTimeout(() => {
        handleCloseJobDetails();
      }, 1500);
    } catch (error) {
      console.error('Error updating job details:', error);
      setMessage(error.response?.data?.error || 'Error updating job details. Please try again.');
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
      <div className="employee-cards-page">
        <div className="page-header">
          <h1>Employee Information</h1>
        </div>

        <div className="filters-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name or employee ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="filters-row">
            <div className="filter-group">
              <label>Department</label>
              <select
                value={filters.department}
                onChange={(e) => setFilters({ ...filters, department: e.target.value })}
              >
                <option value="">All Departments</option>
                {getDepartments().map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Designation</label>
              <select
                value={filters.designation}
                onChange={(e) => setFilters({ ...filters, designation: e.target.value })}
              >
                <option value="">All Designations</option>
                {getDesignations().map(desig => (
                  <option key={desig} value={desig}>{desig}</option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label>Status</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Sort By</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="name-asc">Name (A-Z)</option>
                <option value="name-desc">Name (Z-A)</option>
                <option value="id-asc">Employee ID (Ascending)</option>
                <option value="id-desc">Employee ID (Descending)</option>
                <option value="dept-asc">Department (A-Z)</option>
                <option value="join-newest">Date of Joining (Newest)</option>
                <option value="join-oldest">Date of Joining (Oldest)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="employee-cards-grid">
          {filteredEmployees.length === 0 ? (
            <div className="no-employees">No employees found</div>
          ) : (
            filteredEmployees.map((employee) => (
              <div key={employee._id} className="employee-card">
                <div className="card-header">
                  <div className="employee-avatar">
                    {employee.profile?.profilePicture ? (
                      <img src={employee.profile.profilePicture} alt={employee.profile.firstName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {employee.profile?.firstName?.[0] || employee.email?.[0] || 'E'}
                      </div>
                    )}
                  </div>
                  <div className="employee-status">
                    <EmployeeStatus employeeId={employee._id} size="small" />
                  </div>
                </div>
                <div className="card-body">
                  <h3>{employee.profile?.firstName || ''} {employee.profile?.lastName || ''}</h3>
                  <p className="employee-id">ID: {employee.employeeId}</p>
                  <p className="employee-email">{employee.email || 'No email'}</p>
                  <p className="employee-dept">{employee.profile?.department || 'Not assigned'}</p>
                  <p className="employee-designation">{employee.profile?.position || 'Not assigned'}</p>
                  {employee.profile?.joiningDate && (
                    <p className="employee-joining-date">
                      Joined: {new Date(employee.profile.joiningDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </p>
                  )}
                </div>
                <div className="card-footer">
                  <button
                    onClick={() => handleViewEmployee(employee._id)}
                    className="btn-view"
                  >
                    View
                  </button>
                  <button
                    onClick={() => handleOpenJobDetails(employee)}
                    className="btn-job-details"
                    title="Edit Job Details"
                  >
                    Job Details
                  </button>
                  <button
                    onClick={() => navigate(`/admin/attendance?employeeId=${employee._id}`)}
                    className="btn-secondary"
                  >
                    Attendance
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="results-count">
          Showing {filteredEmployees.length} of {employees.length} employees
        </div>

        {/* Job Details Modal */}
        {showJobDetailsModal && selectedEmployee && (
          <div className="modal-overlay" onClick={handleCloseJobDetails}>
            <div className="modal-content job-details-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2>Job Details - {selectedEmployee.profile?.firstName} {selectedEmployee.profile?.lastName}</h2>
                <button className="modal-close" onClick={handleCloseJobDetails}>×</button>
              </div>
              <form onSubmit={handleSaveJobDetails}>
                <div className="modal-body">
                  {message && (
                    <div className={`message ${message.includes('success') ? 'success' : 'error'}`}>
                      {message}
                    </div>
                  )}
                  <div className="form-group">
                    <label>Department *</label>
                    <input
                      type="text"
                      name="department"
                      value={jobDetailsForm.department}
                      onChange={handleJobDetailsChange}
                      placeholder="Enter department"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Position/Designation *</label>
                    <input
                      type="text"
                      name="position"
                      value={jobDetailsForm.position}
                      onChange={handleJobDetailsChange}
                      placeholder="Enter position"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Date of Joining *</label>
                    <input
                      type="date"
                      name="joiningDate"
                      value={jobDetailsForm.joiningDate}
                      onChange={handleJobDetailsChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Employee ID</label>
                    <input
                      type="text"
                      value={selectedEmployee.employeeId || ''}
                      disabled
                      className="disabled-input"
                    />
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="button" onClick={handleCloseJobDetails} className="btn-cancel">
                    Cancel
                  </button>
                  <button type="submit" className="btn-save">
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default EmployeeCards;

