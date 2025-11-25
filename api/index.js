const express = require('express');
const serverless = require('serverless-http');
const { dbOperations } = require('../database');

const app = express();

// Add JSON middleware
app.use(express.json());

// Add CORS headers
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from Shram Siddhi API!',
    timestamp: new Date().toISOString()
  });
});

app.get('/api/health', async (req, res) => {
  try {
    // Test database connection
    const users = await dbOperations.users.findByEmail('admin@shramsiddhi.com');
    res.json({ 
      status: 'OK', 
      message: 'Shram Siddhi API is running',
      database: 'connected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'ERROR', 
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Export the app for Vercel serverless functions
module.exports = app;
module.exports.handler = serverless(app);
