const Payroll = require('../models/Payroll');
const User = require('../models/User');

// Get payroll records
exports.getPayroll = async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const query = {};

    // Employees can only view their own payroll
    if (req.user.role === 'Employee') {
      query.employeeId = req.user._id;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payroll = await Payroll.find(query)
      .populate('employeeId', 'employeeId profile.firstName profile.lastName email')
      .sort({ year: -1, month: -1 });

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Create/Update payroll (Admin/HR only)
exports.createPayroll = async (req, res) => {
  try {
    const { employeeId, month, year, baseSalary, allowances, deductions, bonus, overtime, tax } = req.body;

    if (!employeeId || !month || !year || !baseSalary) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const netSalary = baseSalary + (allowances || 0) + (bonus || 0) + (overtime || 0) - (deductions || 0) - (tax || 0);

    const payroll = await Payroll.findOneAndUpdate(
      { employeeId, month, year },
      {
        employeeId,
        month,
        year,
        baseSalary,
        allowances: allowances || 0,
        deductions: deductions || 0,
        bonus: bonus || 0,
        overtime: overtime || 0,
        tax: tax || 0,
        netSalary,
        status: 'Processed'
      },
      { upsert: true, new: true }
    );

    res.json({ message: 'Payroll created/updated successfully', payroll });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get payroll summary (Admin/HR only)
exports.getPayrollSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const query = {};

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const payrolls = await Payroll.find(query)
      .populate('employeeId', 'employeeId profile.firstName profile.lastName');

    const summary = {
      totalEmployees: payrolls.length,
      totalPayroll: payrolls.reduce((sum, p) => sum + p.netSalary, 0),
      averageSalary: payrolls.length > 0 ? payrolls.reduce((sum, p) => sum + p.netSalary, 0) / payrolls.length : 0,
      payrolls
    };

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

