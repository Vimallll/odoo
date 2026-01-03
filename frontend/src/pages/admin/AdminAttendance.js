import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import './Admin.css';

const AdminAttendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState('daily'); // 'daily', 'weekly', or 'monthly'
  const [selectedDate, setSelectedDate] = useState(new Date()); // Current date for admin view
  const [selectedWeek, setSelectedWeek] = useState(''); // Week selector (YYYY-WW format)
  const [selectedMonth, setSelectedMonth] = useState(''); // Month selector (YYYY-MM format)
  const [filters, setFilters] = useState({
    employeeId: '', // Empty by default to show all users in daily view
    startDate: new Date().toISOString().split('T')[0], // Default to today
    endDate: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchEmployees();
    // Set default to today for daily view showing all employees
    const today = new Date().toISOString().split('T')[0];
    const defaultFilters = {
      employeeId: '', // Empty to show all employees
      startDate: today,
      endDate: today
    };
    setFilters(defaultFilters);
    
    // Fetch attendance with default filters
    const fetchWithDefaults = async () => {
      try {
        setLoading(true);
        const params = new URLSearchParams();
        params.append('startDate', defaultFilters.startDate);
        params.append('endDate', defaultFilters.endDate);
        const response = await api.get(`/attendance?${params.toString()}`);
        setAttendance(response.data || []);
      } catch (error) {
        console.error('Error fetching attendance:', error);
        setAttendance([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWithDefaults();
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
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.employeeId) params.append('employeeId', filters.employeeId);
      params.append('startDate', filters.startDate);
      params.append('endDate', filters.endDate);

      console.log('Fetching attendance with params:', params.toString());
      const response = await api.get(`/attendance?${params.toString()}`);
      console.log('Attendance data received:', response.data);
      setAttendance(response.data || []);
    } catch (error) {
      console.error('Error fetching attendance:', error);
      console.error('Error details:', error.response?.data);
      setAttendance([]);
    } finally {
      setLoading(false);
    }
  };


  const formatHours = (hours) => {
    if (!hours && hours !== 0) return '-';
    const h = Math.floor(hours);
    const m = Math.floor((hours - h) * 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  // Navigate dates
  const navigateDate = (direction) => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
    const dateStr = newDate.toISOString().split('T')[0];
    setFilters({
      ...filters,
      startDate: dateStr,
      endDate: dateStr
    });
    fetchAttendance();
  };

  // Format date as "22, October 2025"
  const formatDisplayDate = (date) => {
    const d = new Date(date);
    const day = d.getDate();
    const month = d.toLocaleString('default', { month: 'long' });
    const year = d.getFullYear();
    return `${day}, ${month} ${year}`;
  };

  // Get start and end of week for a given date (Sunday to Saturday)
  const getWeekRange = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay(); // 0 = Sunday, 6 = Saturday
    const diff = d.getDate() - day; // Get Sunday of the week
    const weekStart = new Date(d);
    weekStart.setDate(diff);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6); // Saturday (7 days total: 0-6)
    return { weekStart, weekEnd };
  };

  // Get week number for a date
  const getWeekNumber = (date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
  };

  // Handle view type change
  const handleViewTypeChange = (type) => {
    setViewType(type);
    if (type === 'daily') {
      // Reset to today for daily view
      const today = new Date().toISOString().split('T')[0];
      setSelectedDate(new Date());
      setFilters({
        employeeId: '', // Clear employee filter for daily view
        startDate: today,
        endDate: today
      });
      setSelectedWeek('');
      setSelectedMonth('');
    } else if (type === 'weekly') {
      // Set to current week
      const today = new Date();
      const { weekStart, weekEnd } = getWeekRange(today);
      const weekNum = getWeekNumber(weekStart);
      setSelectedWeek(`${weekStart.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`);
      setFilters({
        ...filters,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      });
      setSelectedMonth('');
    } else if (type === 'monthly') {
      // Set to current month
      const today = new Date();
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      setSelectedMonth(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`);
      setFilters({
        ...filters,
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0]
      });
      setSelectedWeek('');
    }
  };

  // Handle week selector change
  const handleWeekChange = async (e) => {
    const weekValue = e.target.value;
    setSelectedWeek(weekValue);
    
    if (weekValue) {
      const [year, week] = weekValue.split('-W').map(Number);
      // Calculate the date for the first day of that week
      const jan4 = new Date(year, 0, 4);
      const jan4Day = jan4.getDay() || 7;
      const weekStart = new Date(year, 0, 4 + (week - 1) * 7 - jan4Day + 1);
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);
      
      const newFilters = {
        ...filters,
        startDate: weekStart.toISOString().split('T')[0],
        endDate: weekEnd.toISOString().split('T')[0]
      };
      setFilters(newFilters);
      await fetchAttendance();
    }
  };

  // Handle month selector change
  const handleMonthChange = async (e) => {
    const monthValue = e.target.value;
    setSelectedMonth(monthValue);
    
    if (monthValue) {
      const [year, month] = monthValue.split('-').map(Number);
      const monthStart = new Date(year, month - 1, 1);
      const monthEnd = new Date(year, month, 0); // Last day of the month
      
      const newFilters = {
        ...filters,
        startDate: monthStart.toISOString().split('T')[0],
        endDate: monthEnd.toISOString().split('T')[0]
      };
      setFilters(newFilters);
      await fetchAttendance();
    }
  };

  // Generate weekly/monthly view data - show all days for selected employee
  const getWeeklyMonthlyViewData = () => {
    if (viewType === 'daily' || !filters.startDate) return attendance;
    
    // For weekly/monthly view, employee selection is required
    if (!filters.employeeId) {
      return [];
    }
    
    const startDate = new Date(filters.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(filters.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Get all days in the range
    const days = [];
    const currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    // Get selected employee
    const selectedEmployee = employees.find(e => e._id === filters.employeeId);
    if (!selectedEmployee) return [];
    
    const viewData = [];
    const empId = selectedEmployee._id;
    
    days.forEach(day => {
      const dayStr = day.toISOString().split('T')[0];
      const record = attendance.find(a => {
        const recordDate = new Date(a.date).toISOString().split('T')[0];
        const recordEmpId = a.employeeId?._id || a.employeeId;
        return recordDate === dayStr && recordEmpId === empId;
      });
      
      if (record) {
        viewData.push(record);
      } else {
        // Create placeholder for missing day
        viewData.push({
          _id: `placeholder-${empId}-${dayStr}`,
          employeeId: selectedEmployee,
          date: day,
          status: 'Absent',
          checkIn: { time: null },
          checkOut: { time: null },
          workingHours: 0,
          overtime: false,
          overtimeHours: 0,
          isPlaceholder: true
        });
      }
    });
    
    // Sort by date
    viewData.sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return viewData;
  };

  // Filter attendance by search query (only for daily view)
  const filteredAttendance = viewType === 'daily' 
    ? attendance.filter(record => {
        if (!searchQuery) return true;
        const empName = `${record.employeeId?.profile?.firstName || ''} ${record.employeeId?.profile?.lastName || ''}`.toLowerCase();
        const empId = record.employeeId?.employeeId || '';
        return empName.includes(searchQuery.toLowerCase()) || empId.toLowerCase().includes(searchQuery.toLowerCase());
      })
    : getWeeklyMonthlyViewData();


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
          <div>
            <h1>Attendance Management</h1>
            <p className="subtitle">View and manage employee attendance records</p>
          </div>
        </div>

        {/* View Type Buttons */}
        <div className="quick-filters">
          <button 
            onClick={() => handleViewTypeChange('daily')} 
            className={`quick-filter-btn ${viewType === 'daily' ? 'active' : ''}`}
          >
            Daily View
          </button>
          <button 
            onClick={() => handleViewTypeChange('weekly')} 
            className={`quick-filter-btn ${viewType === 'weekly' ? 'active' : ''}`}
          >
            Weekly View
          </button>
          <button 
            onClick={() => handleViewTypeChange('monthly')} 
            className={`quick-filter-btn ${viewType === 'monthly' ? 'active' : ''}`}
          >
            Monthly View
          </button>
        </div>

        {/* Header with Search and Date Navigation */}
        <div className="attendance-header-controls">
          <h2 style={{ margin: 0 }}>Attendance</h2>
          <div className="header-controls-right">
            {viewType === 'daily' && (
              <input
                type="text"
                placeholder="Search employees..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="search-input"
              />
            )}
            {viewType === 'daily' && (
              <div className="date-navigation">
                <button onClick={() => navigateDate('prev')} className="nav-arrow-btn">←</button>
                <button onClick={() => navigateDate('next')} className="nav-arrow-btn">→</button>
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    setSelectedDate(newDate);
                    const dateStr = newDate.toISOString().split('T')[0];
                    setFilters({
                      ...filters,
                      startDate: dateStr,
                      endDate: dateStr
                    });
                    fetchAttendance();
                  }}
                  className="date-input"
                />
                <button className="day-view-btn">Day</button>
              </div>
            )}
            {viewType === 'weekly' && (
              <div className="week-selector-group">
                <label>Select Week:</label>
                <input
                  type="week"
                  value={selectedWeek}
                  onChange={handleWeekChange}
                  className="week-input"
                />
              </div>
            )}
            {viewType === 'monthly' && (
              <div className="week-selector-group">
                <label>Select Month:</label>
                <input
                  type="month"
                  value={selectedMonth}
                  onChange={handleMonthChange}
                  className="week-input"
                />
              </div>
            )}
          </div>
        </div>

        {/* Employee Selection for Weekly/Monthly View */}
        {(viewType === 'weekly' || viewType === 'monthly') && (
          <div className="filter-group" style={{ marginBottom: '20px' }}>
            <label>
              Employee <span className="required">*</span>
            </label>
            <select 
              name="employeeId" 
              value={filters.employeeId} 
              onChange={(e) => {
                setFilters({ ...filters, employeeId: e.target.value });
                setTimeout(() => fetchAttendance(), 100);
              }}
              required
              className={!filters.employeeId ? 'required-field' : ''}
            >
              <option value="">Select Employee...</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.employeeId} - {emp.profile?.firstName} {emp.profile?.lastName}
                </option>
              ))}
            </select>
            {!filters.employeeId && (
              <p className="field-hint">⚠️ Please select an employee to view {viewType === 'weekly' ? 'weekly' : 'monthly'} attendance</p>
            )}
          </div>
        )}
        
        {/* Current Date Display */}
        <div className="current-date-display">
          {viewType === 'daily' 
            ? formatDisplayDate(selectedDate)
            : viewType === 'weekly'
            ? `Week: ${filters.startDate ? new Date(filters.startDate).toLocaleDateString() : ''} - ${filters.endDate ? new Date(filters.endDate).toLocaleDateString() : ''}`
            : filters.startDate 
            ? `${new Date(filters.startDate).toLocaleDateString('default', { month: 'long', year: 'numeric' })}`
            : 'Select month'
          }
        </div>


        <div className="data-table">
          <table>
            <thead>
              <tr>
                {viewType === 'daily' ? (
                  <>
                    <th>Emp</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Hours</th>
                    <th>Extra hours</th>
                  </>
                ) : (
                  <>
                    <th>Date</th>
                    <th>Check In</th>
                    <th>Check Out</th>
                    <th>Work Hours</th>
                    <th>Extra hours</th>
                    <th>Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {(viewType === 'weekly' || viewType === 'monthly') && !filters.employeeId ? (
                <tr>
                  <td colSpan="6" className="no-data">
                    <div style={{ padding: '20px', textAlign: 'center' }}>
                      <p style={{ fontSize: '16px', fontWeight: '600', color: '#ff6b35', marginBottom: '10px' }}>
                        ⚠️ Employee Selection Required
                      </p>
                      <p style={{ color: '#666' }}>
                        Please select an employee from the dropdown above to view {viewType === 'weekly' ? 'weekly' : 'monthly'} attendance records.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : filteredAttendance.length === 0 ? (
                <tr>
                  <td colSpan={viewType === 'daily' ? 5 : 6} className="no-data">
                    No attendance records found
                    {viewType === 'daily' && ` for ${formatDisplayDate(selectedDate)}`}
                    {viewType === 'weekly' && ' for the selected week'}
                    {viewType === 'monthly' && ' for the selected month'}
                  </td>
                </tr>
              ) : (
                filteredAttendance.map((record) => (
                  <tr key={record._id} className={record.isPlaceholder ? 'placeholder-row' : ''}>
                    {viewType === 'daily' ? (
                      <>
                        <td>
                          <div className="employee-cell">
                            <strong>{record.employeeId?.employeeId || 'N/A'}</strong>
                            <span className="employee-name">
                              {record.employeeId?.profile?.firstName || ''} {record.employeeId?.profile?.lastName || ''}
                            </span>
                          </div>
                        </td>
                        <td>
                          {record.checkIn?.time
                            ? new Date(record.checkIn.time).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              })
                            : '-'}
                        </td>
                        <td>
                          {record.checkOut?.time
                            ? new Date(record.checkOut.time).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              })
                            : '-'}
                        </td>
                        <td>
                          {record.workingHours ? formatHours(record.workingHours) : '-'}
                        </td>
                        <td>
                          {record.overtime && record.overtimeHours > 0 ? (
                            formatHours(record.overtimeHours)
                          ) : '-'}
                        </td>
                      </>
                    ) : (
                      <>
                        <td>
                          {new Date(record.date).toLocaleDateString('en-US', { 
                            weekday: 'short', 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </td>
                        <td>
                          {record.checkIn?.time
                            ? new Date(record.checkIn.time).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              })
                            : '-'}
                        </td>
                        <td>
                          {record.checkOut?.time
                            ? new Date(record.checkOut.time).toLocaleTimeString('en-US', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                hour12: false
                              })
                            : '-'}
                        </td>
                        <td>
                          {record.workingHours ? formatHours(record.workingHours) : '-'}
                        </td>
                        <td>
                          {record.overtime && record.overtimeHours > 0 ? (
                            formatHours(record.overtimeHours)
                          ) : '-'}
                        </td>
                        <td>
                          <span className={`status-badge status-${record.status?.toLowerCase().replace('-', '') || 'absent'}`}>
                            {record.status || 'Absent'}
                          </span>
                        </td>
                      </>
                    )}
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

