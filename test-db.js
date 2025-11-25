const { initializeDatabase, dbOperations } = require('./database');

async function test() {
  try {
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully!');
    
    console.log('Testing database connection...');
    const users = await dbOperations.users.getAll();
    console.log('Users count:', users.length);
    
    console.log('Test completed successfully!');
  } catch (error) {
    console.error('Test failed:', error);
  }
}

test();
