# Fixing "Database error saving new user" in FlowFin

If you're encountering a "Database error saving new user" when trying to sign up, follow these steps to fix the issue.

## The Problem

The error occurs because the database is trying to access a table called `categories` that doesn't exist. This happens during the user signup process when a database trigger or function is executed.

The specific error is:
```
ERROR: relation "categories" does not exist (SQLSTATE 42P01)
```

## Solution Options

### Option 1: Apply the SQL Fix Through Supabase Dashboard (Recommended)

This is the most reliable solution that will permanently fix the issue:

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL from `supabase/migrations/fix-categories-table.sql`
6. Click "Run" to execute the SQL

This script:
- Checks if the `categories` table exists
- Creates the table if it doesn't exist
- Sets up the necessary triggers and policies

### Option 2: Run the Fix Script (Alternative)

If you have Node.js installed and the necessary environment variables set up, you can run the fix script:

1. Make sure your `.env` file contains the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

2. Run the fix script:
   ```bash
   node scripts/fix-categories-table.js
   ```

### Option 3: Apply All Migrations in Order

If you're setting up the project from scratch, make sure to apply all migrations in the correct order:

1. Log in to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the "SQL Editor" section in the left sidebar
4. Apply the migrations in this order:
   - `initial-setup.sql`
   - `20240701000001_create_user_management_tables.sql`
   - `20240702000001_create_financial_tables.sql` (This creates the categories table)
   - `20240702000002_add_recurring_transactions.sql`
   - `20240703000001_create_invoices_table.sql`
   - `20240704000001_create_budget_tables.sql`
   - `20240704000001_create_receipt_items_table.sql`
   - `20240705000001_create_financial_goals_tables.sql`
   - `20240710000001_create_user_trigger.sql`
   - `fix-user-signup-trigger.sql`

## Verifying the Fix

After applying the fix, you should be able to sign up without encountering the "Database error saving new user" error. To verify:

1. Try signing up with a new email address
2. If successful, you should be redirected to the dashboard or receive a verification email
3. If you still encounter issues, check the console logs for more details

## Additional Troubleshooting

If you continue to experience issues:

1. Check if the `categories` table was created successfully:
   ```sql
   SELECT * FROM information_schema.tables 
   WHERE table_schema = 'public' AND table_name = 'categories';
   ```

2. Verify that the user signup trigger is working:
   ```sql
   SELECT * FROM pg_trigger WHERE tgname = 'on_auth_user_created';
   ```

3. Check for any errors in the database logs through the Supabase dashboard

For further assistance, please contact the development team. 