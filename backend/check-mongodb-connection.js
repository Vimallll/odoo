require('dotenv').config();
const mongoose = require('mongoose');

console.log('🔍 MongoDB Connection Diagnostic Tool\n');

// Get connection string
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI not found in .env file');
  console.log('\n💡 Please add MONGODB_URI to your .env file');
  console.log('💡 Format: mongodb+srv://username:password@cluster.mongodb.net/hackthon?retryWrites=true&w=majority');
  process.exit(1);
}

// Mask credentials for display
const maskedURI = MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@');
console.log('📍 Connection String:', maskedURI);
console.log('');

// Extract hostname
const hostnameMatch = MONGODB_URI.match(/@([^/]+)/);
if (hostnameMatch) {
  const hostname = hostnameMatch[1];
  console.log('🌐 Hostname:', hostname);
  console.log('');
}

// Check connection string format
if (!MONGODB_URI.startsWith('mongodb+srv://') && !MONGODB_URI.startsWith('mongodb://')) {
  console.error('❌ Invalid connection string format');
  console.log('💡 Should start with mongodb+srv:// or mongodb://');
  process.exit(1);
}

// Check if database name is specified
if (!MONGODB_URI.includes('/hackthon') && !MONGODB_URI.includes('/hackathon')) {
  console.warn('⚠️  Database name not found in connection string');
  console.log('💡 Add /hackthon or /hackathon before the query parameters');
}

// Check query parameters
if (!MONGODB_URI.includes('retryWrites=true')) {
  console.warn('⚠️  retryWrites=true not found in connection string');
}

console.log('🔗 Attempting to connect...\n');

// Try to connect
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000, // 10 seconds
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('✅ MongoDB connected successfully!');
  console.log('📊 Database Name:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
  console.log('📝 Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
  process.exit(0);
})
.catch((err) => {
  console.error('❌ Connection failed!\n');
  console.error('Error:', err.message);
  console.log('');
  
  // Provide specific solutions based on error
  if (err.message.includes('ENOTFOUND')) {
    console.log('🔧 Solution: DNS resolution failed');
    console.log('   1. Check if your MongoDB Atlas cluster is running');
    console.log('   2. Verify the hostname in your connection string');
    console.log('   3. Check your internet connection');
    console.log('   4. Try accessing MongoDB Atlas dashboard to verify cluster status');
  } else if (err.message.includes('authentication')) {
    console.log('🔧 Solution: Authentication failed');
    console.log('   1. Verify your username and password in the connection string');
    console.log('   2. Check if the user exists in MongoDB Atlas Database Access');
    console.log('   3. Make sure password is URL-encoded (use %40 for @)');
  } else if (err.message.includes('timeout')) {
    console.log('🔧 Solution: Connection timeout');
    console.log('   1. Check your internet connection');
    console.log('   2. Verify IP address is whitelisted in Network Access');
    console.log('   3. Check if MongoDB Atlas cluster is paused');
  } else {
    console.log('🔧 General troubleshooting:');
    console.log('   1. Verify connection string format');
    console.log('   2. Check MongoDB Atlas cluster status');
    console.log('   3. Verify Network Access IP whitelist');
    console.log('   4. Check Database Access user permissions');
  }
  
  console.log('\n💡 Connection string format:');
  console.log('   mongodb+srv://username:password@cluster.mongodb.net/hackthon?retryWrites=true&w=majority');
  
  process.exit(1);
});

