// Script to test user creation
const { createClient } = require("@supabase/supabase-js");
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

async function createUser() {
  const email = "machalil4@gmail.com";
  const password = "Password123!";

  console.log("Creating user with email:", email);

  try {
    // First try with our robust function
    const { data: robustData, error: robustError } = await supabase.rpc(
      "create_auth_user_robust",
      {
        p_user_id: null,
        p_email: email,
        p_password: password,
        p_user_metadata: { full_name: "Test User" },
      },
    );

    if (robustError) {
      console.error(
        "Error creating user with robust function:",
        robustError.message,
      );
    } else {
      console.log(
        "User created successfully with robust function:",
        robustData,
      );
      return;
    }

    // Try with admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: "Test User" },
    });

    if (error) {
      console.error("Error creating user with admin API:", error.message);
    } else {
      console.log("User created successfully with admin API:", data);
    }
  } catch (error) {
    console.error("Exception creating user:", error);
  }
}

// Run the function
createUser().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
