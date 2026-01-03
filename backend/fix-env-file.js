const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔧 Fixing .env file...\n');

// Read current .env file
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('📄 Current .env file found\n');
} else {
  console.log('❌ .env file not found. Creating new one...\n');
}

// Fix the content
let fixedContent = envContent;

// 1. Change MONGO_URI to MONGODB_URI
if (fixedContent.includes('MONGO_URI=') && !fixedContent.includes('MONGODB_URI=')) {
  fixedContent = fixedContent.replace(/MONGO_URI=/g, 'MONGODB_URI=');
  console.log('✅ Changed MONGO_URI to MONGODB_URI');
}

// 2. Fix JWT_SECRET spacing
fixedContent = fixedContent.replace(/JWT_SECRET\s*=\s*/g, 'JWT_SECRET=');
if (fixedContent.includes('JWT_SECRET=')) {
  console.log('✅ Fixed JWT_SECRET spacing');
}

// 3. Ensure proper line endings and format
const lines = fixedContent.split('\n');
const fixedLines = [];
let hasMongoDB = false;
let hasJWT = false;
let hasPort = false;
let hasNodeEnv = false;
let hasFrontendURL = false;

for (let line of lines) {
  line = line.trim();
  
  // Skip empty lines and comments (we'll add them back)
  if (!line || line.startsWith('#')) {
    continue;
  }
  
  // Check what we have
  if (line.startsWith('MONGODB_URI=')) {
    hasMongoDB = true;
    fixedLines.push(line);
  } else if (line.startsWith('JWT_SECRET=')) {
    hasJWT = true;
    fixedLines.push(line);
  } else if (line.startsWith('PORT=')) {
    hasPort = true;
    fixedLines.push(line);
  } else if (line.startsWith('NODE_ENV=')) {
    hasNodeEnv = true;
    fixedLines.push(line);
  } else if (line.startsWith('FRONTEND_URL=')) {
    hasFrontendURL = true;
    fixedLines.push(line);
  } else {
    // Keep other lines
    fixedLines.push(line);
  }
}

// Build final content
let finalContent = `# ============================================
# Dayflow HRMS - Environment Configuration
# Auto-fixed on ${new Date().toISOString()}
# ============================================

# Server Configuration
${hasPort ? '' : 'PORT=5000\n'}${hasNodeEnv ? '' : 'NODE_ENV=development\n'}${hasFrontendURL ? '' : 'FRONTEND_URL=http://localhost:3000\n'}

# ============================================
# MongoDB Atlas Configuration
# ============================================
${hasMongoDB ? fixedLines.find(l => l.startsWith('MONGODB_URI=')) || 'MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hackathon?retryWrites=true&w=majority' : 'MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/hackathon?retryWrites=true&w=majority'}

# ============================================
# JWT Authentication Configuration
# ============================================
${hasJWT ? fixedLines.find(l => l.startsWith('JWT_SECRET=')) || 'JWT_SECRET=your_jwt_secret_key_here' : 'JWT_SECRET=your_jwt_secret_key_here'}
`;

// Write the fixed file
try {
  // Backup original
  if (fs.existsSync(envPath)) {
    const backupPath = envPath + '.backup';
    fs.writeFileSync(backupPath, envContent);
    console.log('💾 Backup saved to .env.backup\n');
  }
  
  // Write fixed content
  fs.writeFileSync(envPath, finalContent);
  console.log('✅ .env file fixed successfully!\n');
  
  // Show what was fixed
  console.log('📋 Summary:');
  if (envContent.includes('MONGO_URI=') && !envContent.includes('MONGODB_URI=')) {
    console.log('   ✅ Changed MONGO_URI → MONGODB_URI');
  }
  if (envContent.includes('JWT_SECRET =')) {
    console.log('   ✅ Fixed JWT_SECRET spacing');
  }
  console.log('   ✅ Formatted .env file properly\n');
  
  console.log('💡 Next steps:');
  console.log('   1. Review the .env file');
  console.log('   2. Make sure MONGODB_URI points to your Atlas cluster');
  console.log('   3. Restart your backend server: npm run dev');
  console.log('   4. Check connection: npm run check-env\n');
  
} catch (error) {
  console.error('❌ Error fixing .env file:', error.message);
  process.exit(1);
}

