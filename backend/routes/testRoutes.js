const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');

// Test database connection and create sample data
router.get('/db-status', async (req, res) => {
  try {
    const db = mongoose.connection;
    const dbName = db.name;
    const readyState = db.readyState;
    const host = db.host;
    const port = db.port;

    // Count collections
    const collections = await db.db.listCollections().toArray();
    const collectionNames = collections.map(c => c.name);

    // Count documents in each collection
    const counts = {};
    for (const collectionName of collectionNames) {
      const count = await db.db.collection(collectionName).countDocuments();
      counts[collectionName] = count;
    }

    res.json({
      status: 'Connected',
      database: {
        name: dbName,
        host: host,
        port: port,
        readyState: readyState === 1 ? 'Connected' : 'Disconnected',
        collections: collectionNames,
        documentCounts: counts
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'Error',
      error: error.message
    });
  }
});

// Create a test user to verify data saving
router.post('/create-test-user', async (req, res) => {
  try {
    const testUser = new User({
      employeeId: 'TEST' + Date.now(),
      email: `test${Date.now()}@example.com`,
      password: 'Test@1234',
      role: 'Employee',
      emailVerified: true
    });

    await testUser.save();

    res.json({
      message: 'Test user created successfully',
      user: {
        id: testUser._id,
        employeeId: testUser.employeeId,
        email: testUser.email
      },
      database: mongoose.connection.name
    });
  } catch (error) {
    res.status(500).json({
      error: error.message,
      details: error.code === 11000 ? 'User already exists' : undefined
    });
  }
});

module.exports = router;

