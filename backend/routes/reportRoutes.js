const express = require('express');
const router = express.Router();
const { getAttendanceReport, getDashboardStats } = require('../controllers/reportController');
const { auth } = require('../middleware/auth');

router.get('/attendance', auth, getAttendanceReport);
router.get('/dashboard', auth, getDashboardStats);

module.exports = router;

