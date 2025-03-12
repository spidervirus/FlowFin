// Script to execute SQL migration files directly
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Function to create tables and insert data
async function createFinancialTables() {
  console.log('Creating financial tables...');
  
  // Sign in with the provided test user credentials
  const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
    email: 'amanmohammedali@outlook.com',
    password: 'Amanandme12',
  });
  
  if (signInError) {
    console.error('Error signing in with test user:', signInError);
    return;
  }
  
  console.log('Signed in with test user');
  const userId = signInData.user.id;
  
  // Create accounts table
  const { error: accountsError } = await supabase.from('accounts').insert({
    name: 'Checking Account',
    type: 'checking',
    balance: 5000.00,
    currency: 'USD',
    institution: 'Demo Bank',
    account_number: 'XXXX1234',
    is_active: true,
    user_id: userId
  });
  
  if (accountsError) {
    console.error('Error creating accounts table:', accountsError);
  } else {
    console.log('Successfully created accounts table');
  }
  
  // Create categories table
  const { error: categoriesError } = await supabase.from('categories').insert([
    {
      name: 'Salary',
      type: 'income',
      color: '#4CAF50',
      is_active: true,
      user_id: userId
    },
    {
      name: 'Groceries',
      type: 'expense',
      color: '#F44336',
      is_active: true,
      user_id: userId
    },
    {
      name: 'Rent',
      type: 'expense',
      color: '#2196F3',
      is_active: true,
      user_id: userId
    }
  ]);
  
  if (categoriesError) {
    console.error('Error creating categories table:', categoriesError);
  } else {
    console.log('Successfully created categories table');
  }
  
  // Create transactions table
  const { data: accounts } = await supabase.from('accounts').select('*').eq('user_id', userId).limit(1);
  const { data: categories } = await supabase.from('categories').select('*').eq('user_id', userId).limit(3);
  
  if (accounts && accounts.length > 0 && categories && categories.length > 0) {
    const { error: transactionsError } = await supabase.from('transactions').insert([
      {
        date: new Date().toISOString().split('T')[0],
        description: 'Monthly Salary',
        amount: 5000.00,
        type: 'income',
        category_id: categories[0].id,
        account_id: accounts[0].id,
        status: 'completed',
        user_id: userId
      },
      {
        date: new Date().toISOString().split('T')[0],
        description: 'Grocery Shopping',
        amount: 150.00,
        type: 'expense',
        category_id: categories[1].id,
        account_id: accounts[0].id,
        status: 'completed',
        user_id: userId
      }
    ]);
    
    if (transactionsError) {
      console.error('Error creating transactions table:', transactionsError);
    } else {
      console.log('Successfully created transactions table');
    }
    
    // Create invoices table
    const { error: invoicesError } = await supabase.from('invoices').insert({
      invoice_number: 'INV-001',
      date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      account_id: accounts[0].id,
      client_name: 'ACME Corporation',
      client_email: 'billing@acme.com',
      client_address: '123 Main St, Anytown, USA',
      notes: 'Thank you for your business!',
      items: JSON.stringify([
        {
          description: 'Consulting Services',
          quantity: 10,
          rate: 150,
          amount: 1500
        },
        {
          description: 'Software License',
          quantity: 1,
          rate: 500,
          amount: 500
        }
      ]),
      total_amount: 2000.00,
      status: 'sent',
      user_id: userId
    });
    
    if (invoicesError) {
      console.error('Error creating invoices table:', invoicesError);
    } else {
      console.log('Successfully created invoices table');
    }
  }
}

async function main() {
  console.log('Starting database setup...');
  
  try {
    // Create financial tables and invoices
    await createFinancialTables();
    
    console.log('Database setup completed!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

main()
  .catch(err => {
    console.error('Error executing migrations:', err);
    process.exit(1);
  }); 