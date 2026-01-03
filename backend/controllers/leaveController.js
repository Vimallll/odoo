const Leave = require('../models/Leave');
const User = require('../models/User');

// Apply for leave
exports.applyLeave = async (req, res) => {
  try {
    const { leaveType, startDate, endDate, remarks } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    
    const end = new Date(endDate);
    end.setHours(0, 0, 0, 0);
    
    // Get today's date (without time)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get tomorrow's date
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Validate: Start date must be tomorrow or later
    if (start <= today) {
      return res.status(400).json({ 
        error: 'Leave requests can only be made for tomorrow or future dates. You cannot request leave for today or past dates.' 
      });
    }

    // Validate: End date must be on or after start date
    if (end < start) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (totalDays <= 0) {
      return res.status(400).json({ error: 'End date must be on or after start date' });
    }

    const leave = new Leave({
      employeeId: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      totalDays,
      remarks
    });

    await leave.save();
    res.status(201).json({ message: 'Leave application submitted successfully', leave });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get leave requests
exports.getLeaves = async (req, res) => {
  try {
    const { employeeId, status, startDate, endDate } = req.query;
    const query = {};

    // Employees can only view their own leaves
    if (req.user.role === 'Employee') {
      query.employeeId = req.user._id;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (status) {
      query.status = status;
    }

    // Filter by date range if provided
    if (startDate && endDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      // Find leaves that overlap with the date range
      query.$or = [
        {
          startDate: { $lte: end },
          endDate: { $gte: start }
        }
      ];
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'employeeId profile.firstName profile.lastName email')
      .populate('approvedBy', 'employeeId profile.firstName profile.lastName')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Approve/Reject leave (Admin/HR only)
exports.updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, approvalComments } = req.body;

    if (!['Approved', 'Rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status. Must be Approved or Rejected' });
    }

    const leave = await Leave.findById(id);
    if (!leave) {
      return res.status(404).json({ error: 'Leave request not found' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.approvalComments = approvalComments || '';
    leave.approvedAt = new Date();

    await leave.save();
    res.json({ message: `Leave ${status.toLowerCase()} successfully`, leave });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

