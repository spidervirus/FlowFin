// Script to update the Supabase database
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
  console.log('Connecting to Supabase database...');
  
  // Step 1: Create a user through Supabase Auth
  const email = 'demo@example.com';
  const password = 'Password123!';
  
  console.log(`Creating user with email: ${email}`);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: 'Demo User',
      }
    }
  });
  
  if (authError) {
    console.error('Error creating user through Auth:', authError);
    return;
  }
  
  console.log('User created successfully through Auth:', authData);
  
  // Wait a moment for the database triggers to create the user record
  console.log('Waiting for database triggers to complete...');
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Step 2: Fetch the user from the users table
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('*')
    .eq('email', email);
  
  if (usersError) {
    console.error('Error fetching user:', usersError);
    return;
  }
  
  if (!users || users.length === 0) {
    console.error('User not found in the database after creation');
    return;
  }
  
  const userId = users[0].id;
  console.log(`Found user with ID: ${userId}`);
  
  // Step 3: Insert sample data into the accounts table
  const { data: accounts, error: accountsError } = await supabase
    .from('accounts')
    .insert([
      {
        name: 'Checking Account',
        type: 'checking',
        balance: 5000.00,
        currency: 'USD',
        institution: 'Demo Bank',
        account_number: 'XXXX1234',
        is_active: true,
        user_id: userId
      },
      {
        name: 'Savings Account',
        type: 'savings',
        balance: 10000.00,
        currency: 'USD',
        institution: 'Demo Bank',
        account_number: 'XXXX5678',
        is_active: true,
        user_id: userId
      }
    ])
    .select();
  
  if (accountsError) {
    console.error('Error inserting accounts:', accountsError);
  } else {
    console.log('Successfully inserted accounts:', accounts);
  }
  
  // Step 4: Insert sample data into the categories table
  const { data: categories, error: categoriesError } = await supabase
    .from('categories')
    .insert([
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
    ])
    .select();
  
  if (categoriesError) {
    console.error('Error inserting categories:', categoriesError);
  } else {
    console.log('Successfully inserted categories:', categories);
  }
  
  // Step 5: Insert sample data into the transactions table
  if (accounts && categories) {
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .insert([
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
        },
        {
          date: new Date().toISOString().split('T')[0],
          description: 'Rent Payment',
          amount: 1200.00,
          type: 'expense',
          category_id: categories[2].id,
          account_id: accounts[0].id,
          status: 'completed',
          user_id: userId
        }
      ])
      .select();
    
    if (transactionsError) {
      console.error('Error inserting transactions:', transactionsError);
    } else {
      console.log('Successfully inserted transactions:', transactions);
    }
  }
  
  console.log('Database update completed!');
}

main()
  .catch(err => {
    console.error('Error updating database:', err);
    process.exit(1);
  }); 