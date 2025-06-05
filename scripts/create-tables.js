// Script to create tables using the migration files
const { createClient } = require("@supabase/supabase-js");
const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log("Creating database tables...");

  // Sign in with the provided test user credentials
  const { data: signInData, error: signInError } =
    await supabase.auth.signInWithPassword({
      email: "amanmohammedali@outlook.com",
      password: "Amanandme12",
    });

  if (signInError) {
    console.error("Error signing in with test user:", signInError);
    return;
  }

  console.log("Signed in with test user");
  const userId = signInData.user.id;

  // Read the financial tables migration file
  const financialTablesSql = fs.readFileSync(
    path.join(
      __dirname,
      "../supabase/migrations/20240702000001_create_financial_tables.sql",
    ),
    "utf8",
  );

  // Read the invoices table migration file
  const invoicesTableSql = fs.readFileSync(
    path.join(
      __dirname,
      "../supabase/migrations/20240703000001_create_invoices_table.sql",
    ),
    "utf8",
  );

  console.log("Migration files read successfully");

  // Execute the SQL directly using the REST API
  const response = await fetch(`${supabaseUrl}/rest/v1/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: supabaseKey,
      Authorization: `Bearer ${signInData.session.access_token}`,
    },
    body: JSON.stringify({
      query: `
        -- Create financial tables
        ${financialTablesSql}
        
        -- Create invoices table
        ${invoicesTableSql}
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    console.error("Error executing SQL:", errorData);
  } else {
    console.log("SQL executed successfully");
  }

  // Now let's insert some sample data
  // Create accounts
  const { error: accountsError } = await supabase.from("accounts").insert({
    name: "Checking Account",
    type: "checking",
    balance: 5000.0,
    currency: "USD",
    institution: "Demo Bank",
    account_number: "XXXX1234",
    is_active: true,
    user_id: userId,
  });

  if (accountsError) {
    console.error("Error inserting account:", accountsError);
  } else {
    console.log("Account inserted successfully");
  }

  // Create categories
  const { error: categoriesError } = await supabase.from("categories").insert([
    {
      name: "Salary",
      type: "income",
      color: "#4CAF50",
      is_active: true,
      user_id: userId,
    },
    {
      name: "Groceries",
      type: "expense",
      color: "#F44336",
      is_active: true,
      user_id: userId,
    },
    {
      name: "Rent",
      type: "expense",
      color: "#2196F3",
      is_active: true,
      user_id: userId,
    },
  ]);

  if (categoriesError) {
    console.error("Error inserting categories:", categoriesError);
  } else {
    console.log("Categories inserted successfully");
  }
}

async function main() {
  console.log("Starting database setup...");

  try {
    await createTables();
    console.log("Database setup completed!");
  } catch (error) {
    console.error("Error setting up database:", error);
  }
}

main().catch((err) => {
  console.error("Error executing script:", err);
  process.exit(1);
});
