import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import './EmployeeStatus.css';

const EmployeeStatus = ({ employeeId, size = 'medium' }) => {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (employeeId) {
      fetchStatus();
      // Refresh status every 3 seconds for live/real-time updates
      const interval = setInterval(fetchStatus, 3000);
      return () => clearInterval(interval);
    }
  }, [employeeId]);

  const fetchStatus = async () => {
    try {
      const response = await api.get(`/employees/${employeeId}/status`);
      setStatus(response.data);
    } catch (error) {
      console.error('Error fetching employee status:', error);
      setStatus({ status: 'unknown', statusText: 'Unknown' });
    } finally {
      setLoading(false);
    }
  };

  if (loading || !status) {
    return <div className={`employee-status-indicator ${size} loading`}>...</div>;
  }

  const getStatusIcon = () => {
    switch (status.status) {
      case 'checked-in':
        return (
          <div className="status-icon checked-in">
            <div className="status-dot green"></div>
          </div>
        );
      case 'on-leave':
        return (
          <div className="status-icon on-leave">
            <span className="airplane-icon">✈</span>
          </div>
        );
      case 'absent':
        return (
          <div className="status-icon absent">
            <div className="status-dot yellow"></div>
          </div>
        );
      case 'checked-out':
        return (
          <div className="status-icon checked-out">
            <div className="status-dot blue"></div>
          </div>
        );
      default:
        return (
          <div className="status-icon unknown">
            <div className="status-dot gray"></div>
          </div>
        );
    }
  };

  return (
    <div className={`employee-status-indicator ${size} ${status.status}`} title={status.statusText}>
      {getStatusIcon()}
      {size === 'large' && <span className="status-text">{status.statusText}</span>}
    </div>
  );
};

export default EmployeeStatus;

