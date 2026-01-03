import React, { useState, useEffect } from 'react';
import api from '../utils/api';
import Layout from '../components/Layout';
import './Payroll.css';

const Payroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear()
  });

  useEffect(() => {
    fetchPayroll();
  }, [filters]);

  const fetchPayroll = async () => {
    try {
      const response = await api.get(`/payroll?month=${filters.month}&year=${filters.year}`);
      setPayrolls(response.data);
    } catch (error) {
      console.error('Error fetching payroll:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
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
      <div className="payroll">
        <h1>Payroll & Salary</h1>

        <div className="payroll-filters">
          <div className="filter-group">
            <label>Month</label>
            <select name="month" value={filters.month} onChange={handleFilterChange}>
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {new Date(2000, month - 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          <div className="filter-group">
            <label>Year</label>
            <select name="year" value={filters.year} onChange={handleFilterChange}>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <option key={year} value={year}>
                  {year}
                </option>
              ))}
            </select>
          </div>
        </div>

        {payrolls.length === 0 ? (
          <div className="no-data">No payroll records found for the selected period</div>
        ) : (
          <div className="payroll-list">
            {payrolls.map((payroll) => (
              <div key={payroll._id} className="payroll-card">
                <div className="payroll-header">
                  <h3>
                    {new Date(2000, payroll.month - 1).toLocaleString('default', { month: 'long' })}{' '}
                    {payroll.year}
                  </h3>
                  <span className={`status-badge status-${payroll.status.toLowerCase()}`}>
                    {payroll.status}
                  </span>
                </div>
                <div className="payroll-details">
                  <div className="detail-row">
                    <span>Base Salary</span>
                    <span>${payroll.baseSalary.toLocaleString()}</span>
                  </div>
                  {payroll.allowances > 0 && (
                    <div className="detail-row">
                      <span>Allowances</span>
                      <span className="positive">+${payroll.allowances.toLocaleString()}</span>
                    </div>
                  )}
                  {payroll.bonus > 0 && (
                    <div className="detail-row">
                      <span>Bonus</span>
                      <span className="positive">+${payroll.bonus.toLocaleString()}</span>
                    </div>
                  )}
                  {payroll.overtime > 0 && (
                    <div className="detail-row">
                      <span>Overtime</span>
                      <span className="positive">+${payroll.overtime.toLocaleString()}</span>
                    </div>
                  )}
                  {payroll.deductions > 0 && (
                    <div className="detail-row">
                      <span>Deductions</span>
                      <span className="negative">-${payroll.deductions.toLocaleString()}</span>
                    </div>
                  )}
                  {payroll.tax > 0 && (
                    <div className="detail-row">
                      <span>Tax</span>
                      <span className="negative">-${payroll.tax.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="detail-row net-salary">
                    <span>Net Salary</span>
                    <span>${payroll.netSalary.toLocaleString()}</span>
                  </div>
                </div>
                {payroll.payslipUrl && (
                  <div className="payslip-link">
                    <a href={payroll.payslipUrl} target="_blank" rel="noopener noreferrer">
                      Download Payslip
                    </a>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default Payroll;

