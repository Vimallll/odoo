const User = require('../models/User');

// Get all employees (Admin/HR only)
exports.getAllEmployees = async (req, res) => {
  try {
    const employees = await User.find({ role: 'Employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    
    res.json(employees);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Get employee by ID
exports.getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id).select('-password');
    
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Employees can only view their own profile unless they're HR/Admin
    if (req.user.role === 'Employee' && req.user._id.toString() !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Update employee profile
exports.updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await User.findById(id);

    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    // Employees can only update limited fields
    if (req.user.role === 'Employee' && req.user._id.toString() !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // If employee, allow updating personal profile fields (but not salary or role)
    if (req.user.role === 'Employee') {
      if (req.body.profile) {
        console.log('📝 Employee updating profile. Received data:', req.body.profile);
        
        // Allow employees to update their personal information
        const allowedProfileFields = [
          'firstName', 'lastName', 'phone', 'address', 'dateOfBirth',
          'gender', 'maritalStatus', 'nationality', 'profilePicture'
        ];
        
        // Initialize profile if it doesn't exist
        if (!employee.profile) {
          employee.profile = {};
        }
        
        Object.keys(req.body.profile).forEach(key => {
          if (allowedProfileFields.includes(key)) {
            const value = req.body.profile[key];
            
            // Handle date fields - convert string to Date object
            if (key === 'dateOfBirth') {
              if (value && value !== '' && value !== null && value !== undefined) {
                employee.profile[key] = new Date(value);
                console.log(`  ✓ Set ${key} to:`, employee.profile[key]);
              } else {
                // Don't update if empty
                console.log(`  ⊘ Skipped ${key} (empty)`);
              }
            } else {
              // For other fields, update with value
              if (value !== null && value !== undefined) {
                employee.profile[key] = value;
                console.log(`  ✓ Set ${key} to:`, value);
              } else {
                console.log(`  ⊘ Skipped ${key} (null/undefined)`);
              }
            }
          } else {
            console.log(`  ✗ Skipped ${key} (not allowed for employees)`);
          }
        });
        
        // Mark profile as modified for Mongoose
        employee.markModified('profile');
        
        console.log('✅ Employee profile updated. Final profile:', JSON.stringify(employee.profile, null, 2));
      }
    } else if (req.user.role === 'HR') {
      // HR can update personal info, department, position, joiningDate, email, and role
      if (req.body.profile) {
        console.log('📝 HR updating profile. Received data:', req.body.profile);
        
        // Initialize profile if it doesn't exist
        if (!employee.profile) {
          employee.profile = {};
        }
        
        // Handle date fields properly
        const profileData = { ...req.body.profile };
        
        if (profileData.dateOfBirth && profileData.dateOfBirth !== '' && profileData.dateOfBirth !== null) {
          profileData.dateOfBirth = new Date(profileData.dateOfBirth);
        } else if (profileData.dateOfBirth === '' || profileData.dateOfBirth === null) {
          delete profileData.dateOfBirth;
        }
        if (profileData.joiningDate && profileData.joiningDate !== '' && profileData.joiningDate !== null) {
          profileData.joiningDate = new Date(profileData.joiningDate);
        } else if (profileData.joiningDate === '' || profileData.joiningDate === null) {
          delete profileData.joiningDate;
        }
        
        Object.assign(employee.profile, profileData);
        
        // Mark profile as modified for Mongoose
        employee.markModified('profile');
        
        console.log('✅ HR profile updated. Final profile:', JSON.stringify(employee.profile, null, 2));
      }
      
      // HR can update email for any employee
      if (req.body.email) {
        employee.email = req.body.email;
        console.log('✅ HR updated email');
      }
      
      // HR can update role (but not to Admin)
      if (req.body.role && req.body.role !== 'Admin') {
        employee.role = req.body.role;
        console.log('✅ HR updated role to:', req.body.role);
      }
      
      // HR cannot update salary
    } else {
      // Admin can update all fields
      if (req.body.profile) {
        console.log('📝 Admin updating profile. Received data:', req.body.profile);
        
        // Initialize profile if it doesn't exist
        if (!employee.profile) {
          employee.profile = {};
        }
        
        // Handle date fields properly
        const profileData = { ...req.body.profile };
        if (profileData.dateOfBirth && profileData.dateOfBirth !== '' && profileData.dateOfBirth !== null) {
          profileData.dateOfBirth = new Date(profileData.dateOfBirth);
        } else if (profileData.dateOfBirth === '' || profileData.dateOfBirth === null) {
          delete profileData.dateOfBirth;
        }
        if (profileData.joiningDate && profileData.joiningDate !== '' && profileData.joiningDate !== null) {
          profileData.joiningDate = new Date(profileData.joiningDate);
        } else if (profileData.joiningDate === '' || profileData.joiningDate === null) {
          delete profileData.joiningDate;
        }
        
        Object.assign(employee.profile, profileData);
        
        // Mark profile as modified for Mongoose
        employee.markModified('profile');
        
        console.log('✅ Admin profile updated. Final profile:', JSON.stringify(employee.profile, null, 2));
      }
      
      // Admin can update email
      if (req.body.email) {
        employee.email = req.body.email;
        console.log('✅ Admin updated email');
      }
      
      if (req.body.salary) {
        Object.assign(employee.salary, req.body.salary);
        employee.salary.netSalary = employee.salary.baseSalary + employee.salary.allowances - employee.salary.deductions;
      }
      if (req.body.role) {
        employee.role = req.body.role;
      }
    }

    await employee.save();
    
    // Return updated employee data
    const updatedEmployee = await User.findById(id).select('-password');
    console.log('✅ Employee updated successfully:', id);
    
    res.json({ 
      message: 'Employee updated successfully', 
      employee: updatedEmployee 
    });
  } catch (error) {
    console.error('❌ Error updating employee:', error);
    res.status(500).json({ 
      error: error.message || 'Server error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

