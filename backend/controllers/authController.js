const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production', {
    expiresIn: '7d'
  });
};

// Sign Up
exports.signup = async (req, res) => {
  try {
    console.log('📝 Signup request received:', { employeeId: req.body.employeeId, email: req.body.email, role: req.body.role });
    
    const { employeeId, email, password, role } = req.body;

    // Validation
    if (!employeeId || !email || !password) {
      console.log('❌ Validation failed: Missing required fields');
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Password validation (strong password)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      console.log('❌ Password validation failed');
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      });
    }

    // Check if user already exists
    console.log('🔍 Checking for existing user...');
    const existingUser = await User.findOne({ 
      $or: [{ email }, { employeeId }] 
    });

    if (existingUser) {
      console.log('❌ User already exists:', existingUser.email || existingUser.employeeId);
      return res.status(400).json({ error: 'User with this email or employee ID already exists' });
    }

    // Generate email verification token
    const emailVerificationToken = crypto.randomBytes(32).toString('hex');

    // Create user
    console.log('👤 Creating new user...');
    const user = new User({
      employeeId,
      email,
      password,
      role: role || 'Employee',
      emailVerificationToken
    });

    await user.save();
    console.log('✅ User created successfully:', user._id);

    // In production, send verification email here
    // For now, we'll auto-verify for development
    user.emailVerified = true;
    await user.save();

    const token = generateToken(user._id);
    console.log('🎫 Token generated for user:', user._id);

    res.status(201).json({
      message: 'User registered successfully. Please verify your email.',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        emailVerified: user.emailVerified
      }
    });
  } catch (error) {
    console.error('❌ Signup error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name,
      code: error.code
    });
    
    // Handle MongoDB duplicate key error
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];
      return res.status(400).json({ 
        error: `${field} already exists. Please use a different ${field}.` 
      });
    }
    
    res.status(500).json({ 
      error: error.message || 'Server error during registration',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Sign In
exports.signin = async (req, res) => {
  try {
    console.log('🔐 Signin request received for email:', req.body.email);
    
    const { email, password } = req.body;

    if (!email || !password) {
      console.log('❌ Validation failed: Missing email or password');
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user by email
    console.log('🔍 Searching for user...');
    const user = await User.findOne({ email });
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('✅ User found:', user.employeeId);

    // Check password
    console.log('🔑 Verifying password...');
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.log('❌ Password mismatch');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      console.log('❌ Email not verified');
      return res.status(401).json({ error: 'Please verify your email before logging in' });
    }

    // Check if account is active
    if (!user.isActive) {
      console.log('❌ Account deactivated');
      return res.status(401).json({ error: 'Your account has been deactivated' });
    }

    const token = generateToken(user._id);
    console.log('✅ Login successful for user:', user.employeeId);

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        employeeId: user.employeeId,
        email: user.email,
        role: user.role,
        profile: user.profile
      }
    });
  } catch (error) {
    console.error('❌ Signin error:', error);
    console.error('Error details:', {
      message: error.message,
      name: error.name
    });
    res.status(500).json({ 
      error: error.message || 'Server error during login',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get current user
exports.getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

