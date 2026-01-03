const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');

console.log('🔧 Fixing MongoDB URI in .env file...\n');

// Read current .env file
if (!fs.existsSync(envPath)) {
  console.log('❌ .env file not found!');
  process.exit(1);
}

let envContent = fs.readFileSync(envPath, 'utf8');

// Check current URI
const uriMatch = envContent.match(/MONGODB_URI=(.+)/);
if (uriMatch) {
  let currentURI = uriMatch[1].trim();
  console.log('📍 Current URI:', currentURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  // Check if it has query parameters
  if (!currentURI.includes('?')) {
    console.log('⚠️  Missing query parameters. Adding them...');
    
    // Add query parameters
    const fixedURI = currentURI + '?retryWrites=true&w=majority';
    
    // Replace in content
    envContent = envContent.replace(
      /MONGODB_URI=.*/,
      `MONGODB_URI=${fixedURI}`
    );
    
    // Write back
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Fixed MongoDB URI with query parameters\n');
    console.log('📍 New URI:', fixedURI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  } else {
    console.log('✅ URI already has query parameters');
  }
  
  // Extract and show database name
  const dbMatch = currentURI.match(/\/([^?\/]+)(\?|$)/);
  if (dbMatch) {
    console.log('📊 Database name:', dbMatch[1]);
  }
  
} else {
  console.log('❌ MONGODB_URI not found in .env file');
}

console.log('\n💡 Next steps:');
console.log('   1. Restart your backend server: npm run dev');
console.log('   2. Check connection: npm run check-env');
console.log('   3. Verify data is saving to Atlas\n');

