const User = require('../models/User');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateOTP, sendOTPEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production', {
    expiresIn: '7d'
  });
};

// Sign Up
exports.signup = async (req, res) => {
  try {
    const { employeeId, email, password, role } = req.body;

    // Validation
    if (!employeeId || !email || !password) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Password validation (strong password)
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      });
    }

    // Check if user already exists
    // Check for verified users - these cannot be replaced
    const verifiedUser = await User.findOne({ 
      $or: [
        { email, emailVerified: true },
        { employeeId, emailVerified: true }
      ]
    });

    if (verifiedUser) {
      return res.status(400).json({ error: 'User with this email or employee ID already exists' });
    }

    // Check for unverified users with same email or employeeId
    const unverifiedUser = await User.findOne({ 
      $or: [{ email }, { employeeId }],
      emailVerified: false
    });

    // If unverified user exists, delete it to allow new signup
    if (unverifiedUser) {
      await User.findByIdAndDelete(unverifiedUser._id);
    }

    // Generate email verification OTP
    const emailVerificationOTP = generateOTP();
    const emailVerificationOTPExpires = Date.now() + 600000; // 10 minutes

    // Create user
    const user = new User({
      employeeId,
      email,
      password,
      role: role || 'Employee',
      emailVerificationOTP,
      emailVerificationOTPExpires: new Date(emailVerificationOTPExpires)
    });

    await user.save();

    // Send OTP email
    await sendOTPEmail(email, emailVerificationOTP, 'verification');

    res.status(201).json({
      message: 'Account created successfully! Please check your email for the verification OTP.',
      userId: user._id,
      email: user.email,
      requiresVerification: true
    });
  } catch (error) {
    
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please provide email and password' });
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if email is verified
    if (!user.emailVerified) {
      // Delete unverified user to allow re-signup
      await User.findByIdAndDelete(user._id);
      return res.status(401).json({ 
        error: 'Email not verified. Your account has been removed. Please sign up again and verify your email.' 
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(401).json({ error: 'Your account has been deactivated' });
    }

    const token = generateToken(user._id);

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

// Forgot Password - Send OTP
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide your email address' });
    }

    const user = await User.findOne({ email });
    
    // For security, don't reveal if email exists or not
    if (!user) {
      return res.json({ 
        message: 'If an account with that email exists, a password reset OTP has been sent to your email.',
        email: email // Return email for frontend to use in reset password page
      });
    }

    // Check if user email is verified
    if (!user.emailVerified) {
      return res.status(400).json({ 
        error: 'Please verify your email first before resetting password.' 
      });
    }

    // Generate password reset OTP
    const passwordResetOTP = generateOTP();
    const passwordResetOTPExpires = Date.now() + 600000; // 10 minutes

    user.passwordResetOTP = passwordResetOTP;
    user.passwordResetOTPExpires = new Date(passwordResetOTPExpires);
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, passwordResetOTP, 'reset');

    res.json({ 
      message: 'If an account with that email exists, a password reset OTP has been sent to your email.',
      email: user.email // Return email for frontend to use in reset password page
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error while sending password reset OTP' });
  }
};

// Verify Password Reset OTP
exports.verifyPasswordResetOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ error: 'Please provide email and OTP' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if OTP matches and is not expired
    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (!user.passwordResetOTPExpires || user.passwordResetOTPExpires < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // OTP verified successfully
    res.json({ 
      message: 'OTP verified successfully. You can now reset your password.',
      verified: true
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Reset Password (after OTP verification)
exports.resetPassword = async (req, res) => {
  try {
    const { email, otp, password } = req.body;

    if (!email || !otp || !password) {
      return res.status(400).json({ error: 'Please provide email, OTP, and new password' });
    }

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify OTP again
    if (user.passwordResetOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (!user.passwordResetOTPExpires || user.passwordResetOTPExpires < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Password validation
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!passwordRegex.test(password)) {
      return res.status(400).json({ 
        error: 'Password must be at least 8 characters long and contain uppercase, lowercase, number, and special character' 
      });
    }

    // Update password and clear OTP
    user.password = password;
    user.passwordResetOTP = undefined;
    user.passwordResetOTPExpires = undefined;
    await user.save();


    res.json({ message: 'Password reset successfully. Please sign in with your new password.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify Email OTP (for signup)
exports.verifyEmailOTP = async (req, res) => {
  try {
    const { userId, otp } = req.body;

    if (!userId || !otp) {
      return res.status(400).json({ error: 'Please provide user ID and OTP' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Check if OTP matches and is not expired
    if (user.emailVerificationOTP !== otp) {
      return res.status(400).json({ error: 'Invalid OTP' });
    }

    if (!user.emailVerificationOTPExpires || user.emailVerificationOTPExpires < Date.now()) {
      return res.status(400).json({ error: 'OTP has expired. Please request a new one.' });
    }

    // Verify email
    user.emailVerified = true;
    user.emailVerificationOTP = undefined;
    user.emailVerificationOTPExpires = undefined;
    await user.save();

    const token = generateToken(user._id);

    res.json({
      message: 'Email verified successfully!',
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
    res.status(500).json({ error: 'Server error' });
  }
};

// Resend OTP (for signup)
exports.resendVerificationOTP = async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'Please provide user ID' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.emailVerified) {
      return res.status(400).json({ error: 'Email already verified' });
    }

    // Generate new OTP
    const emailVerificationOTP = generateOTP();
    const emailVerificationOTPExpires = Date.now() + 600000; // 10 minutes

    user.emailVerificationOTP = emailVerificationOTP;
    user.emailVerificationOTPExpires = new Date(emailVerificationOTPExpires);
    await user.save();

    // Send OTP email
    await sendOTPEmail(user.email, emailVerificationOTP, 'verification');

    res.json({ message: 'OTP has been resent to your email.' });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Resend Password Reset OTP
exports.resendPasswordResetOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Please provide your email address' });
    }

    const user = await User.findOne({ email });
    
    if (!user) {
      return res.json({ 
        message: 'If an account with that email exists, a password reset OTP has been sent to your email.' 
      });
    }

    // Generate new OTP
    const passwordResetOTP = generateOTP();
    const passwordResetOTPExpires = Date.now() + 600000; // 10 minutes

    user.passwordResetOTP = passwordResetOTP;
    user.passwordResetOTPExpires = new Date(passwordResetOTPExpires);
    await user.save();

    // Send OTP email
    await sendOTPEmail(email, passwordResetOTP, 'reset');

    res.json({ 
      message: 'If an account with that email exists, a password reset OTP has been sent to your email.' 
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

