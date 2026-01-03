const express = require('express');
const router = express.Router();
const { applyLeave, getLeaves, updateLeaveStatus } = require('../controllers/leaveController');
const { auth, authorize } = require('../middleware/auth');

router.post('/', auth, applyLeave);
router.get('/', auth, getLeaves);
router.put('/:id/status', auth, authorize('HR', 'Admin'), updateLeaveStatus);

module.exports = router;

