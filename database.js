const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please add SUPABASE_URL and SUPABASE_KEY to your .env file');
  // We don't exit here to allow the server to start and show the error, 
  // but DB operations will fail.
}

const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseKey || 'placeholder');

// Initialize default admin user
const initializeDefaultUser = async () => {
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', 'admin@shramsiddhi.com')
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
      console.error('Error checking default user:', error);
      return;
    }

    if (!users) {
      const hashedPassword = await bcrypt.hash('Admin@123', 10);
      const { error: insertError } = await supabase
        .from('users')
        .insert([
          { email: 'admin@shramsiddhi.com', password_hash: hashedPassword, role: 'admin' }
        ]);

      if (insertError) {
        console.error('Error creating default user:', insertError);
      } else {
        console.log('Default admin user created: admin@shramsiddhi.com / Admin@123');
      }
    }
  } catch (err) {
    console.error('Failed to initialize default user:', err);
  }
};

// Database operations
const dbOperations = {
  // User operations
  users: {
    findByEmail: async (email) => {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (error) return null;
      return data;
    },

    create: async (email, password, role = 'admin') => {
      const hashedPassword = await bcrypt.hash(password, 10);
      const { data, error } = await supabase
        .from('users')
        .insert([{ email, password_hash: hashedPassword, role }])
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Worker operations
  workers: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    getById: async (id) => {
      const { data, error } = await supabase
        .from('workers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) return null;
      return data;
    },

    create: async (workerData) => {
      const { data, error } = await supabase
        .from('workers')
        .insert([{
          full_name: workerData.fullName,
          age: workerData.age,
          gender: workerData.gender,
          aadhaar_number: workerData.aadhaarNumber,
          mobile_number: workerData.mobileNumber,
          address: workerData.address,
          city: workerData.city,
          state: workerData.state,
          pincode: workerData.pincode,
          district: workerData.district,
          primary_skill: workerData.skillType,
          experience: workerData.experience,
          daily_wage: workerData.dailyWage,
          availability: workerData.availability,
          additional_skills: workerData.additionalSkills,
          latitude: workerData.location?.latitude,
          longitude: workerData.location?.longitude,
          photo_url: workerData.photo
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    updateStatus: async (id, status) => {
      const { data, error } = await supabase
        .from('workers')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { changes: data.length };
    },

    updateVerification: async (id, verified) => {
      const { data, error } = await supabase
        .from('workers')
        .update({ verified, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { changes: data.length };
    },

    getStatistics: async () => {
      // This is less efficient in Supabase than SQL count, but simpler to port
      // For production, use RPC calls or separate count queries
      const { count: total } = await supabase.from('workers').select('*', { count: 'exact', head: true });
      const { count: active } = await supabase.from('workers').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: pending } = await supabase.from('workers').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      const { count: inactive } = await supabase.from('workers').select('*', { count: 'exact', head: true }).eq('status', 'inactive');
      const { count: verified } = await supabase.from('workers').select('*', { count: 'exact', head: true }).eq('verified', true);
      const { count: unverified } = await supabase.from('workers').select('*', { count: 'exact', head: true }).eq('verified', false);

      return {
        total: total || 0,
        active: active || 0,
        pending: pending || 0,
        inactive: inactive || 0,
        verified: verified || 0,
        unverified: unverified || 0
      };
    },

    getAnalytics: async (period = 'daily') => {
      // For complex analytics, it's best to create a Database View or RPC in Supabase
      // For now, we'll return a simplified placeholder or fetch raw data and aggregate in JS (not recommended for large data)
      // Returning empty array to prevent crash, recommending RPC for real implementation
      console.warn('Analytics aggregation should be moved to Supabase RPC');
      return [];
    }
  },

  // Client request operations
  clientRequests: {
    getAll: async () => {
      const { data, error } = await supabase
        .from('client_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },

    create: async (requestData) => {
      const { data, error } = await supabase
        .from('client_requests')
        .insert([{
          client_name: requestData.clientName,
          client_phone: requestData.clientPhone,
          client_email: requestData.clientEmail,
          service_type: requestData.serviceType,
          location: requestData.location,
          description: requestData.description,
          budget: requestData.budget,
          urgency: requestData.urgency
        }])
        .select()
        .single();

      if (error) throw error;
      return { lastInsertRowid: data.id }; // Maintain compatibility with controller
    },

    updateStatus: async (id, status) => {
      const { data, error } = await supabase
        .from('client_requests')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();

      if (error) throw error;
      return { changes: data.length };
    }
  },

  // Contact messages operations
  contactMessages: {
    create: async (messageData) => {
      const { data, error } = await supabase
        .from('contact_messages')
        .insert([{
          name: messageData.name,
          email: messageData.email,
          phone: messageData.phone,
          message: messageData.message
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },

    getAll: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
    // In Supabase, tables are created via SQL Editor or Migrations, not here.
    // We just check connection and init default user.
    await initializeDefaultUser();
    console.log('Database connection initialized');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
};

module.exports = {
  supabase,
  dbOperations,
  initializeDatabase
};