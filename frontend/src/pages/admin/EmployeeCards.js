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
                  <p className="employee-dept">{employee.profile?.department || 'Not assigned'}</p>
                  <p className="employee-designation">{employee.profile?.position || 'Not assigned'}</p>
                </div>
                <div className="card-footer">
                  <button
                    onClick={() => handleViewEmployee(employee._id)}
                    className="btn-view"
                  >
                    View
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
      </div>
    </Layout>
  );
};

export default EmployeeCards;

