const mongoose = require('mongoose');

const payrollSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  month: {
    type: Number,
    required: true,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  baseSalary: {
    type: Number,
    required: true
  },
  allowances: {
    type: Number,
    default: 0
  },
  deductions: {
    type: Number,
    default: 0
  },
  bonus: {
    type: Number,
    default: 0
  },
  overtime: {
    type: Number,
    default: 0
  },
  tax: {
    type: Number,
    default: 0
  },
  netSalary: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Pending', 'Processed', 'Paid'],
    default: 'Pending'
  },
  paymentDate: {
    type: Date
  },
  payslipUrl: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Compound index for unique payroll per employee per month/year
payrollSchema.index({ employeeId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Payroll', payrollSchema);

