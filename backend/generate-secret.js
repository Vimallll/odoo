const crypto = require('crypto');

// Generate a secure random JWT secret
const generateJWTSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

// Generate MongoDB connection string template
const generateMongoDBURI = () => {
  console.log('\n📝 MongoDB Atlas Connection String Template:');
  console.log('mongodb+srv://<username>:<password>@<cluster-name>.mongodb.net/<database-name>?retryWrites=true&w=majority\n');
  console.log('Example:');
  console.log('mongodb+srv://myuser:mypass123@cluster0.abc123.mongodb.net/hackthon?retryWrites=true&w=majority\n');
};

// Main function
console.log('🔐 Generating JWT Secret Key...\n');
const jwtSecret = generateJWTSecret();
console.log('✅ JWT Secret Key Generated:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(jwtSecret);
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

console.log('📋 Copy this secret key to your .env file as JWT_SECRET\n');

generateMongoDBURI();

console.log('💡 Instructions:');
console.log('1. Copy the JWT_SECRET above to your .env file');
console.log('2. Replace <username>, <password>, <cluster-name>, and <database-name> in MongoDB URI');
console.log('3. Make sure your MongoDB Atlas IP is whitelisted');
console.log('4. Save the .env file in the backend folder\n');

