// Configuration Check Script
// Run this before starting the server: node check-config.js

require('dotenv').config();

console.log('\n🔍 Checking Configuration...\n');

let hasErrors = false;

// Check MONGO_URI
if (!process.env.MONGO_URI) {
  console.error('❌ MONGO_URI is missing in .env file');
  console.error('   Add: MONGO_URI=mongodb://localhost:27017/chatdb');
  hasErrors = true;
} else {
  console.log('✅ MONGO_URI is set');
  if (process.env.MONGO_URI.includes('localhost')) {
    console.log('   Using local MongoDB');
  } else if (process.env.MONGO_URI.includes('mongodb+srv')) {
    console.log('   Using MongoDB Atlas (cloud)');
  }
}

// Check JWT_SECRET
if (!process.env.JWT_SECRET) {
  console.error('❌ JWT_SECRET is missing in .env file');
  console.error('   Add: JWT_SECRET=your_secret_key_here');
  hasErrors = true;
} else {
  console.log('✅ JWT_SECRET is set');
  if (process.env.JWT_SECRET.length < 10) {
    console.warn('⚠️  Warning: JWT_SECRET is too short (should be at least 10 characters)');
  }
}

// Check PORT
const PORT = process.env.PORT || 5000;
console.log(`✅ PORT: ${PORT}`);

console.log('\n📋 Summary:');
if (hasErrors) {
  console.error('❌ Configuration has errors. Please fix them before starting the server.\n');
  process.exit(1);
} else {
  console.log('✅ All configuration checks passed!\n');
  console.log('You can now start the server with: node server.js\n');
}

