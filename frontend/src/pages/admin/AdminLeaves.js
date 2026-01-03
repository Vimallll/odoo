import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import Layout from '../../components/Layout';
import './Admin.css';

const AdminLeaves = () => {
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [approvalData, setApprovalData] = useState({
    status: 'Approved',
    approvalComments: ''
  });

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

  const handleApproveReject = (leave) => {
    setSelectedLeave(leave);
    setApprovalData({
      status: leave.status === 'Pending' ? 'Approved' : leave.status,
      approvalComments: leave.approvalComments || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/leaves/${selectedLeave._id}/status`, approvalData);
      setShowModal(false);
      fetchLeaves();
    } catch (error) {
      console.error('Error updating leave:', error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="loading">Loading...</div>
      </Layout>
    );
  }

  const pendingLeaves = leaves.filter((l) => l.status === 'Pending');

  return (
    <Layout>
      <div className="admin-page">
        <h1>Leave Management</h1>
        <p className="subtitle">Pending Requests: {pendingLeaves.length}</p>

        {showModal && selectedLeave && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h2>Update Leave Status</h2>
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    name="status"
                    value={approvalData.status}
                    onChange={(e) =>
                      setApprovalData({ ...approvalData, status: e.target.value })
                    }
                  >
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Comments</label>
                  <textarea
                    name="approvalComments"
                    value={approvalData.approvalComments}
                    onChange={(e) =>
                      setApprovalData({ ...approvalData, approvalComments: e.target.value })
                    }
                    rows="4"
                  />
                </div>
                <div className="form-actions">
                  <button type="submit" className="btn-primary">
                    Update Status
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
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
                    <h3>
                      {leave.employeeId?.profile?.firstName} {leave.employeeId?.profile?.lastName}
                    </h3>
                    <p>{leave.leaveType} Leave</p>
                    <p>
                      {new Date(leave.startDate).toLocaleDateString()} -{' '}
                      {new Date(leave.endDate).toLocaleDateString()} ({leave.totalDays} days)
                    </p>
                  </div>
                  <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                    {leave.status}
                  </span>
                </div>
                {leave.remarks && (
                  <div className="leave-details">
                    <p><strong>Remarks:</strong> {leave.remarks}</p>
                  </div>
                )}
                {leave.status === 'Pending' && (
                  <div className="leave-actions">
                    <button
                      onClick={() => handleApproveReject(leave)}
                      className="btn-primary"
                    >
                      Approve/Reject
                    </button>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
};

export default AdminLeaves;

