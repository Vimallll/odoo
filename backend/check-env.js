require('dotenv').config();

console.log('🔍 Checking Environment Variables...\n');

// Check MongoDB URI
const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI;
if (mongoURI) {
  console.log('✅ MongoDB URI found');
  console.log('   Variable:', process.env.MONGODB_URI ? 'MONGODB_URI' : 'MONGO_URI (deprecated)');
  console.log('   Connection:', mongoURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  // Extract database name
  const dbMatch = mongoURI.match(/\/([^?]+)\?/);
  if (dbMatch) {
    console.log('   Database:', dbMatch[1]);
  } else {
    console.log('   ⚠️  Database name not found in URI');
  }
  
  // Check if it's Atlas or local
  if (mongoURI.includes('mongodb+srv://')) {
    console.log('   Type: MongoDB Atlas (Cloud)');
  } else if (mongoURI.includes('localhost') || mongoURI.includes('127.0.0.1')) {
    console.log('   Type: Local MongoDB');
    console.log('   ⚠️  WARNING: Connecting to local database, not Atlas!');
  } else {
    console.log('   Type: Unknown');
  }
} else {
  console.log('❌ MongoDB URI not found!');
  console.log('   Please set MONGODB_URI in .env file');
}

console.log('');

// Check JWT Secret
const jwtSecret = process.env.JWT_SECRET;
if (jwtSecret) {
  console.log('✅ JWT_SECRET found');
  console.log('   Length:', jwtSecret.length, 'characters');
  if (jwtSecret.length < 32) {
    console.log('   ⚠️  WARNING: JWT secret should be at least 32 characters for security');
  }
} else {
  console.log('❌ JWT_SECRET not found!');
  console.log('   Please set JWT_SECRET in .env file');
}

console.log('');

// Check other variables
console.log('📋 Other Configuration:');
console.log('   PORT:', process.env.PORT || '5000 (default)');
console.log('   NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('   FRONTEND_URL:', process.env.FRONTEND_URL || 'http://localhost:3000 (default)');

console.log('\n💡 Recommendations:');
if (process.env.MONGO_URI && !process.env.MONGODB_URI) {
  console.log('   - Change MONGO_URI to MONGODB_URI in .env file');
}
if (!mongoURI || mongoURI.includes('localhost')) {
  console.log('   - Update MONGODB_URI to your MongoDB Atlas connection string');
  console.log('   - Format: mongodb+srv://username:password@cluster.mongodb.net/database?retryWrites=true&w=majority');
}
if (!jwtSecret || jwtSecret.length < 32) {
  console.log('   - Generate a stronger JWT secret: npm run generate-secret');
}

