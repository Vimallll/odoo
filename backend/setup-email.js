require('dotenv').config();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEmail() {
  console.log('📧 Email Configuration Setup for Dayflow HRMS\n');
  console.log('This will help you configure email sending for OTP verification.\n');

  const emailService = await question('Which email service? (gmail/outlook/custom): ');
  
  if (emailService.toLowerCase() === 'gmail') {
    console.log('\n📋 Gmail Setup Instructions:');
    console.log('1. Go to: https://myaccount.google.com/apppasswords');
    console.log('2. Select "Mail" and "Other (Custom name)"');
    console.log('3. Enter "Dayflow HRMS" as the name');
    console.log('4. Click "Generate" and copy the 16-character password\n');
    
    const email = await question('Enter your Gmail address: ');
    const appPassword = await question('Enter your 16-character App Password: ');
    
    console.log('\n✅ Add these lines to your backend/.env file:\n');
    console.log(`EMAIL_USER=${email}`);
    console.log(`EMAIL_PASSWORD=${appPassword.replace(/\s/g, '')}`);
    console.log('EMAIL_SERVICE=gmail\n');
    
  } else if (emailService.toLowerCase() === 'outlook') {
    const email = await question('Enter your Outlook email: ');
    const password = await question('Enter your password: ');
    
    console.log('\n✅ Add these lines to your backend/.env file:\n');
    console.log(`EMAIL_USER=${email}`);
    console.log(`EMAIL_PASSWORD=${password}`);
    console.log('EMAIL_SERVICE=hotmail\n');
    
  } else {
    const email = await question('Enter your email address: ');
    const password = await question('Enter your email password: ');
    const host = await question('Enter SMTP host (e.g., smtp.yourdomain.com): ');
    const port = await question('Enter SMTP port (default 587): ') || '587';
    
    console.log('\n✅ Add these lines to your backend/.env file:\n');
    console.log(`EMAIL_USER=${email}`);
    console.log(`EMAIL_PASSWORD=${password}`);
    console.log(`EMAIL_HOST=${host}`);
    console.log(`EMAIL_PORT=${port}`);
    console.log('EMAIL_SECURE=false\n');
  }

  console.log('💡 After adding these to .env, restart your backend server.');
  console.log('💡 OTP emails will be sent to users during signup and password reset.\n');
  
  rl.close();
}

setupEmail().catch(console.error);

