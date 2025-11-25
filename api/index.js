const express = require('express');
const serverless = require('serverless-http');
const { dbOperations } = require('../database');

const app = express();

// Add body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  // Log environment variables for debugging
  console.log('Environment variables:');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET' : 'NOT SET');
  console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? 'SET' : 'NOT SET');
  console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'SET' : 'NOT SET');
  
  res.json({ 
    message: 'Hello from Vercel serverless function!',
    timestamp: new Date().toISOString(),
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL ? 'SET' : 'NOT SET',
      SUPABASE_KEY: process.env.SUPABASE_KEY ? 'SET' : 'NOT SET',
      JWT_SECRET: process.env.JWT_SECRET ? 'SET' : 'NOT SET'
    }
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test endpoint working!' });
});

// Export the app for Vercel serverless functions
module.exports = app;
module.exports.handler = serverless(app);
