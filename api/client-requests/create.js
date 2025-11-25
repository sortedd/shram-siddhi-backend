const { dbOperations, initializeDatabase } = require('../../database');

module.exports = async (req, res) => {
  try {
    // Initialize database connection
    await initializeDatabase();
    
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    // Handle preflight requests
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    // Parse body for POST requests
    if (req.method === 'POST') {
      // For serverless functions, we need to parse the body manually if it's a string
      if (typeof req.body === 'string') {
        try {
          req.body = JSON.parse(req.body);
        } catch (parseError) {
          console.error('Body parsing error:', parseError);
          res.status(400).json({ error: 'Invalid JSON in request body' });
          return;
        }
      }
    }
    
    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }
    
    const requestData = req.body;
    
    // Validate required fields
    if (!requestData.clientName || !requestData.clientPhone || !requestData.serviceType) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }
    
    const result = await dbOperations.clientRequests.create(requestData);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating client request:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
