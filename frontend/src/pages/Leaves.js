import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import './Leaves.css';

const Leaves = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const [formData, setFormData] = useState({
    leaveType: 'Paid',
    startDate: '',
    endDate: '',
    remarks: ''
  });
  const [message, setMessage] = useState('');
  const [minDate] = useState(getTomorrowDate());

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      const response = await api.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // If start date changes, update end date minimum
    if (name === 'startDate') {
      setFormData({ 
        ...formData, 
        [name]: value,
        // Reset end date if it's before new start date
        endDate: formData.endDate && formData.endDate < value ? '' : formData.endDate
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
    
    // Clear any previous messages
    if (message) setMessage('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    
    // Frontend validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(formData.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(formData.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    // Check if start date is today or in the past
    if (startDate <= today) {
      setMessage('Start date must be tomorrow or later. You cannot request leave for today or past dates.');
      return;
    }
    
    // Check if end date is before start date
    if (endDate < startDate) {
      setMessage('End date must be on or after start date.');
      return;
    }
    
    try {
      await api.post('/leaves', formData);
      setMessage('Leave application submitted successfully');
      setShowForm(false);
      setFormData({
        leaveType: 'Paid',
        startDate: '',
        endDate: '',
        remarks: ''
      });
      fetchLeaves();
    } catch (error) {
      setMessage(error.response?.data?.error || 'Error submitting leave request');
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
      <div className="leaves">
        <div className="leaves-header">
          <h1>Leave Requests</h1>
          <button onClick={() => setShowForm(!showForm)} className="btn-primary">
            {showForm ? 'Cancel' : 'Apply for Leave'}
          </button>
        </div>

        {message && <div className="message">{message}</div>}

        {showForm && (
          <div className="leave-form-card">
            <h2>Apply for Leave</h2>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Leave Type</label>
                <select name="leaveType" value={formData.leaveType} onChange={handleChange} required>
                  <option value="Paid">Paid</option>
                  <option value="Sick">Sick</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div className="form-group">
                <label>Start Date <span className="required-note">(Tomorrow or later)</span></label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  min={minDate}
                  required
                />
                <small className="form-hint">Leave requests can only be made for future dates</small>
              </div>
              <div className="form-group">
                <label>End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  min={formData.startDate || minDate}
                  required
                />
                <small className="form-hint">End date must be on or after start date</small>
              </div>
              <div className="form-group">
                <label>Remarks</label>
                <textarea
                  name="remarks"
                  value={formData.remarks}
                  onChange={handleChange}
                  rows="4"
                />
              </div>
              <button type="submit" className="btn-primary">Submit Request</button>
            </form>
          </div>
        )}

        <div className="leaves-list">
          {leaves.length === 0 ? (
            <div className="no-data">No leave requests found</div>
          ) : (
            leaves.map((leave) => (
              <div key={leave._id} className="leave-card">
                <div className="leave-header">
                  <div>
                    <h3>{leave.leaveType} Leave</h3>
                    <p>
                      {new Date(leave.startDate).toLocaleDateString()} -{' '}
                      {new Date(leave.endDate).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </span>
                </div>
                <div className="leave-details">
                  <p><strong>Total Days:</strong> {leave.totalDays}</p>
                  {leave.remarks && <p><strong>Remarks:</strong> {leave.remarks}</p>}
                  {leave.approvalComments && (
                    <p><strong>Admin Comments:</strong> {leave.approvalComments}</p>
                  )}
                  {leave.approvedBy && (
                    <p>
                      <strong>Approved by:</strong>{' '}
                      {leave.approvedBy.profile?.firstName} {leave.approvedBy.profile?.lastName}
                    </p>
                  )}
                  <p className="leave-date">
                    Applied on: {new Date(leave.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default Leaves;

