const Attendance = require('../models/Attendance');
const Leave = require('../models/Leave');
const Payroll = require('../models/Payroll');
const User = require('../models/User');

// Get attendance report
exports.getAttendanceReport = async (req, res) => {
  try {
    const { startDate, endDate, employeeId } = req.query;
    const query = {};

    if (req.user.role === 'Employee') {
      query.employeeId = req.user._id;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    const attendance = await Attendance.find(query)
      .populate('employeeId', 'employeeId profile.firstName profile.lastName');

    const report = {
      totalDays: attendance.length,
      present: attendance.filter(a => a.status === 'Present').length,
      absent: attendance.filter(a => a.status === 'Absent').length,
      halfDay: attendance.filter(a => a.status === 'Half-day').length,
      onLeave: attendance.filter(a => a.status === 'Leave').length,
      totalWorkingHours: attendance.reduce((sum, a) => sum + parseFloat(a.workingHours || 0), 0),
      records: attendance
    };

    res.json(report);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get dashboard analytics
exports.getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let employeeQuery = {};
    if (req.user.role === 'Employee') {
      employeeQuery = { _id: req.user._id };
    }

    const stats = {
      totalEmployees: req.user.role !== 'Employee' ? await User.countDocuments({ role: 'Employee' }) : 1,
      todayAttendance: await Attendance.countDocuments({ date: today, status: 'Present' }),
      pendingLeaves: await Leave.countDocuments({ 
        ...(req.user.role === 'Employee' ? { employeeId: req.user._id } : {}),
        status: 'Pending' 
      }),
      recentLeaves: await Leave.find({ 
        ...(req.user.role === 'Employee' ? { employeeId: req.user._id } : {}),
        status: 'Pending' 
      })
        .populate('employeeId', 'employeeId profile.firstName profile.lastName')
        .sort({ createdAt: -1 })
        .limit(5)
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

