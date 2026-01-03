require('dotenv').config();
const fs = require('fs');
const path = require('path');

console.log('🔧 MongoDB Connection String Fixer\n');

const envPath = path.join(__dirname, '.env');

// Check if .env exists
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found!');
  console.log('💡 Creating a new .env file...\n');
  
  const defaultEnv = `PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# MongoDB Atlas Connection String
# Format: mongodb+srv://username:password@cluster.mongodb.net/hackthon?retryWrites=true&w=majority
MONGODB_URI=

# JWT Secret (generate with: node generate-secret.js)
JWT_SECRET=
`;
  
  fs.writeFileSync(envPath, defaultEnv);
  console.log('✅ Created .env file. Please add your MongoDB connection string.\n');
  process.exit(0);
}

// Read .env file
let envContent = fs.readFileSync(envPath, 'utf8');
let modified = false;

// Fix common issues
console.log('🔍 Checking for common issues...\n');

// 1. Check for MONGO_URI instead of MONGODB_URI
if (envContent.includes('MONGO_URI=') && !envContent.includes('MONGODB_URI=')) {
  console.log('⚠️  Found MONGO_URI, changing to MONGODB_URI...');
  envContent = envContent.replace(/MONGO_URI=/g, 'MONGODB_URI=');
  modified = true;
}

// 2. Check for spaces around =
const lines = envContent.split('\n');
const fixedLines = lines.map(line => {
  if (line.includes('=') && !line.startsWith('#')) {
    const trimmed = line.trim();
    if (trimmed.includes(' = ') || trimmed.includes('= ')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').trim();
      return `${key.trim()}=${value}`;
    }
  }
  return line;
});
const fixedContent = fixedLines.join('\n');

if (fixedContent !== envContent) {
  envContent = fixedContent;
  modified = true;
  console.log('✅ Fixed spacing issues in .env file');
}

// 3. Check if MONGODB_URI exists
if (!envContent.includes('MONGODB_URI=')) {
  console.log('⚠️  MONGODB_URI not found, adding placeholder...');
  envContent += '\n# MongoDB Atlas Connection String\nMONGODB_URI=\n';
  modified = true;
}

// 4. Check connection string format
const mongoUriMatch = envContent.match(/MONGODB_URI=(.+)/);
if (mongoUriMatch) {
  const uri = mongoUriMatch[1].trim();
  if (uri && !uri.startsWith('mongodb+srv://') && !uri.startsWith('mongodb://')) {
    console.log('⚠️  Invalid connection string format detected');
    console.log('💡 Connection string should start with mongodb+srv:// or mongodb://');
  }
  
  // Check if database name is included
  if (uri && !uri.includes('/hackthon') && !uri.includes('/hackathon') && uri.includes('mongodb')) {
    console.log('⚠️  Database name not found in connection string');
    console.log('💡 Adding /hackthon to connection string...');
    
    // Add database name before query parameters
    if (uri.includes('?')) {
      envContent = envContent.replace(
        /MONGODB_URI=(.+)\?/,
        'MONGODB_URI=$1/hackthon?'
      );
    } else {
      envContent = envContent.replace(
        /MONGODB_URI=(.+)$/m,
        'MONGODB_URI=$1/hackthon?retryWrites=true&w=majority'
      );
    }
    modified = true;
  }
  
  // Check if query parameters are present
  if (uri && uri.includes('mongodb') && !uri.includes('retryWrites=true')) {
    console.log('⚠️  Query parameters missing, adding them...');
    if (uri.endsWith('/hackthon') || uri.endsWith('/hackathon')) {
      envContent = envContent.replace(
        /MONGODB_URI=(.+)$/m,
        'MONGODB_URI=$1?retryWrites=true&w=majority'
      );
    } else if (!uri.includes('?')) {
      envContent = envContent.replace(
        /MONGODB_URI=(.+)$/m,
        'MONGODB_URI=$1?retryWrites=true&w=majority'
      );
    }
    modified = true;
  }
}

// Write back if modified
if (modified) {
  fs.writeFileSync(envPath, envContent);
  console.log('\n✅ .env file has been updated!');
  console.log('💡 Please verify your MONGODB_URI value and restart the server.\n');
} else {
  console.log('✅ No issues found in .env file\n');
}

// Display current MONGODB_URI (masked)
const uriMatch = envContent.match(/MONGODB_URI=(.+)/);
if (uriMatch) {
  const uri = uriMatch[1].trim();
  if (uri) {
    const masked = uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
    console.log('📍 Current MONGODB_URI:', masked);
  } else {
    console.log('⚠️  MONGODB_URI is empty!');
    console.log('💡 Please add your MongoDB Atlas connection string to .env file');
  }
}

console.log('\n💡 Next steps:');
console.log('   1. Verify your MongoDB Atlas cluster is running');
console.log('   2. Check Network Access IP whitelist');
console.log('   3. Verify Database Access user credentials');
console.log('   4. Run: node check-mongodb-connection.js to test connection');

