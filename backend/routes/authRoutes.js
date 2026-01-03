const express = require('express');
const router = express.Router();
const { 
  signup, 
  signin, 
  getCurrentUser, 
  forgotPassword, 
  resetPassword,
  verifyEmailOTP,
  verifyPasswordResetOTP,
  resendVerificationOTP,
  resendPasswordResetOTP
} = require('../controllers/authController');
const { auth } = require('../middleware/auth');

router.post('/signup', signup);
router.post('/signin', signin);
router.get('/me', auth, getCurrentUser);
router.post('/verify-email-otp', verifyEmailOTP);
router.post('/resend-verification-otp', resendVerificationOTP);
router.post('/forgot-password', forgotPassword);
router.post('/verify-password-reset-otp', verifyPasswordResetOTP);
router.post('/resend-password-reset-otp', resendPasswordResetOTP);
router.post('/reset-password', resetPassword);

module.exports = router;

