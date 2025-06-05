#!/usr/bin/env node

/**
 * Profile Creation Monitoring Script
 * 
 * This script helps monitor and diagnose profile creation issues,
 * including RLS policy violations and backup table usage.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const MONITORING_INTERVAL = 30000; // 30 seconds
const LOG_FILE = path.join(__dirname, '../logs/profile-monitoring.log');

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('Missing required environment variables:');
  console.error('- NEXT_PUBLIC_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Ensure logs directory exists
const logsDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

/**
 * Log message with timestamp
 */
function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logEntry = `[${timestamp}] [${level}] ${message}\n`;
  
  console.log(logEntry.trim());
  fs.appendFileSync(LOG_FILE, logEntry);
}

/**
 * Check profile creation health
 */
async function checkProfileHealth() {
  try {
    log('Starting profile health check...');
    
    // Check recent auth users without profiles
    const { data: usersWithoutProfiles, error: usersError } = await supabase
      .from('auth.users')
      .select(`
        id,
        email,
        created_at,
        raw_user_meta_data
      `)
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .limit(50);
    
    if (usersError) {
      log(`Error fetching recent users: ${usersError.message}`, 'ERROR');
      return;
    }
    
    if (!usersWithoutProfiles || usersWithoutProfiles.length === 0) {
      log('No recent users found');
      return;
    }
    
    log(`Found ${usersWithoutProfiles.length} recent users`);
    
    // Check which users have profiles
    const userIds = usersWithoutProfiles.map(u => u.id);
    
    const { data: existingProfiles, error: profilesError } = await supabase
      .from('profiles')
      .select('user_id')
      .in('user_id', userIds);
    
    if (profilesError) {
      log(`Error fetching profiles: ${profilesError.message}`, 'ERROR');
      return;
    }
    
    const profileUserIds = new Set(existingProfiles?.map(p => p.user_id) || []);
    const usersWithoutProfilesData = usersWithoutProfiles.filter(u => !profileUserIds.has(u.id));
    
    if (usersWithoutProfilesData.length > 0) {
      log(`Found ${usersWithoutProfilesData.length} users without profiles:`, 'WARN');
      
      for (const user of usersWithoutProfilesData) {
        log(`  - User ${user.id} (${user.email}) created at ${user.created_at}`, 'WARN');
        
        // Check if they're in backup table
        const { data: backupProfile, error: backupError } = await supabase
          .from('user_profiles_backup')
          .select('*')
          .eq('user_id', user.id)
          .single();
        
        if (backupProfile) {
          log(`    -> Found in backup table: ${backupProfile.error_reason}`, 'INFO');
        } else if (backupError && backupError.code !== 'PGRST116') {
          log(`    -> Error checking backup table: ${backupError.message}`, 'ERROR');
        } else {
          log(`    -> Not found in backup table either`, 'WARN');
        }
      }
    } else {
      log('All recent users have profiles ✓');
    }
    
    // Check backup table for recent entries
    const { data: recentBackups, error: backupError } = await supabase
      .from('user_profiles_backup')
      .select('*')
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false });
    
    if (backupError) {
      log(`Error fetching backup profiles: ${backupError.message}`, 'ERROR');
    } else if (recentBackups && recentBackups.length > 0) {
      log(`Found ${recentBackups.length} recent backup profiles:`, 'WARN');
      
      for (const backup of recentBackups) {
        log(`  - User ${backup.user_id} (${backup.email}): ${backup.error_reason}`, 'WARN');
      }
    }
    
  } catch (error) {
    log(`Unexpected error in health check: ${error.message}`, 'ERROR');
  }
}

/**
 * Check RLS policies status
 */
