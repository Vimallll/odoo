const express = require('express');
const router = express.Router();
const { getAllEmployees, getEmployeeById, updateEmployee, getEmployeeStatus } = require('../controllers/employeeController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, authorize('HR', 'Admin'), getAllEmployees);
router.get('/:id', auth, getEmployeeById);
router.get('/:employeeId/status', auth, authorize('HR', 'Admin'), getEmployeeStatus);
router.put('/:id', auth, updateEmployee);

module.exports = router;

