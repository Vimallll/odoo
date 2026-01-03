const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware (for debugging)
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body.email ? `- Email: ${req.body.email}` : '');
  next();
});

// MongoDB connection
// Support both MONGO_URI and MONGODB_URI for compatibility
const MONGODB_URI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/hackthon';

console.log('🔗 Connecting to MongoDB...');
console.log('📍 Connection URI:', MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')); // Hide credentials in logs

// Warn if using deprecated variable name
if (process.env.MONGO_URI && !process.env.MONGODB_URI) {
  console.warn('⚠️  WARNING: Using MONGO_URI. Please update to MONGODB_URI in .env file');
}

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB connected successfully');
  console.log('📊 Database Name:', mongoose.connection.name);
  console.log('🌐 Host:', mongoose.connection.host);
  console.log('🔌 Port:', mongoose.connection.port);
  console.log('📝 Ready State:', mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected');
})
.catch((err) => {
  console.error('❌ MongoDB connection error:', err.message);
  console.error('💡 Make sure your MongoDB Atlas connection string is correct in .env file');
  console.error('💡 Format: mongodb+srv://username:password@cluster.mongodb.net/hackthon?retryWrites=true&w=majority');
  process.exit(1);
});

// Handle connection events
mongoose.connection.on('disconnected', () => {
  console.log('⚠️ MongoDB disconnected');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ MongoDB error:', err);
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
  res.json({ message: 'Welcome to Dayflow HRMS API - Every workday, perfectly aligned.' });
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
  console.error('❌ Error:', err.stack);
  res.status(500).json({ 
    error: err.message || 'Something went wrong!',
    details: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Dayflow HRMS Server is running on port ${PORT}`);
});

