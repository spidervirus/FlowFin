// Script to fix auth user creation issues
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
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
  console.log("Running auth user creation fix migration...");

  try {
    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240726_fix_auth_user_creation.sql",
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

async function testUserCreation() {
  console.log("Testing user creation with new function...");

  // Generate a test email with timestamp to ensure uniqueness
  const testEmail = `test_${Date.now()}@example.com`;
  const testPassword = "Test123456!";
  const testUserId = crypto.randomUUID();

  try {
    // Test the new robust v2 function
    console.log(`Testing create_auth_user_robust_v2 with email: ${testEmail}`);
    const { data: robustData, error: robustError } = await supabase.rpc(
      "create_auth_user_robust_v2",
      {
        p_user_id: testUserId,
        p_email: testEmail,
        p_password: testPassword,
        p_user_metadata: { full_name: "Test User" },
      },
    );

    if (robustError) {
      console.error(
        "Error testing user creation with create_auth_user_robust_v2:",
        robustError.message,
      );
      return false;
    }

    console.log(
      "Test user creation with create_auth_user_robust_v2 succeeded:",
      robustData,
    );

    // Clean up test user
    if (robustData && robustData.success) {
      console.log("Cleaning up test user...");
      try {
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
          robustData.user.id,
        );
        if (deleteError) {
          console.error("Error deleting test user:", deleteError.message);
        } else {
          console.log("Test user deleted successfully");
        }
      } catch (deleteError) {
        console.error("Exception deleting test user:", deleteError.message);
      }
    }

    return robustData && robustData.success;
  } catch (err) {
    console.error("Exception testing user creation:", err.message);
    return false;
  }
}

async function diagnoseAuthSystem() {
  console.log("Diagnosing auth system...");

  try {
    const { data: diagData, error: diagError } = await supabase.rpc(
      "diagnose_auth_system_v2",
    );

    if (diagError) {
      console.error("Error diagnosing auth system:", diagError.message);
      return null;
    }

    console.log("Auth system diagnosis:", JSON.stringify(diagData, null, 2));
    return diagData;
  } catch (err) {
    console.error("Exception diagnosing auth system:", err.message);
    return null;
  }
}

async function main() {
  console.log("Starting auth user creation fix...");

  // First diagnose the auth system
  const initialDiagnosis = await diagnoseAuthSystem();

  // Run the migration
  const migrationSuccess = await runMigration();

  if (!migrationSuccess) {
    console.error("Migration failed, aborting");
    process.exit(1);
  }

  // Diagnose the auth system again after migration
  const postMigrationDiagnosis = await diagnoseAuthSystem();

  // Test user creation
  const testSuccess = await testUserCreation();

  if (testSuccess) {
    console.log("User creation test succeeded!");
    console.log("The auth system has been fixed successfully.");
  } else {
    console.error("User creation test failed.");
    console.log("The auth system may still have issues.");
  }

  process.exit(testSuccess ? 0 : 1);
}

main().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
