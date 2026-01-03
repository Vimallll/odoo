const User = require('../models/User');

// Cleanup unverified users older than 24 hours
const cleanupUnverifiedUsers = async () => {
  try {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const result = await User.deleteMany({
      emailVerified: false,
      createdAt: { $lt: oneDayAgo }
    });

    if (result.deletedCount > 0) {
      console.log(`🧹 Cleaned up ${result.deletedCount} unverified user(s) older than 24 hours`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up unverified users:', error);
  }
};

// Cleanup expired OTPs (older than 10 minutes)
const cleanupExpiredOTPs = async () => {
  try {
    const now = new Date();
    
    const result = await User.updateMany(
      {
        $or: [
          { emailVerificationOTPExpires: { $lt: now } },
          { passwordResetOTPExpires: { $lt: now } }
        ]
      },
      {
        $unset: {
          emailVerificationOTP: '',
          emailVerificationOTPExpires: '',
          passwordResetOTP: '',
          passwordResetOTPExpires: ''
        }
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`🧹 Cleaned up expired OTPs for ${result.modifiedCount} user(s)`);
    }
  } catch (error) {
    console.error('❌ Error cleaning up expired OTPs:', error);
  }
};

// Run cleanup every hour
const startCleanupScheduler = () => {
  // Run immediately on start
  cleanupUnverifiedUsers();
  cleanupExpiredOTPs();

  // Then run every hour
  setInterval(() => {
    cleanupUnverifiedUsers();
    cleanupExpiredOTPs();
  }, 60 * 60 * 1000); // 1 hour

  console.log('🧹 Cleanup scheduler started (runs every hour)');
};

module.exports = {
  cleanupUnverifiedUsers,
  cleanupExpiredOTPs,
  startCleanupScheduler
};

