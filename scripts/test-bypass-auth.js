// Script to test the bypass auth function
const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
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

async function testBypassAuth() {
  const email = "machalil4@gmail.com";
  const password = "Password123!";

  console.log("Testing bypass auth for user:", email);

  try {
    // First, apply the migration to add the bypass auth function
    console.log("\n1. Applying migration to add bypass auth function...");

    const migrationPath = path.join(
      __dirname,
      "../supabase/migrations/20240725_add_bypass_auth_function.sql",
    );
    const sql = fs.readFileSync(migrationPath, "utf8");

    try {
      // Try to execute the SQL directly using a custom function if available
      const { error: execError } = await supabase.rpc("exec_sql", { sql });

      if (execError) {
        console.error("Error executing migration via RPC:", execError.message);
        console.log(
          "Please run the migration manually using the Supabase SQL Editor",
        );
      } else {
        console.log("Migration applied successfully");
      }
    } catch (execError) {
      console.error("Exception executing migration:", execError);
      console.log(
        "Please run the migration manually using the Supabase SQL Editor",
      );
    }

    // Now test the bypass auth function
    console.log("\n2. Testing bypass_auth_for_user function...");

    const { data: bypassData, error: bypassError } = await supabase.rpc(
      "bypass_auth_for_user",
      { p_email: email, p_password: password },
    );

    if (bypassError) {
      console.error("Error calling bypass_auth_for_user:", bypassError.message);
    } else {
      console.log("Bypass auth result:", bypassData);

      if (bypassData.success) {
        // If authentication was successful, generate a session
        console.log("\n3. Generating session for bypassed user...");

        const { data: sessionData, error: sessionError } = await supabase.rpc(
          "generate_session_for_bypassed_user",
          { p_user_id: bypassData.user.id },
        );

        if (sessionError) {
          console.error("Error generating session:", sessionError.message);
        } else {
          console.log("Session generated successfully:", sessionData);

          // Store the session information for use in the application
          console.log("\n4. Session information for application use:");
          console.log("User ID:", sessionData.user.id);
          console.log("Session ID:", sessionData.session.id);
          console.log("Expires at:", sessionData.session.expires_at);

          // Create a file with the session information
          const sessionInfo = {
            userId: sessionData.user.id,
            sessionId: sessionData.session.id,
            expiresAt: sessionData.session.expires_at,
            email: sessionData.user.email,
            fullName: sessionData.user.full_name,
          };

          fs.writeFileSync(
            path.join(__dirname, "session-info.json"),
            JSON.stringify(sessionInfo, null, 2),
          );

          console.log(
            "\nSession information saved to scripts/session-info.json",
          );
        }
      }
    }
  } catch (error) {
    console.error("Exception testing bypass auth:", error);
  }
}

// Run the function
testBypassAuth().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
