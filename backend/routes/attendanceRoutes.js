const express = require('express');
const router = express.Router();
const { checkIn, checkOut, getAttendance, updateAttendance } = require('../controllers/attendanceController');
const { auth, authorize } = require('../middleware/auth');

router.post('/checkin', auth, checkIn);
router.post('/checkout', auth, checkOut);
router.get('/', auth, getAttendance);
router.put('/:id', auth, authorize('HR', 'Admin'), updateAttendance);

module.exports = router;

