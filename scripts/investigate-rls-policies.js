#!/usr/bin/env node

/**
 * RLS Policy Investigation Script
 * 
 * This script helps investigate Row Level Security (RLS) policies
 * that might be causing profile creation issues.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function investigateRLSPolicies() {
  console.log('🔍 Investigating RLS Policies for Profiles Table\n');

  try {
    // 1. Check if RLS is enabled on profiles table
    console.log('1. Checking RLS status on profiles table...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .rpc('check_rls_status', { table_name: 'profiles' })
      .single();

    if (rlsError) {
      console.log('   ⚠️  Could not check RLS status directly, checking via pg_tables...');
      
      const { data: tableInfo, error: tableError } = await supabase
        .from('pg_tables')
        .select('*')
        .eq('tablename', 'profiles')
        .eq('schemaname', 'public');

      if (tableError) {
        console.log('   ❌ Error checking table info:', tableError.message);
      } else {
        console.log('   ✅ Table exists:', tableInfo.length > 0);
      }
    } else {
      console.log('   ✅ RLS Status:', rlsStatus);
    }

    // 2. List all policies on profiles table
    console.log('\n2. Listing all policies on profiles table...');
    const { data: policies, error: policiesError } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles')
      .eq('schemaname', 'public');

    if (policiesError) {
      console.log('   ❌ Error fetching policies:', policiesError.message);
    } else {
      console.log(`   ✅ Found ${policies.length} policies:`);
      policies.forEach(policy => {
        console.log(`      - ${policy.policyname} (${policy.cmd}) - ${policy.permissive}`);
        console.log(`        USING: ${policy.qual || 'N/A'}`);
        console.log(`        WITH CHECK: ${policy.with_check || 'N/A'}`);
        console.log('');
      });
    }

    // 3. Test profile creation with service role
    console.log('3. Testing profile creation with service role...');
    const testUserId = '00000000-0000-0000-0000-000000000001';
    const testEmail = `test-${Date.now()}@example.com`;

    // First, clean up any existing test profile
    await supabase
      .from('profiles')
      .delete()
      .eq('email', testEmail);

    const { data: testProfile, error: testError } = await supabase
      .from('profiles')
      .insert({
        user_id: testUserId,
        email: testEmail,
        name: 'Test User',
        full_name: 'Test User Full',
        role: 'user'
      })
      .select()
      .single();

    if (testError) {
      console.log('   ❌ Service role insert failed:', testError.message);
      console.log('   Code:', testError.code);
      console.log('   Details:', testError.details);
      console.log('   Hint:', testError.hint);
    } else {
      console.log('   ✅ Service role insert successful:', testProfile.id);
      
      // Clean up test profile
      await supabase
        .from('profiles')
        .delete()
        .eq('id', testProfile.id);
    }

    // 4. Check auth context functions
    console.log('\n4. Testing auth context functions...');
    
    const authTests = [
      'SELECT auth.uid() as auth_uid',
      'SELECT auth.role() as auth_role',
      'SELECT current_user as current_user',
      'SELECT session_user as session_user'
    ];

    for (const query of authTests) {
      try {
        const { data, error } = await supabase.rpc('exec_sql', { sql: query });
        if (error) {
          console.log(`   ❌ ${query}: ${error.message}`);
        } else {
          console.log(`   ✅ ${query}:`, data);
        }
      } catch (err) {
        console.log(`   ⚠️  ${query}: Could not execute`);
      }
    }

    // 5. Check for conflicting policies
    console.log('\n5. Checking for potential policy conflicts...');
    
    const insertPolicies = policies.filter(p => p.cmd === 'INSERT');
    if (insertPolicies.length === 0) {
      console.log('   ⚠️  No INSERT policies found - this might be the issue!');
    } else if (insertPolicies.length > 1) {
      console.log('   ⚠️  Multiple INSERT policies found - check for conflicts:');
      insertPolicies.forEach(policy => {
        console.log(`      - ${policy.policyname}: ${policy.qual}`);
      });
    } else {
      console.log('   ✅ Single INSERT policy found:', insertPolicies[0].policyname);
    }

    // 6. Recommendations
    console.log('\n📋 Recommendations:');
    
    if (insertPolicies.length === 0) {
      console.log('   • Create an INSERT policy that allows service_role or authenticated users');
      console.log('   • Example: CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (auth.role() = \'service_role\' OR auth.uid() = user_id);');
    }
    
    if (policies.some(p => p.qual && p.qual.includes('auth.uid()'))) {
      console.log('   • Policies using auth.uid() may fail during signup when user context is not fully established');
      console.log('   • Consider allowing service_role as an alternative: auth.role() = \'service_role\'');
    }
    
    console.log('   • Check that the handle_new_user trigger runs with SECURITY DEFINER');
    console.log('   • Verify that the service role has necessary permissions');
    console.log('   • Consider temporarily disabling RLS for testing: ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;');

  } catch (error) {
    console.error('❌ Investigation failed:', error.message);
  }
}

// Helper function to create exec_sql RPC if it doesn't exist
async function createHelperFunctions() {
  const createExecSqlFunction = `
    CREATE OR REPLACE FUNCTION exec_sql(sql text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result json;
    BEGIN
        EXECUTE sql INTO result;
        RETURN result;
    END;
    $$;
  `;

  const createRlsCheckFunction = `
    CREATE OR REPLACE FUNCTION check_rls_status(table_name text)
    RETURNS json
    LANGUAGE plpgsql
    SECURITY DEFINER
    AS $$
    DECLARE
        result json;
    BEGIN
        SELECT json_build_object(
            'rls_enabled', relrowsecurity,
            'rls_forced', relforcerowsecurity
        ) INTO result
        FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = table_name AND n.nspname = 'public';
        
        RETURN result;
    END;
    $$;
  `;

  try {
    await supabase.rpc('exec', { sql: createExecSqlFunction });
    await supabase.rpc('exec', { sql: createRlsCheckFunction });
  } catch (error) {
    // Functions might already exist or we might not have permission
    console.log('Note: Could not create helper functions, some checks may be limited');
  }
}

if (require.main === module) {
  createHelperFunctions().then(() => {
    investigateRLSPolicies().then(() => {
      console.log('\n🔍 Investigation complete!');
      process.exit(0);
    }).catch(error => {
      console.error('Investigation failed:', error);
      process.exit(1);
    });
  });
}

module.exports = { investigateRLSPolicies };