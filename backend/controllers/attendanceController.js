const Attendance = require('../models/Attendance');
const User = require('../models/User');

// Check In
exports.checkIn = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if already checked in today
    let attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (attendance && attendance.checkIn.time) {
      return res.status(400).json({ error: 'Already checked in today' });
    }

    if (!attendance) {
      attendance = new Attendance({
        employeeId,
        date: today,
        status: 'Present'
      });
    }

    attendance.checkIn = {
      time: new Date(),
      location: req.body.location || ''
    };
    attendance.status = 'Present';

    await attendance.save();
    res.json({ message: 'Checked in successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Check Out
exports.checkOut = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance || !attendance.checkIn.time) {
      return res.status(400).json({ error: 'Please check in first' });
    }

    if (attendance.checkOut.time) {
      return res.status(400).json({ error: 'Already checked out today' });
    }

    attendance.checkOut = {
      time: new Date(),
      location: req.body.location || ''
    };

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn.time);
    const checkOutTime = new Date(attendance.checkOut.time);
    const diffMs = checkOutTime - checkInTime;
    attendance.workingHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

    await attendance.save();
    res.json({ message: 'Checked out successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get attendance records
exports.getAttendance = async (req, res) => {
  try {
    const { employeeId, startDate, endDate } = req.query;
    const query = {};

    // Employees can only view their own attendance
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
      .populate('employeeId', 'employeeId profile.firstName profile.lastName')
      .sort({ date: -1 });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update attendance (Admin/HR only)
exports.updateAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const attendance = await Attendance.findById(id);

    if (!attendance) {
      return res.status(404).json({ error: 'Attendance record not found' });
    }

    Object.assign(attendance, req.body);
    await attendance.save();

    res.json({ message: 'Attendance updated successfully', attendance });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

