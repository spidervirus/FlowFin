# Fixing User Signup Issues in FlowFin

If you're encountering a "Database error saving new user" when trying to sign up, follow these steps to fix the issue:

## The Problem

The error occurs because when a user signs up, Supabase Auth creates a record in the `auth.users` table, but there's no automatic mechanism to create a corresponding record in your `public.users` table. The database constraints (particularly the `token_identifier` field being `NOT NULL UNIQUE`) aren't being satisfied.

Additionally, Row Level Security (RLS) policies on the `users` table may be preventing direct insertion of records.

## Solution Options

### Option 1: Apply the SQL Fix Through Supabase Dashboard (Recommended)

This is the most reliable solution that will permanently fix the issue:

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL from `supabase/migrations/fix-user-signup-trigger.sql`
6. Click "Run" to execute the SQL

**Important:** Make sure to run the entire script at once, not just parts of it.

This script:
- Creates a function that will automatically insert a record into `public.users` when a new user is created in `auth.users`
- Creates a trigger that calls this function
- Adds the necessary permissions
- Handles conflict cases to prevent errors
- Includes error handling to ensure the trigger doesn't fail even if there are issues
- Creates a helper function `check_auth_email` for checking if an email exists in auth.users
- Verifies that all functions and triggers were created successfully

### Option 2: Disable Row Level Security (Alternative)

If the trigger approach doesn't work, you can disable Row Level Security on the `users` table:

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL from `supabase/migrations/disable-rls-on-users.sql`
6. Click "Run" to execute the SQL

**Warning:** This reduces security by allowing all roles to access the `users` table. Only use this if you understand the security implications.

### Option 3: Use the Service Role Key (Code Solution)

The application has been updated to use the Supabase service role key to bypass RLS when creating user profiles:

1. Add your Supabase service role key to your `.env.local` file:
   ```
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```
   You can find this key in your Supabase dashboard under Project Settings > API.

2. The updated code will use this key to create user profiles even if RLS is enabled.

### Option 4: Use the Updated Code (Fallback Solution)

The application has been updated with multiple fallback mechanisms that should handle the error automatically:

1. First checks if a user with the email already exists in the public.users table
2. Creates the user in auth.users WITHOUT any metadata (this is critical to avoid the error)
3. Tries multiple approaches to create the user profile in public.users
4. Updates the user metadata separately AFTER profile creation

While this approach works, it's recommended to apply Option 1 for a permanent fix.

## Verifying the Fix

After applying any of the solutions:

1. Try signing up with a new user account
2. If the signup is successful, the fix has been applied correctly
3. You can verify by checking the `public.users` table in the Supabase Dashboard to see if the new user record was created

To check the `public.users` table:
1. Go to the "Table Editor" in the Supabase Dashboard
2. Select the "users" table
3. Look for the newly created user record

## Diagnosing Issues

If you're still having problems, you can run a diagnostic script to check your database setup:

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL from `supabase/migrations/diagnose-user-tables.sql`
6. Click "Run" to execute the SQL

This will show you:
- The structure of your `users` table
- Any constraints that might be causing issues
- Permissions on the table
- Whether the trigger and functions exist
- Any mismatches between `auth.users` and `public.users`

## Troubleshooting

If you're still encountering issues:

### 1. Check if the trigger was created successfully

Run this SQL in the Supabase Dashboard:
```sql
SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

If no results are returned, the trigger wasn't created.

### 2. Check if the functions were created successfully

```sql
-- Check handle_new_user function
SELECT * FROM pg_proc WHERE proname = 'handle_new_user';

-- Check check_auth_email function
SELECT * FROM pg_proc WHERE proname = 'check_auth_email';
```

### 3. Check for any permission issues

```sql
-- Grant necessary permissions again
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, anon, authenticated, service_role;

-- Grant specific permissions for auth schema
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT SELECT ON auth.users TO postgres, anon, authenticated, service_role;
```

### 4. Check the structure of your users table

Make sure your `public.users` table has all the necessary columns:

```sql
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'public' AND table_name = 'users';
```

The table should have at least these columns:
- `id` (uuid, NOT NULL)
- `email` (text or varchar)
- `name` (text or varchar)
- `full_name` (text or varchar)
- `user_id` (uuid)
- `token_identifier` (uuid, NOT NULL)
- `created_at` (timestamp)

### 5. Check if RLS is enabled on the users table

```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'users';
```

If `rowsecurity` is `true`, RLS is enabled and might be preventing insertions.

### 6. Check for RLS policies on the users table

```sql
SELECT * FROM pg_policies WHERE tablename = 'users';
```

### 7. Try the manual approach

If all else fails, you can try manually inserting a record into the `public.users` table after signing up:

```sql
INSERT INTO public.users (id, email, name, full_name, user_id, token_identifier, created_at)
VALUES ('your-user-id', 'your-email@example.com', 'Your Name', 'Your Name', 'your-user-id', 'your-user-id', NOW());
```

Replace the placeholder values with your actual user information.

## Need Further Help?

If you're still encountering issues after following these steps, please:

1. Check the Supabase logs in the Dashboard (under "Database" > "Logs")
2. Look for any error messages in your application logs
3. Try creating a new user directly through the Supabase Dashboard to see if that works
4. Reach out to Supabase support or community forums for assistance 