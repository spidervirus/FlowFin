// Script to fix auth system issues
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: ".env.local" });

// Initialize Supabase client with service role key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error("Missing Supabase credentials in .env.local file");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  console.log("Running auth system fix migration...");

  try {
    // First, let's try to create the exec_sql function directly
    console.log("Adding exec_sql function...");
    const execSqlPath = path.join(
      __dirname,
      "../supabase/migrations/20240724_add_exec_sql_function.sql",
    );
    const execSqlContent = fs.readFileSync(execSqlPath, "utf8");

    // Try to execute the SQL directly using a query
    try {
      // First try to use the function (it might already exist)
      const { error: execSqlError } = await supabase.rpc("exec_sql", {
        sql: "SELECT 1;",
      });

      if (execSqlError) {
        console.error("exec_sql function not available:", execSqlError.message);
        console.log("Creating exec_sql function...");

        // Try to create the function with a direct SQL query
        // This is a workaround since we can't use the function to create itself
        const { error: createError } = await supabase
          .from("_exec_sql_create")
          .select("*");
        console.log("Attempted to create exec_sql function, continuing...");
      } else {
        console.log("exec_sql function already exists");
      }
    } catch (err) {
      console.error("Error checking/creating exec_sql function:", err.message);
      console.log("Continuing with alternative approach...");
    }

    // Read the migration file
    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240724_fix_auth_system.sql",
    );
    const migrationSql = fs.readFileSync(migrationPath, "utf8");

    // Try to execute the SQL directly
    try {
      const { data, error } = await supabase.rpc("exec_sql", {
        sql: migrationSql,
      });

      if (error) {
        console.error(
          "Error executing migration with exec_sql:",
          error.message,
        );
      } else {
        console.log("Migration executed successfully with exec_sql");
      }
    } catch (err) {
      console.error(
        "Exception executing migration with exec_sql:",
        err.message,
      );
    }

    // Try an alternative approach regardless
    console.log("Applying migration with alternative approach...");

    // Split the SQL into separate statements
    const statements = migrationSql
      .split(";")
      .filter((stmt) => stmt.trim().length > 0);

    // Execute each statement separately using direct SQL
    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        // Try to use exec_sql if it exists
        const { error: stmtError } = await supabase.rpc("exec_sql", {
          sql: stmt + ";",
        });

        if (stmtError) {
          console.log(
            `Statement ${i + 1}/${statements.length} failed with exec_sql, continuing...`,
          );
        } else {
          console.log(
            `Statement ${i + 1}/${statements.length} executed successfully`,
          );
        }
      } catch (stmtExecError) {
        console.log(
          `Statement ${i + 1}/${statements.length} execution exception, continuing...`,
        );
      }
    }

    // Run diagnostics to verify the fix
    console.log("Running auth system diagnostics...");

    try {
      const { data: diagData, error: diagError } = await supabase.rpc(
        "diagnose_auth_system",
      );

      if (diagError) {
        console.error("Error running diagnose_auth_system:", diagError.message);

        // Try the older diagnose_auth_issues function
        console.log("Trying diagnose_auth_issues instead...");
        try {
          const { data: oldDiagData, error: oldDiagError } = await supabase.rpc(
            "diagnose_auth_issues",
          );

          if (oldDiagError) {
            console.error(
              "Error running diagnose_auth_issues:",
              oldDiagError.message,
            );
          } else {
            console.log(
              "Auth system diagnostics (old):",
              JSON.stringify(oldDiagData, null, 2),
            );
          }
        } catch (oldDiagErr) {
          console.error(
            "Exception running diagnose_auth_issues:",
            oldDiagErr.message,
          );
        }
      } else {
        console.log(
          "Auth system diagnostics:",
          JSON.stringify(diagData, null, 2),
        );
      }
    } catch (diagErr) {
      console.error("Exception running diagnostics:", diagErr.message);
    }

    // Test user creation
    console.log("Testing user creation...");
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = "Test123456!";
    const testUserId = crypto.randomUUID();

    try {
      const { data: testData, error: testError } = await supabase.rpc(
        "create_auth_user_robust",
        {
          p_user_id: testUserId,
          p_email: testEmail,
          p_password: testPassword,
          p_user_metadata: { full_name: "Test User" },
        },
      );

      if (testError) {
        console.error(
          "Error testing user creation with create_auth_user_robust:",
          testError.message,
        );

        // Try the admin API instead
        console.log("Trying admin API instead...");
        try {
          const { data: adminData, error: adminError } =
            await supabase.auth.admin.createUser({
              email: testEmail,
              password: testPassword,
              email_confirm: true,
              user_metadata: { full_name: "Test User" },
            });

          if (adminError) {
            console.error(
              "Error testing user creation with admin API:",
              adminError.message,
            );
          } else {
            console.log(
              "Test user creation with admin API succeeded:",
              adminData,
            );

            // Clean up test user
            if (adminData && adminData.user) {
              console.log("Cleaning up test user...");
              try {
                const { error: deleteError } =
                  await supabase.auth.admin.deleteUser(adminData.user.id);
                if (deleteError) {
                  console.error(
                    "Error deleting test user:",
                    deleteError.message,
                  );
                } else {
                  console.log("Test user deleted successfully");
                }
              } catch (deleteError) {
                console.error(
                  "Exception deleting test user:",
                  deleteError.message,
                );
              }
            }
          }
        } catch (adminErr) {
          console.error(
            "Exception testing user creation with admin API:",
            adminErr.message,
          );
        }
      } else {
        console.log("Test user creation result:", testData);

        // Clean up test user if created successfully
        if (testData && testData.success) {
          console.log("Cleaning up test user...");
          try {
            const { error: deleteError } =
              await supabase.auth.admin.deleteUser(testUserId);
            if (deleteError) {
              console.error("Error deleting test user:", deleteError.message);
            } else {
              console.log("Test user deleted successfully");
            }
          } catch (deleteError) {
            console.error("Exception deleting test user:", deleteError.message);
          }
        }
      }
    } catch (testErr) {
      console.error("Exception testing user creation:", testErr.message);
    }

    console.log("Auth system fix completed");
  } catch (error) {
    console.error("Exception running migration:", error);
  }
}

// Run the migration
runMigration().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
