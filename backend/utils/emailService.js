const nodemailer = require('nodemailer');

// Generate 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Create email transporter
const createTransporter = () => {
  // Check if email credentials are configured
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASSWORD) {
    console.warn('⚠️  Email credentials not configured. OTP will be logged to console only.');
    return null;
  }

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

// Send OTP Email
const sendOTPEmail = async (email, otp, type = 'verification') => {
  const subject = type === 'verification' 
    ? 'Email Verification OTP - Emporia' 
    : 'Password Reset OTP - Emporia';
  
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto; background-color: #f9fafb;">
      <div style="background-color: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
        <h2 style="color: #667eea; margin-top: 0;">${subject}</h2>
        <p style="color: #666; font-size: 16px;">Your verification code is:</p>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
          <h1 style="color: #667eea; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
        </div>
        <p style="color: #666; font-size: 14px;">This OTP will expire in 10 minutes.</p>
        <p style="color: #999; font-size: 12px; margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px;">
          If you didn't request this, please ignore this email.
        </p>
        <p style="color: #999; font-size: 12px; margin-top: 10px;">
          Emporia - Every workday, perfectly aligned.
        </p>
      </div>
    </div>
  `;

  const transporter = createTransporter();

  // If email is not configured, log to console
  if (!transporter) {
    console.log('\n📧 ============================================');
    console.log('📧 OTP Email (Not sent - Email not configured)');
    console.log('📧 ============================================');
    console.log('📧 To:', email);
    console.log('📧 Subject:', subject);
    console.log('📧 OTP Code:', otp);
    console.log('📧 ============================================\n');
    console.log('💡 To enable email sending, add to your .env file:');
    console.log('   EMAIL_USER=your-email@gmail.com');
    console.log('   EMAIL_PASSWORD=your-app-password');
    console.log('   EMAIL_SERVICE=gmail (optional)\n');
    return true;
  }

  try {
    const mailOptions = {
      from: `"Emporia" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: subject,
      html: htmlContent
    };

    console.log('📤 Attempting to send email to:', email);
    console.log('📤 From:', process.env.EMAIL_USER);
    console.log('📤 Subject:', subject);
    
    const info = await transporter.sendMail(mailOptions);
    console.log('✅ OTP email sent successfully to:', email);
    console.log('📧 Message ID:', info.messageId);
    console.log('📧 Response:', info.response);
    return true;
  } catch (error) {
    console.error('❌ Error sending OTP email:', error.message);
    console.error('❌ Error code:', error.code);
    console.error('❌ Error command:', error.command);
    
    // Log detailed error for debugging
    if (error.response) {
      console.error('❌ SMTP Response:', error.response);
    }
    
    console.log('\n📧 ============================================');
    console.log('📧 OTP Email (Fallback - Email sending failed)');
    console.log('📧 ============================================');
    console.log('📧 To:', email);
    console.log('📧 Subject:', subject);
    console.log('📧 OTP Code:', otp);
    console.log('📧 ============================================');
    console.log('\n💡 Common issues:');
    console.log('   1. Check EMAIL_USER and EMAIL_PASSWORD in .env file');
    console.log('   2. For Gmail, use App Password (not regular password)');
    console.log('   3. Check if 2-Factor Authentication is enabled');
    console.log('   4. Verify email service settings\n');
    
    // Don't throw error - allow user to see OTP in console
    return true;
  }
};

module.exports = {
  generateOTP,
  sendOTPEmail
};

