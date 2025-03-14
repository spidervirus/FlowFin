// Script to apply the user trigger migration directly
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('Applying user trigger migration...');
  
  try {
    // Step 1: Create the function
    const { error: functionError } = await supabase.rpc('create_handle_new_user_function', {});
    
    if (functionError) {
      console.error('Error creating function:', functionError);
      // Try an alternative approach if the RPC doesn't exist
      console.log('Trying alternative approach...');
      
      // Sign in as an admin user (you'll need to replace with your admin credentials)
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: 'your-admin-email@example.com',
        password: 'your-admin-password',
      });
      
      if (signInError) {
        console.error('Error signing in:', signInError);
        return;
      }
      
      console.log('Signed in successfully. Please go to the Supabase dashboard SQL editor and run the SQL from the migration file manually.');
      return;
    }
    
    console.log('Function created successfully');
    
    // Step 2: Create the trigger
    const { error: triggerError } = await supabase.rpc('create_user_trigger', {});
    
    if (triggerError) {
      console.error('Error creating trigger:', triggerError);
      return;
    }
    
    console.log('Trigger created successfully');
    console.log('User trigger migration applied successfully');
  } catch (err) {
    console.error('Error applying migration:', err);
    console.log('Please go to the Supabase dashboard SQL editor and run the SQL from the migration file manually.');
  }
}

applyMigration(); 