require('dotenv').config();
const { sendOTPEmail } = require('./utils/emailService');

async function testEmail() {
  console.log('🧪 Testing Email Configuration\n');
  
  // Check environment variables
  console.log('📋 Email Configuration:');
  console.log('   EMAIL_USER:', process.env.EMAIL_USER || '❌ NOT SET');
  console.log('   EMAIL_PASSWORD:', process.env.EMAIL_PASSWORD ? '***' + process.env.EMAIL_PASSWORD.slice(-4) : '❌ NOT SET');
  console.log('   EMAIL_SERVICE:', process.env.EMAIL_SERVICE || 'gmail (default)');
  console.log('   EMAIL_HOST:', process.env.EMAIL_HOST || 'Not set (using service default)');
  console.log('   EMAIL_PORT:', process.env.EMAIL_PORT || '587 (default)');
  console.log('');

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.error('❌ Email credentials not configured!');
    console.log('\n💡 To configure email:');
    console.log('   1. Add to backend/.env file:');
    console.log('      EMAIL_USER=your-email@gmail.com');
    console.log('      EMAIL_PASSWORD=your-app-password');
    console.log('      EMAIL_SERVICE=gmail');
    console.log('\n   2. For Gmail, get App Password from:');
    console.log('      https://myaccount.google.com/apppasswords');
    process.exit(1);
  }

  // Test email
  const testEmail = process.argv[2] || process.env.EMAIL_USER;
  const testOTP = '123456';
  
  console.log('📧 Sending test email to:', testEmail);
  console.log('📧 Test OTP:', testOTP);
  console.log('');

  try {
    await sendOTPEmail(testEmail, testOTP, 'reset');
    console.log('\n✅ Test email sent successfully!');
    console.log('💡 Check your inbox (and spam folder) for the test email.');
  } catch (error) {
    console.error('\n❌ Test email failed!');
    console.error('Error:', error.message);
    process.exit(1);
  }
}

testEmail();

