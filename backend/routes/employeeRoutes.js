const express = require('express');
const router = express.Router();
const { getAllEmployees, getEmployeeById, updateEmployee } = require('../controllers/employeeController');
const { auth, authorize } = require('../middleware/auth');

router.get('/', auth, authorize('HR', 'Admin'), getAllEmployees);
router.get('/:id', auth, getEmployeeById);
router.put('/:id', auth, updateEmployee);

module.exports = router;

