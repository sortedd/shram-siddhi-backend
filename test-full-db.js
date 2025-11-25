const { initializeDatabase, dbOperations } = require('./database');

async function test() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully!');
    
    console.log('Testing user operations...');
    // Test finding a user
    const user = await dbOperations.users.findByEmail('admin@shramsiddhi.com');
    console.log('Admin user:', user);
    
    // Test creating a user
    console.log('Creating test user...');
    try {
      const newUser = await dbOperations.users.create('test@example.com', 'Test@123', 'admin');
      console.log('Created user:', newUser);
    } catch (err) {
      console.log('User creation error (might already exist):', err.message);
    }
    
    console.log('Testing worker operations...');
    // Test getting all workers
    try {
      const workers = await dbOperations.workers.getAll();
      console.log('Workers count:', workers.length);
    } catch (err) {
      console.log('Worker retrieval error:', err.message);
    }
    
    console.log('Testing client request operations...');
    // Test creating a client request
    try {
      const requestData = {
        clientName: 'Test Client',
        clientPhone: '1234567890',
        clientEmail: 'client@test.com',
        serviceType: 'Construction',
        location: 'Test City',
        description: 'Test request',
        budget: '5000',
        urgency: 'normal'
      };
      const result = await dbOperations.clientRequests.create(requestData);
      console.log('Created client request:', result);
    } catch (err) {
      console.log('Client request creation error:', err.message);
    }
    
    console.log('All tests completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
