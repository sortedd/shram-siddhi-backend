const axios = require('axios');

async function testEndpoints() {
  try {
    console.log('Testing API endpoints...');
    
    // Test base URL
    const baseURL = 'http://localhost:3001';
    console.log('Using base URL: ' + baseURL);
    
    // Test health check endpoint
    console.log('Testing health check endpoint...');
    try {
      const healthResponse = await axios.get(baseURL + '/');
      console.log('Health check response:', healthResponse.data);
    } catch (error) {
      console.log('Health check error:', error.message);
    }
    
    // Test login endpoint
    console.log('Testing login endpoint...');
    try {
      const loginResponse = await axios.post(baseURL + '/api/auth/login', {
        email: 'admin@shramsiddhi.com',
        password: 'Admin@123'
      });
      console.log('Login response:', loginResponse.data);
    } catch (error) {
      console.log('Login error:', error.message);
    }
    
    // Test workers endpoint
    console.log('Testing workers endpoint...');
    try {
      const workersResponse = await axios.get(baseURL + '/api/workers');
      console.log('Workers response:', workersResponse.data.length, 'workers found');
    } catch (error) {
      console.log('Workers error:', error.message);
    }
    
    console.log('All tests completed!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testEndpoints();
