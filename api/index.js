const express = require('express');
const serverless = require('serverless-http');
const healthRoute = require('./routes/health');

const app = express();

app.get('/', (req, res) => {
  res.json({ message: 'Hello from Vercel serverless function!' });
});

app.get('/api/health', healthRoute);

// Export the app for Vercel serverless functions
module.exports = app;
module.exports.handler = serverless(app);
