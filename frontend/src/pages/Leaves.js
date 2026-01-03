import React, { useState, useEffect, useContext } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import { AuthContext } from '../context/AuthContext';
import Modal from '../components/Modal';
import Toast from '../components/Toast';
import './Leaves.css';

const Leaves = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [toast, setToast] = useState(null);
  const [formStep, setFormStep] = useState(1);
  
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
  const [minDate] = useState(getTomorrowDate());

  useEffect(() => {
    fetchLeaves();
  }, []);

  const fetchLeaves = async () => {
    try {
      setLoading(true);
      const response = await api.get('/leaves');
      setLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leaves:', error);
      showToast('Error fetching leave requests', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => setToast(null), 3000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'startDate') {
      setFormData({ 
        ...formData, 
        [name]: value,
        endDate: formData.endDate && formData.endDate < value ? '' : formData.endDate
      });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const startDate = new Date(formData.startDate);
    startDate.setHours(0, 0, 0, 0);
    
    const endDate = new Date(formData.endDate);
    endDate.setHours(0, 0, 0, 0);
    
    if (startDate <= today) {
      showToast('Start date must be tomorrow or later', 'error');
      return;
    }
    
    if (endDate < startDate) {
      showToast('End date must be on or after start date', 'error');
      return;
    }
    
    try {
      await api.post('/leaves', formData);
      showToast('Leave application submitted successfully!', 'success');
      setShowForm(false);
      setFormStep(1);
      setFormData({
        leaveType: 'Paid',
        startDate: '',
        endDate: '',
        remarks: ''
      });
      fetchLeaves();
    } catch (error) {
      showToast(error.response?.data?.error || 'Error submitting leave request', 'error');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      Pending: 'warning',
      Approved: 'success',
      Rejected: 'error'
    };
    return colors[status] || 'info';
  };

  const getStatusIcon = (status) => {
    const icons = {
      Pending: '⏳',
      Approved: '✅',
      Rejected: '❌'
    };
    return icons[status] || '❓';
  };

  const calculateDays = () => {
    if (!formData.startDate || !formData.endDate) return 0;
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const sortedLeaves = [...leaves].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  return (
    <Layout>
      <div className="leaves-page">
        <div className="page-header">
          <div>
            <h1>Leave Management</h1>
            <p className="subtitle">Apply for leave and track your requests</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn btn-primary">
            <span className="btn-icon">+</span>
            Apply for Leave
          </button>
        </div>

        {/* Leave Request Modal */}
        <Modal
          isOpen={showForm}
          onClose={() => {
            setShowForm(false);
            setFormStep(1);
            setFormData({
              leaveType: 'Paid',
              startDate: '',
              endDate: '',
              remarks: ''
            });
          }}
          title="Apply for Leave"
          size="medium"
        >
          <form onSubmit={handleSubmit} className="leave-form">
            {/* Step Indicator */}
            <div className="form-steps">
              <div className={`step ${formStep >= 1 ? 'active' : ''} ${formStep > 1 ? 'completed' : ''}`}>
                <div className="step-number">1</div>
                <div className="step-label">Leave Type</div>
              </div>
              <div className={`step ${formStep >= 2 ? 'active' : ''} ${formStep > 2 ? 'completed' : ''}`}>
                <div className="step-number">2</div>
                <div className="step-label">Dates</div>
              </div>
              <div className={`step ${formStep >= 3 ? 'active' : ''}`}>
                <div className="step-number">3</div>
                <div className="step-label">Review</div>
              </div>
            </div>

            {/* Step 1: Leave Type */}
            {formStep === 1 && (
              <div className="form-step-content">
                <h3>Select Leave Type</h3>
                <div className="leave-type-options">
                  {['Paid', 'Sick', 'Unpaid'].map((type) => (
                    <label key={type} className={`leave-type-card ${formData.leaveType === type ? 'selected' : ''}`}>
                      <input
                        type="radio"
                        name="leaveType"
                        value={type}
                        checked={formData.leaveType === type}
                        onChange={handleChange}
                      />
                      <div className="card-content">
                        <div className="type-icon">
                          {type === 'Paid' ? '💰' : type === 'Sick' ? '🏥' : '📅'}
                        </div>
                        <div className="type-name">{type} Leave</div>
                      </div>
                    </label>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setFormStep(2)} className="btn btn-primary">
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Dates */}
            {formStep === 2 && (
              <div className="form-step-content">
                <h3>Select Date Range</h3>
                <div className="form-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    name="startDate"
                    value={formData.startDate}
                    onChange={handleChange}
                    min={minDate}
                    className="input"
                    required
                  />
                  <small className="form-hint">Leave can only be requested for tomorrow or future dates</small>
                </div>
                <div className="form-group">
                  <label>End Date</label>
                  <input
                    type="date"
                    name="endDate"
                    value={formData.endDate}
                    onChange={handleChange}
                    min={formData.startDate || minDate}
                    className="input"
                    required
                  />
                </div>
                {formData.startDate && formData.endDate && (
                  <div className="days-preview">
                    <span className="days-count">{calculateDays()}</span>
                    <span className="days-label">day(s)</span>
                  </div>
                )}
                <div className="form-actions">
                  <button type="button" onClick={() => setFormStep(1)} className="btn btn-secondary">
                    ← Back
                  </button>
                  <button type="button" onClick={() => setFormStep(3)} className="btn btn-primary">
                    Next →
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Review & Submit */}
            {formStep === 3 && (
              <div className="form-step-content">
                <h3>Review Your Request</h3>
                <div className="review-summary">
                  <div className="summary-item">
                    <label>Leave Type</label>
                    <div className="summary-value">
                      <span className={`badge badge-${formData.leaveType === 'Paid' ? 'success' : formData.leaveType === 'Sick' ? 'warning' : 'info'}`}>
                        {formData.leaveType} Leave
                      </span>
                    </div>
                  </div>
                  <div className="summary-item">
                    <label>Start Date</label>
                    <div className="summary-value">
                      {formData.startDate ? new Date(formData.startDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </div>
                  </div>
                  <div className="summary-item">
                    <label>End Date</label>
                    <div className="summary-value">
                      {formData.endDate ? new Date(formData.endDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                    </div>
                  </div>
                  <div className="summary-item">
                    <label>Total Days</label>
                    <div className="summary-value highlight">{calculateDays()} day(s)</div>
                  </div>
                  <div className="summary-item full-width">
                    <label>Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleChange}
                      placeholder="Add any additional remarks (optional)"
                      rows="4"
                      className="input"
                    />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" onClick={() => setFormStep(2)} className="btn btn-secondary">
                    ← Back
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Request
                  </button>
                </div>
              </div>
            )}
          </form>
        </Modal>

        {/* Leave Requests List */}
        <div className="leaves-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Loading leave requests...</p>
            </div>
          ) : sortedLeaves.length === 0 ? (
            <div className="empty-state-modern">
              <div className="empty-icon">🏖️</div>
              <h3>No Leave Requests</h3>
              <p>You haven't applied for any leave yet. Click "Apply for Leave" to get started.</p>
            </div>
          ) : (
            <div className="leaves-grid">
              {sortedLeaves.map((leave) => (
                <div key={leave._id} className="leave-card">
                  <div className="leave-card-header">
                    <div className="leave-type-badge">
                      <span className="type-icon">
                        {leave.leaveType === 'Paid' ? '💰' : leave.leaveType === 'Sick' ? '🏥' : '📅'}
                      </span>
                      <span className="type-text">{leave.leaveType} Leave</span>
                    </div>
                    <span className={`badge badge-${getStatusColor(leave.status)}`}>
                      {getStatusIcon(leave.status)} {leave.status}
                    </span>
                  </div>
                  <div className="leave-card-body">
                    <div className="leave-dates">
                      <div className="date-item">
                        <div className="date-label">From</div>
                        <div className="date-value">
                          {new Date(leave.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                      <div className="date-arrow">→</div>
                      <div className="date-item">
                        <div className="date-label">To</div>
                        <div className="date-value">
                          {new Date(leave.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    {leave.remarks && (
                      <div className="leave-remarks">
                        <div className="remarks-label">Remarks:</div>
                        <div className="remarks-text">{leave.remarks}</div>
                      </div>
                    )}
                    {leave.comments && (
                      <div className="leave-comments">
                        <div className="comments-label">HR Comments:</div>
                        <div className="comments-text">{leave.comments}</div>
                      </div>
                    )}
                  </div>
                  <div className="leave-card-footer">
                    <div className="leave-meta">
                      <span className="meta-item">
                        📅 Applied: {new Date(leave.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </Layout>
  );
};

export default Leaves;
