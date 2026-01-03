const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const { startCleanupScheduler } = require('./utils/cleanupUnverifiedUsers');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware removed for cleaner output

// MongoDB connection
// Support both MONGO_URI and MONGODB_URI for compatibility
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hackthon';

// Warn if using deprecated variable name
if (process.env.MONGO_URI && !process.env.MONGODB_URI) {
  console.warn('⚠️  WARNING: Using MONGO_URI. Please update to MONGODB_URI in .env file');
}

// Retry connection logic
let retryCount = 0;
const maxRetries = 5;

const connectWithRetry = () => {
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 10000, // 10 seconds
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log('✅ MongoDB connected successfully');
    retryCount = 0; // Reset retry count on success
  })
  .catch((err) => {
    retryCount++;
    console.error(`❌ MongoDB connection error (Attempt ${retryCount}/${maxRetries}):`, err.message);
    
    // Provide specific solutions based on error type
    if (err.message.includes('ENOTFOUND')) {
      console.error('   🔧 DNS Resolution Error:');
      console.error('      1. Check if your MongoDB Atlas cluster is running (not paused)');
      console.error('      2. Verify your internet connection');
      console.error('      3. Try accessing MongoDB Atlas dashboard to check cluster status');
    } else if (err.message.includes('authentication')) {
      console.error('   🔧 Authentication Error:');
      console.error('      1. Verify username and password in connection string');
      console.error('      2. Check Database Access in MongoDB Atlas');
    } else if (err.message.includes('timeout')) {
      console.error('   🔧 Connection Timeout:');
      console.error('      1. Check Network Access IP whitelist in MongoDB Atlas');
      console.error('      2. Add your IP address or use 0.0.0.0/0 for development');
    }
    
    if (retryCount < maxRetries) {
      setTimeout(connectWithRetry, 5000);
    } else {
      console.error('   ❌ Max retries reached. Please check your MongoDB connection.');
      console.error('   💡 Run: node check-mongodb-connection.js to diagnose the issue');
      // Don't exit - allow server to start and handle requests
      // The connection will retry automatically on disconnect
    }
  });
};

// Start connection
connectWithRetry();

// Handle connection events
mongoose.connection.on('disconnected', () => {
  retryCount = 0; // Reset retry count on disconnect
  setTimeout(connectWithRetry, 5000);
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err.message);
});

mongoose.connection.on('reconnected', () => {
  // MongoDB reconnected
});

// API Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/employees', require('./routes/employeeRoutes'));
app.use('/api/attendance', require('./routes/attendanceRoutes'));
app.use('/api/leaves', require('./routes/leaveRoutes'));
app.use('/api/payroll', require('./routes/payrollRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/test', require('./routes/testRoutes')); // Test routes for debugging

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Emporia HRMS API - Every workday, perfectly aligned.' });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    database: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
    timestamp: new Date().toISOString()
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!',
    mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Not Connected'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  res.status(500).json({ 
    error: err.message || 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start cleanup scheduler
startCleanupScheduler();

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  // Server started
});

