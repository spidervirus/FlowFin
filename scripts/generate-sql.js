// Script to generate a SQL file that can be run in the Supabase dashboard
const fs = require('fs');
const path = require('path');

function generateSql() {
  console.log('Generating SQL file...');
  
  // Read the financial tables migration file
  const financialTablesSql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20240702000001_create_financial_tables.sql'),
    'utf8'
  );
  
  // Read the invoices table migration file
  const invoicesTableSql = fs.readFileSync(
    path.join(__dirname, '../supabase/migrations/20240703000001_create_invoices_table.sql'),
    'utf8'
  );
  
  // Generate the SQL file
  const sql = `
-- This SQL file was generated to create the necessary tables for the FlowFin application
-- Run this in the Supabase SQL Editor

-- Create financial tables
${financialTablesSql}

-- Create invoices table
${invoicesTableSql}

-- Insert sample data (replace 'your-user-id' with your actual user ID)
INSERT INTO accounts (name, type, balance, currency, institution, account_number, is_active, user_id)
VALUES ('Checking Account', 'checking', 5000.00, 'USD', 'Demo Bank', 'XXXX1234', true, auth.uid());

INSERT INTO categories (name, type, color, is_active, user_id)
VALUES 
  ('Salary', 'income', '#4CAF50', true, auth.uid()),
  ('Groceries', 'expense', '#F44336', true, auth.uid()),
  ('Rent', 'expense', '#2196F3', true, auth.uid());

-- Insert transactions (you'll need to replace the account_id and category_id with actual IDs)
-- This part should be run after creating accounts and categories
/*
INSERT INTO transactions (date, description, amount, type, category_id, account_id, status, user_id)
VALUES 
  (CURRENT_DATE, 'Monthly Salary', 5000.00, 'income', 
   (SELECT id FROM categories WHERE name = 'Salary' AND user_id = auth.uid() LIMIT 1),
   (SELECT id FROM accounts WHERE name = 'Checking Account' AND user_id = auth.uid() LIMIT 1),
   'completed', auth.uid()),
  (CURRENT_DATE, 'Grocery Shopping', 150.00, 'expense', 
   (SELECT id FROM categories WHERE name = 'Groceries' AND user_id = auth.uid() LIMIT 1),
   (SELECT id FROM accounts WHERE name = 'Checking Account' AND user_id = auth.uid() LIMIT 1),
   'completed', auth.uid());
*/

-- Insert invoice (you'll need to replace the account_id with an actual ID)
-- This part should be run after creating accounts
/*
INSERT INTO invoices (invoice_number, date, due_date, account_id, client_name, client_email, client_address, notes, items, total_amount, status, user_id)
VALUES (
  'INV-001',
  CURRENT_DATE,
  CURRENT_DATE + INTERVAL '30 days',
  (SELECT id FROM accounts WHERE name = 'Checking Account' AND user_id = auth.uid() LIMIT 1),
  'ACME Corporation',
  'billing@acme.com',
  '123 Main St, Anytown, USA',
  'Thank you for your business!',
  '[{"description":"Consulting Services","quantity":10,"rate":150,"amount":1500},{"description":"Software License","quantity":1,"rate":500,"amount":500}]',
  2000.00,
  'sent',
  auth.uid()
);
*/
`;
  
  // Write the SQL file
  const outputPath = path.join(__dirname, '../supabase/migrations/combined-migrations.sql');
  fs.writeFileSync(outputPath, sql);
  
  console.log(`SQL file generated at: ${outputPath}`);
}

generateSql(); 