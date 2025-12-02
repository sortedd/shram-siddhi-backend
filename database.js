const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Create Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Please add SUPABASE_URL and SUPABASE_KEY to your .env file');
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
      try {
        // Validate and sanitize input data
        const sanitizedData = {
          full_name: workerData.fullName || '',
          age: workerData.age ? parseInt(workerData.age) : 0,
          gender: workerData.gender || '',
          aadhaar_number: workerData.aadhaarNumber || '',
          mobile_number: workerData.mobileNumber || '',
          address: workerData.address || '',
          city: workerData.city || '',
          state: workerData.state || '',
          pincode: workerData.pincode || '',
          district: workerData.district || '',
          primary_skill: workerData.skillType || '',
          experience: workerData.experience || '',
          daily_wage: workerData.dailyWage ? parseFloat(workerData.dailyWage) : 0,
          availability: workerData.availability || '',
          additional_skills: workerData.additionalSkills || '',
          latitude: workerData.location?.latitude ? parseFloat(workerData.location.latitude) : null,
          longitude: workerData.location?.longitude ? parseFloat(workerData.location.longitude) : null,
          photo_url: workerData.photo || ''
        };

        // Ensure numeric fields are valid numbers
        if (isNaN(sanitizedData.age)) {
          sanitizedData.age = 0;
        }
        if (isNaN(sanitizedData.daily_wage)) {
          sanitizedData.daily_wage = 0;
        }
        if (isNaN(sanitizedData.latitude)) {
          sanitizedData.latitude = null;
        }
        if (isNaN(sanitizedData.longitude)) {
          sanitizedData.longitude = null;
        }

        const { data, error } = await supabase
          .from('workers')
          .insert([sanitizedData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Database error in workers.create:', error);
        throw error;
      }
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
      try {
        // Validate and sanitize input data
        const sanitizedData = {
          client_name: requestData.clientName || '',
          client_phone: requestData.clientPhone || '',
          client_email: requestData.clientEmail || '',
          service_type: requestData.serviceType || '',
          location: requestData.location || '',
          description: requestData.description || '',
          budget: requestData.budget ? parseFloat(requestData.budget) : 0,
          urgency: requestData.urgency || 'normal',
          status: 'Pending'
        };

        // Ensure budget is a valid number
        if (isNaN(sanitizedData.budget)) {
          sanitizedData.budget = 0;
        }

        const { data, error } = await supabase
          .from('client_requests')
          .insert([sanitizedData])
          .select()
          .single();

        if (error) throw error;
        return { lastInsertRowid: data.id };
      } catch (error) {
        console.error('Database error in clientRequests.create:', error);
        throw error;
      }
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
  contactRequests: {
    create: async (contactData) => {
      try {
        // Validate and sanitize input data
        const sanitizedData = {
          name: contactData.name || '',
          email: contactData.email || '',
          phone: contactData.phone || '',
          message: contactData.message || '',
          status: 'New'
        };

        const { data, error } = await supabase
          .from('contact_messages')
          .insert([sanitizedData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Database error in contactRequests.create:', error);
        throw error;
      }
    },

    getAll: async () => {
      const { data, error } = await supabase
        .from('contact_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    }
  },

  // Franchise Application operations
  franchiseApplications: {
    create: async (applicationData) => {
      try {
        // Validate and sanitize input data
        const sanitizedData = {
          full_name: applicationData.fullName || '',
          applicant_type: applicationData.applicantType || '',
          mobile_number: applicationData.mobileNumber || '',
          email: applicationData.emailAddress || '',
          aadhar_number: applicationData.aadharNumber || '',
          address: applicationData.address || '',
          district: applicationData.district || '',
          city: applicationData.nearestCity || '',
          center_location_type: applicationData.centerLocationType || '',
          space_available: applicationData.totalSpaceAvailable ? parseFloat(applicationData.totalSpaceAvailable) : 0,
          computer_system: applicationData.computerSystem || false,
          internet_available: applicationData.wifiAvailable || false,
          status: 'Pending',
          application_data: applicationData // Store full JSON as backup
        };

        // Ensure space_available is a valid number
        if (isNaN(sanitizedData.space_available)) {
          sanitizedData.space_available = 0;
        }

        const { data, error } = await supabase
          .from('franchise_applications')
          .insert([sanitizedData])
          .select()
          .single();

        if (error) throw error;
        return data;
      } catch (error) {
        console.error('Database error in franchiseApplications.create:', error);
        throw error;
      }
    }
  },

  // Admin operations
  admin: {
    getTables: async () => {
      return [
        { name: 'workers' },
        { name: 'client_requests' },
        { name: 'contact_messages' },
        { name: 'franchise_applications' },
        { name: 'users' }
      ];
    },

    getStats: async () => {
      const tables = ['workers', 'client_requests', 'contact_messages', 'franchise_applications', 'users'];
      const stats = {};

      for (const table of tables) {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });

        if (!error) {
          stats[table] = count;
        }
      }

      return stats;
    },

    getTableData: async (tableName, limit = 50, offset = 0) => {
      const allowedTables = ['workers', 'client_requests', 'contact_messages', 'franchise_applications', 'users'];
      if (!allowedTables.includes(tableName)) {
        throw new Error('Invalid table name');
      }

      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(offset, offset + limit - 1)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data, total: count };
    }
  }
};

// Initialize database
const initializeDatabase = async () => {
  try {
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