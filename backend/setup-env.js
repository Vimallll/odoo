const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function setupEnv() {
  console.log('🚀 Dayflow HRMS - Environment Setup\n');
  console.log('This script will help you create a .env file with all necessary configurations.\n');

  // Check if .env already exists
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const overwrite = await question('⚠️  .env file already exists. Overwrite? (y/n): ');
    if (overwrite.toLowerCase() !== 'y') {
      console.log('❌ Setup cancelled.');
      rl.close();
      return;
    }
  }

  // Generate JWT Secret
  const jwtSecret = crypto.randomBytes(64).toString('hex');
  console.log('\n✅ Generated JWT Secret Key\n');

  // Get MongoDB URI
  console.log('📝 MongoDB Atlas Configuration:');
  console.log('Get your connection string from MongoDB Atlas:');
  console.log('1. Go to Atlas Dashboard → Connect → Connect your application\n');
  
  const mongoURI = await question('Enter MongoDB Atlas connection string (with /hackthon database): ');
  
  if (!mongoURI || !mongoURI.includes('mongodb+srv://')) {
    console.log('⚠️  Invalid connection string. Using default template.');
  }

  // Get Port
  const port = await question('Enter server port (default: 5000): ') || '5000';

  // Get Frontend URL
  const frontendURL = await question('Enter frontend URL (default: http://localhost:3000): ') || 'http://localhost:3000';

  // Get Node Environment
  const nodeEnv = await question('Enter NODE_ENV (development/production, default: development): ') || 'development';

  // Create .env content
  const envContent = `# ============================================
# Dayflow HRMS - Environment Configuration
# Generated automatically on ${new Date().toISOString()}
# ============================================

# Server Configuration
PORT=${port}
NODE_ENV=${nodeEnv}
FRONTEND_URL=${frontendURL}

# ============================================
# MongoDB Atlas Configuration
# ============================================
MONGODB_URI=${mongoURI || 'mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hackthon?retryWrites=true&w=majority'}

# ============================================
# JWT Authentication Configuration
# ============================================
JWT_SECRET=${jwtSecret}

# ============================================
# Email Configuration (Optional - for future use)
# ============================================
# EMAIL_HOST=smtp.gmail.com
# EMAIL_PORT=587
# EMAIL_USER=your-email@gmail.com
# EMAIL_PASS=your-app-password
# EMAIL_FROM=noreply@dayflow.com
`;

  // Write .env file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ .env file created successfully!\n');
    console.log('📋 Configuration Summary:');
    console.log(`   Port: ${port}`);
    console.log(`   Environment: ${nodeEnv}`);
    console.log(`   Frontend URL: ${frontendURL}`);
    console.log(`   MongoDB URI: ${mongoURI ? '✅ Set' : '⚠️  Using template (please update)'}`);
    console.log(`   JWT Secret: ✅ Generated (${jwtSecret.substring(0, 20)}...)`);
    console.log('\n💡 Next Steps:');
    console.log('1. Review the .env file and update MongoDB URI if needed');
    console.log('2. Make sure MongoDB Atlas IP is whitelisted');
    console.log('3. Start the server: npm run dev');
    console.log('4. Test the connection: curl http://localhost:' + port + '/api/health\n');
  } catch (error) {
    console.error('❌ Error creating .env file:', error.message);
  }

  rl.close();
}

// Run setup
setupEnv().catch(error => {
  console.error('❌ Setup error:', error);
  rl.close();
  process.exit(1);
});

