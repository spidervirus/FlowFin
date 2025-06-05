# Profile Creation Debugging and Monitoring

This document outlines the comprehensive debugging and monitoring system implemented to address profile creation issues, particularly RLS (Row Level Security) policy violations and backup table fallbacks.

## Overview

The system includes multiple layers of error handling, debugging utilities, and monitoring tools to ensure reliable user profile creation during the signup process.

## Components

### 1. Enhanced Signup Route (`src/app/api/auth/signup/route.ts`)

The signup route now includes:
- Comprehensive error handling with user-friendly messages
- Integration with the ProfileDebugger utility
- Detailed logging for debugging purposes
- Fallback mechanisms for profile creation failures

**Key Features:**
- Detects RLS violations and provides appropriate user feedback
- Handles unique constraint violations (duplicate accounts)
- Logs detailed error information for debugging
- Uses backup table insertion when main table fails

### 2. Profile Debug Utility (`src/lib/utils/profile-debug.ts`)

A comprehensive debugging utility that provides:

#### ProfileDebugger Class
- **Authentication Context Analysis**: Checks auth.uid(), user roles, and session state
- **Profile Existence Verification**: Checks both main and backup tables
- **RLS Policy Analysis**: Attempts to identify RLS policy issues
- **Backup Table Fallback**: Automatic fallback to backup table on failures
- **Delayed Verification**: Checks if profiles were created despite errors

#### Helper Functions
- `createProfileWithDebug()`: Main profile creation function with comprehensive error handling
- `monitorProfileCreationHealth()`: Health monitoring for profile creation system

### 3. Enhanced Database Trigger (`supabase/migrations/20240328000002_fix_organization_tables.sql`)

The `handle_new_user()` trigger function includes:
- Enhanced logging with detailed context
- RLS violation detection and handling
- Automatic backup table insertion on failures
- Comprehensive error categorization

### 4. Monitoring Scripts

#### RLS Investigation Script (`scripts/investigate-rls-policies.js`)
- Analyzes RLS policies on profiles table
- Checks for policy conflicts and misconfigurations
- Provides recommendations for fixing RLS issues

#### Profile Creation Monitor (`scripts/monitor-profile-creation.js`)
- Real-time monitoring of profile creation health
- Automatic migration of backup profiles to main table
- Periodic health checks and alerting
- Comprehensive logging to file

## Error Types and Handling

### 1. RLS Policy Violations
**Symptoms:**
- Error code: `PGRST116` or `insufficient_privilege`
- Profiles may be created despite error messages
- Users see "Profile creation failed" messages

**Handling:**
- Automatic detection of RLS violations
- Fallback to backup table insertion
- Delayed verification to check if profile was actually created
- User-friendly error messages

### 2. Unique Constraint Violations
**Symptoms:**
- Error code: `23505`
- Duplicate key value violations

**Handling:**
- Detection of existing profiles
- Graceful handling with appropriate user messages
- Continuation of signup process if profile exists

### 3. Network/Connection Issues
**Symptoms:**
- Timeout errors
- Connection failures

**Handling:**
- Retry mechanisms in ProfileDebugger
- Fallback to backup table
- Comprehensive error logging

## Monitoring and Alerting

### Health Check Metrics
- Users without profiles in last 24 hours
- Backup table usage frequency
- RLS policy violation rates
- Profile creation success rates

### Log Files
- Application logs: Standard application logging
- Monitor logs: `logs/profile-monitoring.log`
- Database logs: PostgreSQL logs for trigger execution

## Usage Instructions

### Running the Monitor
```bash
# Set environment variables
export NEXT_PUBLIC_SUPABASE_URL="your-supabase-url"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"

# Run the monitoring script
node scripts/monitor-profile-creation.js
```

### Running RLS Investigation
```bash
node scripts/investigate-rls-policies.js
```

### Manual Profile Creation with Debug
```typescript
import { createProfileWithDebug } from '@/lib/utils/profile-debug';

const result = await createProfileWithDebug({
  userId: 'user-id',
  email: 'user@example.com',
  name: 'User Name',
  fullName: 'Full User Name',
  role: 'user',
  timestamp: new Date().toISOString()
}, supabaseClient);

if (result.success) {
  console.log('Profile created:', result.profileId);
} else {
  console.error('Profile creation failed:', result.error);
  console.log('Debug info:', result.debugInfo);
}
```

## Troubleshooting

### Common Issues

1. **RLS Policies Too Restrictive**
   - Check if policies allow INSERT for authenticated users
   - Verify auth.uid() is properly set during signup
   - Consider using SECURITY DEFINER functions

2. **Backup Table Accumulation**
   - Run migration script to move backup profiles to main table
   - Investigate root cause of main table failures
   - Check RLS policies and permissions

3. **High Error Rates**
   - Review application logs for patterns
   - Check database connection stability
   - Verify Supabase service status

### Debug Steps

1. **Check Recent Failures**
   ```sql
   SELECT * FROM user_profiles_backup 
   WHERE created_at > NOW() - INTERVAL '24 hours'
   ORDER BY created_at DESC;
   ```

2. **Verify RLS Policies**
   ```sql
   SELECT * FROM pg_policies 
   WHERE tablename = 'profiles';
   ```

3. **Check Auth Context**
   ```sql
   SELECT auth.uid(), auth.role(), current_user;
   ```

4. **Test Profile Creation**
   ```sql
   INSERT INTO profiles (user_id, email, name, full_name, role)
   VALUES ('test-user-id', 'test@example.com', 'Test', 'Test User', 'user');
   ```

## Configuration

### Environment Variables
- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Service role key for admin operations
- `PROFILE_DEBUG_ENABLED`: Enable/disable debug logging (default: true in development)

### Monitoring Settings
- `MONITORING_INTERVAL`: How often to run health checks (default: 30 seconds)
- `MAX_BACKUP_AGE`: Maximum age of backup profiles before alerting (default: 24 hours)
- `RETRY_ATTEMPTS`: Number of retry attempts for failed operations (default: 3)

## Future Improvements

1. **Real-time Alerting**
   - Slack/Discord notifications for high error rates
   - Email alerts for critical failures

2. **Dashboard Integration**
   - Web-based monitoring dashboard
   - Real-time metrics and charts

3. **Automated Recovery**
   - Automatic RLS policy fixes
   - Self-healing profile creation

4. **Performance Optimization**
   - Batch processing for backup migrations
   - Optimized RLS policies

## Support

For issues related to profile creation:
1. Check the monitoring logs
2. Run the RLS investigation script
3. Review recent backup table entries
4. Contact the development team with detailed error information