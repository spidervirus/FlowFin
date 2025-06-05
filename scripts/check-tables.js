// Script to check if tables exist in the database
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTables() {
  console.log("Checking database tables...");

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

  // Check if accounts table exists and has data
  const { data: accounts, error: accountsError } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId);

  if (accountsError) {
    console.error("Error querying accounts table:", accountsError);
  } else {
    console.log(
      `Accounts table exists with ${accounts ? accounts.length : 0} records for this user`,
    );
    if (accounts && accounts.length > 0) {
      console.log("Sample account:", accounts[0]);
    }
  }

  // Check if categories table exists and has data
  const { data: categories, error: categoriesError } = await supabase
    .from("categories")
    .select("*")
    .eq("user_id", userId);

  if (categoriesError) {
    console.error("Error querying categories table:", categoriesError);
  } else {
    console.log(
      `Categories table exists with ${categories ? categories.length : 0} records for this user`,
    );
    if (categories && categories.length > 0) {
      console.log("Sample category:", categories[0]);
    }
  }

  // Check if transactions table exists and has data
  const { data: transactions, error: transactionsError } = await supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId);

  if (transactionsError) {
    console.error("Error querying transactions table:", transactionsError);
  } else {
    console.log(
      `Transactions table exists with ${transactions ? transactions.length : 0} records for this user`,
    );
    if (transactions && transactions.length > 0) {
      console.log("Sample transaction:", transactions[0]);
    }
  }

  // Check if invoices table exists and has data
  const { data: invoices, error: invoicesError } = await supabase
    .from("invoices")
    .select("*")
    .eq("user_id", userId);

  if (invoicesError) {
    console.error("Error querying invoices table:", invoicesError);
  } else {
    console.log(
      `Invoices table exists with ${invoices ? invoices.length : 0} records for this user`,
    );
    if (invoices && invoices.length > 0) {
      console.log("Sample invoice:", invoices[0]);
    }
  }
}

async function main() {
  console.log("Starting database check...");

  try {
    await checkTables();
    console.log("Database check completed!");
  } catch (error) {
    console.error("Error checking database:", error);
  }
}

main().catch((err) => {
  console.error("Error executing script:", err);
  process.exit(1);
});
