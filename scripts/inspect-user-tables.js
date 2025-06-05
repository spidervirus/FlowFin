// Script to inspect user tables directly
const { createClient } = require("@supabase/supabase-js");
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

async function inspectUserTables() {
  const email = "machalil4@gmail.com";

  console.log("Inspecting database tables for user with email:", email);

  try {
    // Query auth.users table using SQL
    console.log("\n1. Checking auth.users table...");
    const { data: authUsers, error: authError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `SELECT * FROM auth.users WHERE email = '${email}'`,
      },
    );

    if (authError) {
      console.error("Error querying auth.users:", authError.message);

      // Try alternative approach with direct query
      console.log("Trying alternative approach for auth.users...");
      const { data: authUsersAlt, error: authErrorAlt } = await supabase
        .from("auth_users_view") // Check if a view exists
        .select("*")
        .eq("email", email);

      if (authErrorAlt) {
        if (authErrorAlt.message.includes("does not exist")) {
          console.log("auth_users_view does not exist");
        } else {
          console.error(
            "Error with alternative approach:",
            authErrorAlt.message,
          );
        }
      } else {
        console.log(`Found ${authUsersAlt.length} records in auth_users_view:`);
        console.log(JSON.stringify(authUsersAlt, null, 2));
      }
    } else {
      console.log(`Found ${authUsers.length} records in auth.users:`);
      console.log(JSON.stringify(authUsers, null, 2));
    }

    // Query public.users table
    console.log("\n2. Checking public.users table...");
    const { data: publicUsers, error: publicError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (publicError) {
      console.error("Error querying public.users:", publicError.message);
    } else {
      console.log(`Found ${publicUsers.length} records in public.users:`);
      console.log(JSON.stringify(publicUsers, null, 2));
    }

    // Query user_profiles_backup table
    console.log("\n3. Checking user_profiles_backup table...");
    const { data: backupUsers, error: backupError } = await supabase
      .from("user_profiles_backup")
      .select("*")
      .eq("email", email);

    if (backupError) {
      console.error(
        "Error querying user_profiles_backup:",
        backupError.message,
      );
    } else {
      console.log(
        `Found ${backupUsers.length} records in user_profiles_backup:`,
      );
      console.log(JSON.stringify(backupUsers, null, 2));
    }

    // Query manual_user_registry table if it exists
    console.log("\n4. Checking manual_user_registry table...");
    const { data: manualUsers, error: manualError } = await supabase
      .from("manual_user_registry")
      .select("*")
      .eq("email", email);

    if (manualError) {
      if (manualError.message.includes("does not exist")) {
        console.log("manual_user_registry table does not exist");
      } else {
        console.error(
          "Error querying manual_user_registry:",
          manualError.message,
        );
      }
    } else {
      console.log(
        `Found ${manualUsers.length} records in manual_user_registry:`,
      );
      console.log(JSON.stringify(manualUsers, null, 2));
    }

    // Try to list all users through admin API
    console.log("\n5. Listing all users through admin API...");
    const { data: allUsers, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error(
        "Error listing users through admin API:",
        listError.message,
      );
    } else {
      console.log(
        `Found ${allUsers.users.length} total users through admin API`,
      );

      // Find our user
      const user = allUsers.users.find((u) => u.email === email);

      if (user) {
        console.log("User found in admin API list:", {
          id: user.id,
          email: user.email,
          created_at: user.created_at,
          confirmed_at: user.email_confirmed_at,
        });
      } else {
        console.log("User not found in admin API list");
      }
    }

    // Try to create a new user with the same email
    console.log("\n6. Attempting to create a new user with the same email...");
    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email,
        password: "Password123!",
        email_confirm: true,
      });

    if (createError) {
      console.error("Error creating user:", createError.message);

      if (createError.message.includes("already exists")) {
        console.log(
          "This confirms the user exists in the auth system but might be in an inconsistent state",
        );
      }
    } else {
      console.log("User created successfully:", createData);
    }
  } catch (error) {
    console.error("Exception during inspection:", error);
  }
}

// Run the function
inspectUserTables().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
