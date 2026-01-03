import React from 'react';
import './KPICard.css';

const KPICard = ({ title, value, change, icon, trend, color = 'primary' }) => {
  return (
    <div className={`kpi-card kpi-card-${color}`}>
      <div className="kpi-header">
        <div className="kpi-icon">{icon}</div>
        <div className="kpi-title">{title}</div>
      </div>
      <div className="kpi-value">{value}</div>
      {change && (
        <div className={`kpi-change kpi-change-${trend || 'neutral'}`}>
          {trend === 'up' && '↑'} {trend === 'down' && '↓'} {change}
        </div>
      )}
    </div>
  );
};

export default KPICard;

