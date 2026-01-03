const express = require('express');
const router = express.Router();
const { getPayroll, createPayroll, getPayrollSummary } = require('../controllers/payrollController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, getPayroll);
router.get('/summary', auth, authorize('HR', 'Admin'), getPayrollSummary);
router.post('/', auth, authorize('HR', 'Admin'), createPayroll);

module.exports = router;

