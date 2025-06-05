// Script to run the user_preferences migration
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: ".env.local" });

// Get Supabase URL and service role key from environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error(
    "Missing Supabase URL or service role key in environment variables",
  );
  process.exit(1);
}

// Create Supabase client with service role
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log("Running user_preferences migration...");

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240726_add_user_preferences.sql",
    );
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    // Execute the migration SQL
    const { error } = await supabase.rpc("exec_sql", { sql: migrationSql });

    if (error) {
      console.error("Error running migration:", error.message);
      return false;
    }

    console.log("Migration executed successfully");
    return true;
  } catch (err) {
    console.error("Exception running migration:", err.message);
    return false;
  }
}

async function main() {
  console.log("Starting user_preferences migration...");

  // Run the migration
  const migrationSuccess = await runMigration();

  if (!migrationSuccess) {
    console.error("Migration failed");
    process.exit(1);
  }

  console.log("Migration completed successfully");
  process.exit(0);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
