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

    // Only prevent check-in if there's a valid check-in time
    if (attendance && attendance.checkIn?.time) {
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

    const checkOutTime = new Date();
    attendance.checkOut = {
      time: checkOutTime,
      location: req.body.location || ''
    };

    // Calculate working hours
    const checkInTime = new Date(attendance.checkIn.time);
    const diffMs = checkOutTime - checkInTime;
    const totalHours = diffMs / (1000 * 60 * 60);
    
    // Office hours: 9 AM to 6 PM (9 hours)
    const officeHours = 9;
    attendance.workingHours = parseFloat(totalHours.toFixed(2));
    
    // Check if overtime (after 6 PM or more than 9 hours)
    const checkOutHour = checkOutTime.getHours();
    const checkOutMinute = checkOutTime.getMinutes();
    const isAfter6PM = checkOutHour > 18 || (checkOutHour === 18 && checkOutMinute >= 0);
    const isOvertime = isAfter6PM || totalHours > officeHours;
    
    // Mark as overtime if checkout is after 6 PM or user explicitly requested overtime
    if (isOvertime && (req.body.overtime || isAfter6PM)) {
      attendance.overtime = true;
      attendance.overtimeHours = Math.max(0, parseFloat((totalHours - officeHours).toFixed(2)));
    }

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
    // Admin/HR can view all employees or filter by specific employee
    if (req.user.role === 'Employee') {
      query.employeeId = req.user._id;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }
    // If admin/HR and no employeeId filter, show all employees (no employeeId filter)

    if (startDate && endDate) {
      // Parse dates and normalize to start/end of day in local timezone
      // This matches how dates are stored (with setHours(0,0,0,0))
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      
      query.date = {
        $gte: start,
        $lte: end
      };
      
      console.log('📅 Date query:', {
        startDate,
        endDate,
        start: start.toISOString(),
        end: end.toISOString(),
        startLocal: start.toString(),
        endLocal: end.toString()
      });
    } else {
      // If no date filter, show recent records (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);
      query.date = { $gte: thirtyDaysAgo };
      console.log('📅 No date filter - showing last 30 days');
    }

    console.log('🔍 Attendance query:', JSON.stringify(query, null, 2));
    
    // First, check total records in database for debugging
    const totalRecords = await Attendance.countDocuments({});
    console.log(`📊 Total attendance records in database: ${totalRecords}`);
    
    // Build the query with proper population
    let attendanceQuery = Attendance.find(query);
    
    // Populate employee data
    attendanceQuery = attendanceQuery.populate('employeeId', 'employeeId profile.firstName profile.lastName');
    
    // Sort by date descending (most recent first)
    attendanceQuery = attendanceQuery.sort({ date: -1 });
    
    const attendance = await attendanceQuery;

    console.log(`✅ Found ${attendance.length} attendance records matching query`);
    
    // If there are records in DB but query returned none, show a sample for debugging
    if (totalRecords > 0 && attendance.length === 0) {
      const sampleRecord = await Attendance.findOne().populate('employeeId', 'employeeId');
      if (sampleRecord) {
        console.log('📋 Sample record in DB (not matching query):', {
          date: sampleRecord.date,
          dateString: sampleRecord.date.toISOString(),
          dateLocal: sampleRecord.date.toString(),
          employeeId: sampleRecord.employeeId?.employeeId,
          queryStartDate: startDate,
          queryEndDate: endDate
        });
      }
    }
    
    // Log first record if exists to debug date format
    if (attendance.length > 0) {
      console.log('📋 First matching record:', {
        date: attendance[0].date,
        dateString: attendance[0].date.toISOString(),
        employee: attendance[0].employeeId?.employeeId
      });
    }

    res.json(attendance);
  } catch (error) {
    console.error('❌ Error fetching attendance:', error);
    res.status(500).json({ error: 'Server error', details: error.message });
  }
};

// Get current attendance status (for real-time hours calculation)
exports.getCurrentStatus = async (req, res) => {
  try {
    const employeeId = req.user._id;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId,
      date: today
    });

    if (!attendance || !attendance.checkIn?.time) {
      return res.json({ 
        checkedIn: false,
        checkedOut: false,
        currentHours: 0
      });
    }

    if (attendance.checkOut?.time) {
      // Already checked out, return final hours
      return res.json({
        checkedIn: true,
        checkedOut: true,
        checkInTime: attendance.checkIn.time,
        checkOutTime: attendance.checkOut.time,
        workingHours: attendance.workingHours,
        overtime: attendance.overtime,
        overtimeHours: attendance.overtimeHours
      });
    }

    // Still checked in, calculate current hours
    const checkInTime = new Date(attendance.checkIn.time);
    const now = new Date();
    const diffMs = now - checkInTime;
    const currentHours = parseFloat((diffMs / (1000 * 60 * 60)).toFixed(2));

    return res.json({
      checkedIn: true,
      checkedOut: false,
      checkInTime: attendance.checkIn.time,
      currentHours: currentHours,
      workingHours: 0
    });
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

