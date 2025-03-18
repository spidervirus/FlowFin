// Script to test the bypass auth function by directly executing the SQL
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase credentials in .env.local file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function testBypassAuthWithSQL() {
  const email = 'machalil4@gmail.com';
  const password = 'Password123!';
  
  console.log('Testing bypass auth for user:', email);
  
  try {
    // First, create the manual_user_registry table if it doesn't exist
    console.log('\n1. Creating manual_user_registry table if it doesn\'t exist...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.manual_user_registry (
        id UUID PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        full_name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      );
    `;
    
    // Execute the SQL directly
    const { data: tableData, error: tableError } = await supabase.from('users')
      .select('id, email')
      .eq('email', email)
      .single();
    
    if (tableError) {
      console.error('Error getting user data:', tableError.message);
      return;
    }
    
    console.log('User found in public.users:', tableData);
    
    // Create the manual_user_registry table
    try {
      // We can't use exec_sql directly, so we'll use a direct query
      // This is a workaround since we can't execute arbitrary SQL
      
      // Check if the user already exists in manual_user_registry
      const { data: manualUserData, error: manualUserError } = await supabase
        .from('manual_user_registry')
        .select('*')
        .eq('email', email);
      
      if (manualUserError) {
        if (manualUserError.message.includes('does not exist')) {
          // Table doesn't exist, create it
          console.log('manual_user_registry table does not exist, creating it...');
          
          // We need to create the table, but we can't execute arbitrary SQL
          // Let's create a function to do this
          console.log('Please run the following SQL in the Supabase SQL Editor:');
          console.log('---');
          console.log(createTableSQL);
          console.log('---');
          
          // For now, let's assume the table exists or will be created manually
        } else {
          console.error('Error checking manual_user_registry:', manualUserError.message);
        }
      } else if (manualUserData && manualUserData.length > 0) {
        console.log('User already exists in manual_user_registry:', manualUserData[0]);
      } else {
        // User doesn't exist in manual_user_registry, add them
        console.log('Adding user to manual_user_registry...');
        
        // Hash the password (simple SHA-256 hash for demonstration)
        const passwordHash = crypto.createHash('sha256').update(password).digest('hex');
        
        const { data: insertData, error: insertError } = await supabase
          .from('manual_user_registry')
          .insert({
            id: tableData.id,
            email,
            password_hash: passwordHash,
            full_name: 'Aman'
          });
        
        if (insertError) {
          console.error('Error adding user to manual_user_registry:', insertError.message);
        } else {
          console.log('User added to manual_user_registry successfully');
        }
      }
    } catch (sqlError) {
      console.error('Exception executing SQL:', sqlError);
    }
    
    // Create the bypassed_sessions table
    console.log('\n2. Creating bypassed_sessions table if it doesn\'t exist...');
    
    const createSessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS public.bypassed_sessions (
        id UUID PRIMARY KEY,
        user_id UUID NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
      );
    `;
    
    console.log('Please run the following SQL in the Supabase SQL Editor:');
    console.log('---');
    console.log(createSessionsTableSQL);
    console.log('---');
    
    // Create the bypass auth functions
    console.log('\n3. Creating bypass auth functions...');
    
    const createFunctionsSQL = `
      -- Create or replace the function
      CREATE OR REPLACE FUNCTION public.bypass_auth_for_user(
        p_email TEXT,
        p_password TEXT
      ) RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_user_record RECORD;
        v_password_hash TEXT;
        v_user_id UUID;
        v_result jsonb;
      BEGIN
        -- Check if the user exists in manual_user_registry
        SELECT id, password_hash, full_name
        INTO v_user_record
        FROM public.manual_user_registry
        WHERE email = p_email;
        
        IF v_user_record IS NULL THEN
          -- User not found in manual registry
          RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found in manual registry',
            'user', NULL
          );
        END IF;
        
        -- Verify password (simple hash comparison for demonstration)
        -- In production, use a proper password hashing algorithm
        v_password_hash := encode(digest(p_password, 'sha256'), 'hex');
        
        IF v_user_record.password_hash != v_password_hash THEN
          -- Password doesn't match
          RETURN jsonb_build_object(
            'success', false,
            'message', 'Invalid password',
            'user', NULL
          );
        END IF;
        
        -- Password matches, return user info
        RETURN jsonb_build_object(
          'success', true,
          'message', 'Authentication successful',
          'user', jsonb_build_object(
            'id', v_user_record.id,
            'email', p_email,
            'full_name', v_user_record.full_name
          )
        );
      END;
      $$;

      -- Grant execute permission to service_role
      GRANT EXECUTE ON FUNCTION public.bypass_auth_for_user(TEXT, TEXT) TO service_role;

      -- Create a function to generate a session for a bypassed user
      CREATE OR REPLACE FUNCTION public.generate_session_for_bypassed_user(
        p_user_id UUID
      ) RETURNS jsonb
      LANGUAGE plpgsql
      SECURITY DEFINER
      AS $$
      DECLARE
        v_user_record RECORD;
        v_session_id UUID := gen_random_uuid();
        v_expires_at TIMESTAMP WITH TIME ZONE := now() + interval '1 week';
        v_result jsonb;
      BEGIN
        -- Check if the user exists in public.users
        SELECT id, email, full_name
        INTO v_user_record
        FROM public.users
        WHERE id = p_user_id;
        
        IF v_user_record IS NULL THEN
          -- User not found
          RETURN jsonb_build_object(
            'success', false,
            'message', 'User not found in public.users',
            'session', NULL
          );
        END IF;
        
        -- Create a session record in a new table for bypassed sessions
        CREATE TABLE IF NOT EXISTS public.bypassed_sessions (
          id UUID PRIMARY KEY,
          user_id UUID NOT NULL,
          created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
          expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
          CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE
        );
        
        -- Insert the session
        INSERT INTO public.bypassed_sessions (id, user_id, expires_at)
        VALUES (v_session_id, p_user_id, v_expires_at);
        
        -- Return session info
        RETURN jsonb_build_object(
          'success', true,
          'message', 'Session generated successfully',
          'session', jsonb_build_object(
            'id', v_session_id,
            'user_id', p_user_id,
            'expires_at', v_expires_at
          ),
          'user', jsonb_build_object(
            'id', v_user_record.id,
            'email', v_user_record.email,
            'full_name', v_user_record.full_name
          )
        );
      END;
      $$;

      -- Grant execute permission to service_role
      GRANT EXECUTE ON FUNCTION public.generate_session_for_bypassed_user(UUID) TO service_role;
    `;
    
    console.log('Please run the following SQL in the Supabase SQL Editor:');
    console.log('---');
    console.log(createFunctionsSQL);
    console.log('---');
    
    // Test the bypass auth function manually
    console.log('\n4. Manual test instructions:');
    console.log('After running the SQL above in the Supabase SQL Editor, you can test the bypass auth with:');
    console.log('---');
    console.log(`SELECT * FROM public.bypass_auth_for_user('${email}', '${password}');`);
    console.log('---');
    console.log('And then generate a session with:');
    console.log('---');
    console.log(`SELECT * FROM public.generate_session_for_bypassed_user('${tableData.id}');`);
    console.log('---');
    
    console.log('\n5. Summary:');
    console.log('User ID:', tableData.id);
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Password Hash:', crypto.createHash('sha256').update(password).digest('hex'));
  } catch (error) {
    console.error('Exception testing bypass auth with SQL:', error);
  }
}

// Run the function
testBypassAuthWithSQL()
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  }); 