-- This script helps diagnose issues with the user tables and permissions

-- Check the structure of the public.users table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM 
    information_schema.columns 
WHERE 
    table_schema = 'public' 
    AND table_name = 'users'
ORDER BY 
    ordinal_position;

-- Check if there are any constraints on the public.users table
SELECT 
    tc.constraint_name, 
    tc.constraint_type, 
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints tc
JOIN 
    information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
LEFT JOIN 
    information_schema.constraint_column_usage ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE 
    tc.table_schema = 'public'
    AND tc.table_name = 'users';

-- Check permissions on the public.users table
SELECT 
    grantee, 
    privilege_type
FROM 
    information_schema.role_table_grants
WHERE 
    table_schema = 'public'
    AND table_name = 'users';

-- Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM 
    information_schema.triggers
WHERE 
    event_object_schema = 'auth'
    AND event_object_table = 'users';

-- Check if the function exists
SELECT 
    proname,
    prosrc
FROM 
    pg_proc
WHERE 
    proname = 'handle_new_user';

-- Check if the check_auth_email function exists
SELECT 
    proname,
    prosrc
FROM 
    pg_proc
WHERE 
    proname = 'check_auth_email';

-- Check for any existing users in public.users
SELECT 
    id, 
    email, 
    name, 
    full_name, 
    user_id, 
    token_identifier, 
    created_at
FROM 
    public.users
LIMIT 5;

-- Check for any existing users in auth.users
SELECT 
    id, 
    email, 
    created_at
FROM 
    auth.users
LIMIT 5;

-- Check if there are any users in auth.users that don't have a corresponding record in public.users
SELECT 
    au.id, 
    au.email, 
    au.created_at
FROM 
    auth.users au
LEFT JOIN 
    public.users pu
    ON au.id = pu.id
WHERE 
    pu.id IS NULL
LIMIT 5;

-- Check if there are any users in public.users that don't have a corresponding record in auth.users
SELECT 
    pu.id, 
    pu.email, 
    pu.created_at
FROM 
    public.users pu
LEFT JOIN 
    auth.users au
    ON pu.id = au.id
WHERE 
    au.id IS NULL
LIMIT 5; 