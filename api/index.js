const express = require('express');
const serverless = require('serverless-http');
const { dbOperations } = require('../database');

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Vercel serverless function!' });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'API test endpoint working!' });
});

// Export the app for Vercel serverless functions
module.exports = app;
module.exports.handler = serverless(app);
