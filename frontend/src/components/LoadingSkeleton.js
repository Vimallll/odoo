import React from 'react';
import './LoadingSkeleton.css';

export const CardSkeleton = () => (
  <div className="skeleton-card">
    <div className="skeleton-line skeleton-title"></div>
    <div className="skeleton-line skeleton-text"></div>
    <div className="skeleton-line skeleton-text-short"></div>
  </div>
);

export const TableSkeleton = ({ rows = 5 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {[...Array(5)].map((_, i) => (
        <div key={i} className="skeleton-line skeleton-header"></div>
      ))}
    </div>
    {[...Array(rows)].map((_, i) => (
      <div key={i} className="skeleton-table-row">
        {[...Array(5)].map((_, j) => (
          <div key={j} className="skeleton-line skeleton-cell"></div>
        ))}
      </div>
    ))}
  </div>
);

export const KPICardSkeleton = () => (
  <div className="skeleton-kpi">
    <div className="skeleton-line skeleton-icon"></div>
    <div className="skeleton-line skeleton-value"></div>
    <div className="skeleton-line skeleton-label"></div>
  </div>
);

export default { CardSkeleton, TableSkeleton, KPICardSkeleton };

