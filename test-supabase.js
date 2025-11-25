const { supabase } = require('./database');

async function testSupabaseConnection() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test a simple query to check connection
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1);
      
    if (error) {
      console.error('Supabase connection error:', error);
      return;
    }
    
    console.log('Supabase connection successful!');
    console.log('Sample data:', data);
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testSupabaseConnection();
