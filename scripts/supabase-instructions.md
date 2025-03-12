# Supabase Database Setup Instructions

Follow these steps to set up your database tables in Supabase:

## Step 1: Access the Supabase Dashboard

1. Go to [https://app.supabase.com/](https://app.supabase.com/)
2. Log in with your credentials
3. Select your project from the dashboard

## Step 2: Open the SQL Editor

1. In the left sidebar, click on "SQL Editor"
2. Click on "New Query" to create a new SQL query

## Step 3: Run the SQL Migration

1. Open the file `supabase/migrations/combined-migrations.sql` in your local project
2. Copy the entire contents of this file
3. Paste it into the SQL Editor in the Supabase dashboard
4. Click the "Run" button to execute the SQL

This will:
- Create all the necessary tables (accounts, categories, transactions, invoices, etc.)
- Set up row-level security policies
- Insert sample data for your user

## Step 4: Verify the Setup

After running the SQL, you can verify that the tables were created and data was inserted:

1. In the left sidebar, click on "Table Editor"
2. You should see the following tables:
   - accounts
   - categories
   - transactions
   - invoices
   - reconciliations
   - reconciliation_items
   - report_configurations

3. Click on each table to view its contents. You should see sample data in:
   - accounts (1 record)
   - categories (15 records)
   - transactions (3 records)
   - invoices (1 record)

## Step 5: Test the Application

Now that your database is set up, you can test the application:

1. Go back to your terminal
2. Make sure the Next.js development server is running:
   ```
   export PATH="/opt/homebrew/opt/node@18/bin:$PATH" && npm run dev
   ```
3. Open your browser and navigate to http://localhost:3000
4. Sign in with your credentials (amanmohammedali@outlook.com)
5. You should now be able to see and interact with your financial data

## Troubleshooting

If you encounter any issues:

1. Check the browser console for errors
2. Check the terminal where Next.js is running for server-side errors
3. In the Supabase dashboard, go to "SQL Editor" and run:
   ```sql
   SELECT * FROM accounts WHERE user_id = auth.uid();
   SELECT * FROM categories WHERE user_id = auth.uid();
   SELECT * FROM transactions WHERE user_id = auth.uid();
   SELECT * FROM invoices WHERE user_id = auth.uid();
   ```
   to verify that data exists for your user 