// Script to test signing in with a user
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

async function testSignIn() {
  const email = "machalil4@gmail.com";
  const password = "Password123!";

  console.log("Testing sign-in with email:", email);

  try {
    // First, check if the user exists
    console.log("Checking if user exists...");

    try {
      const { data: existsData, error: existsError } = await supabase.rpc(
        "check_user_exists_by_email",
        { p_email: email },
      );

      if (existsError) {
        console.error("Error checking if user exists:", existsError.message);
      } else if (existsData && existsData.exists) {
        console.log("User exists:", existsData);
      } else {
        console.log("User does not exist");

        // Try to create the user
        console.log("Attempting to create user...");

        const { data: createData, error: createError } = await supabase.rpc(
          "create_auth_user_robust",
          {
            p_user_id: null,
            p_email: email,
            p_password: password,
            p_user_metadata: { full_name: "Test User" },
          },
        );

        if (createError) {
          console.error("Error creating user:", createError.message);
        } else {
          console.log("User created successfully:", createData);
        }
      }
    } catch (existsError) {
      console.error("Exception checking if user exists:", existsError);
    }

    // Try to sign in with the user
    console.log("Attempting to sign in...");

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (signInError) {
      console.error("Error signing in:", signInError.message);

      // Try to list all users
      console.log("Listing all users...");

      const { data: allUsers, error: listError } =
        await supabase.auth.admin.listUsers();

      if (listError) {
        console.error("Error listing users:", listError.message);
      } else {
        console.log(`Found ${allUsers.users.length} total users`);

        // Find our user
        const user = allUsers.users.find((u) => u.email === email);

        if (user) {
          console.log("User found in list:", {
            id: user.id,
            email: user.email,
            created_at: user.created_at,
            confirmed_at: user.email_confirmed_at,
          });

          // Try to reset the user's password
          console.log("Attempting to reset password for user ID:", user.id);

          const { data: resetData, error: resetError } =
            await supabase.auth.admin.updateUserById(user.id, { password });

          if (resetError) {
            console.error("Error resetting password:", resetError.message);
          } else {
            console.log("Password reset successfully");

            // Try signing in again
            console.log("Attempting to sign in again after password reset");

            const { data: signInAgainData, error: signInAgainError } =
              await supabase.auth.signInWithPassword({
                email,
                password,
              });

            if (signInAgainError) {
              console.error(
                "Error signing in after password reset:",
                signInAgainError.message,
              );
            } else {
              console.log("Sign in successful after password reset");
            }
          }
        } else {
          console.log("User not found in the list of users");
        }
      }
    } else {
      console.log("Sign in successful:", signInData);
    }
  } catch (error) {
    console.error("Exception testing sign-in:", error);
  }
}

// Run the function
testSignIn().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