async function checkRlsPolicies() {
  try {
    log('Checking RLS policies...');
    
    // Query to check RLS policies on profiles table
    const { data: policies, error } = await supabase
      .rpc('get_table_policies', { table_name: 'profiles' })
      .select('*');
    
    if (error) {
      log(`Error fetching RLS policies: ${error.message}`, 'ERROR');
      return;
    }
    
    if (policies && policies.length > 0) {
      log(`Found ${policies.length} RLS policies on profiles table`);
      
      for (const policy of policies) {
        log(`  - ${policy.policyname}: ${policy.cmd} (${policy.permissive ? 'PERMISSIVE' : 'RESTRICTIVE'})`);
      }
    } else {
      log('No RLS policies found on profiles table', 'WARN');
    }
    
  } catch (error) {
    log(`Error checking RLS policies: ${error.message}`, 'ERROR');
  }
}

/**
 * Attempt to migrate backup profiles to main table
 */
async function migrateBackupProfiles() {
  try {
    log('Checking for backup profiles to migrate...');
    
    const { data: backupProfiles, error: fetchError } = await supabase
      .from('user_profiles_backup')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(10);
    
    if (fetchError) {
      log(`Error fetching backup profiles: ${fetchError.message}`, 'ERROR');
      return;
    }
    
    if (!backupProfiles || backupProfiles.length === 0) {
      log('No backup profiles to migrate');
      return;
    }
    
    log(`Found ${backupProfiles.length} backup profiles to migrate`);
    
    for (const backup of backupProfiles) {
      try {
        // Check if profile already exists in main table
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('user_id', backup.user_id)
          .single();
        
        if (existingProfile) {
          log(`Profile already exists for user ${backup.user_id}, removing from backup`);
          
          // Remove from backup table
          const { error: deleteError } = await supabase
            .from('user_profiles_backup')
            .delete()
            .eq('user_id', backup.user_id);
          
          if (deleteError) {
            log(`Error removing backup profile: ${deleteError.message}`, 'ERROR');
          }
          
          continue;
        }
        
        if (checkError && checkError.code !== 'PGRST116') {
          log(`Error checking existing profile: ${checkError.message}`, 'ERROR');
          continue;
        }
        
        // Attempt to create profile in main table
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: backup.user_id,
            email: backup.email,
            name: backup.name,
            full_name: backup.full_name,
            role: backup.role
          })
          .select('*')
          .single();
        
        if (createError) {
          log(`Failed to migrate profile for user ${backup.user_id}: ${createError.message}`, 'ERROR');
          continue;
        }
        
        log(`Successfully migrated profile for user ${backup.user_id}`);
        
        // Remove from backup table
        const { error: deleteError } = await supabase
          .from('user_profiles_backup')
          .delete()
          .eq('user_id', backup.user_id);
        
        if (deleteError) {
          log(`Error removing migrated backup profile: ${deleteError.message}`, 'ERROR');
        }
        
      } catch (error) {
        log(`Unexpected error migrating profile for user ${backup.user_id}: ${error.message}`, 'ERROR');
      }
    }
    
  } catch (error) {
    log(`Error in backup migration: ${error.message}`, 'ERROR');
  }
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  log('Starting profile creation monitoring...');
  log(`Monitoring interval: ${MONITORING_INTERVAL / 1000} seconds`);
  log(`Log file: ${LOG_FILE}`);
  
  // Initial checks
  await checkProfileHealth();
  await checkRlsPolicies();
  await migrateBackupProfiles();
  
  // Set up periodic monitoring
  setInterval(async () => {
    log('--- Periodic Health Check ---');
    await checkProfileHealth();
    await migrateBackupProfiles();
  }, MONITORING_INTERVAL);
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    log('Monitoring stopped by user');
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    log('Monitoring stopped by system');
    process.exit(0);
  });
}

// Start monitoring if run directly
if (require.main === module) {
  startMonitoring().catch(error => {
    log(`Fatal error: ${error.message}`, 'ERROR');
    process.exit(1);
  });
}

module.exports = {
  checkProfileHealth,
  checkRlsPolicies,
  migrateBackupProfiles
};