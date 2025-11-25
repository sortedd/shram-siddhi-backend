const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
    console.log('🔍 Checking Supabase connection...');

    // Check if users table exists by trying to select from it
    const { data, error } = await supabase.from('users').select('*').limit(1);

    if (error) {
        console.error('❌ Error accessing users table:', error.message);
        if (error.code === '42P01') {
            console.error('👉 CAUSE: The "users" table does not exist.');
            console.error('👉 FIX: You MUST run the SQL script in Supabase Dashboard.');
        }
        return;
    }

    console.log('✅ Users table exists.');

    // Check for admin user
    const { data: admin, error: adminError } = await supabase
        .from('users')
        .select('*')
        .eq('email', 'admin@shramsiddhi.com')
        .single();

    if (adminError && adminError.code !== 'PGRST116') {
        console.error('❌ Error searching for admin user:', adminError.message);
        return;
    }

    if (!admin) {
        console.error('❌ Admin user NOT found.');
        console.log('👉 Attempting to create admin user now...');

        // Try to create it
        const bcrypt = require('bcryptjs');
        const hashedPassword = await bcrypt.hash('Admin@123', 10);

        const { error: createError } = await supabase
            .from('users')
            .insert([
                { email: 'admin@shramsiddhi.com', password_hash: hashedPassword, role: 'admin' }
            ]);

        if (createError) {
            console.error('❌ Failed to create admin user:', createError.message);
        } else {
            console.log('✅ Admin user created successfully!');
        }
    } else {
        console.log('✅ Admin user exists:', admin.email);
    }
}

checkDatabase();
