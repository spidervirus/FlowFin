// Script to create a new user and update existing records
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

async function createNewUser() {
  // Use a slightly different email to avoid conflicts
  const oldEmail = "machalil4@gmail.com";
  const newEmail = "machalil4+fixed@gmail.com";
  const password = "Password123!";
  const oldUserId = "ffaf268b-b8cc-4c90-b48b-2e101aca4f66";

  console.log("Creating new user with email:", newEmail);

  try {
    // Create a new user
    console.log("\n1. Creating new user...");

    const { data: createData, error: createError } =
      await supabase.auth.admin.createUser({
        email: newEmail,
        password,
        email_confirm: true,
        user_metadata: { full_name: "Aman" },
      });

    if (createError) {
      console.error("Error creating new user:", createError.message);
      return;
    }

    console.log("New user created successfully:", {
      id: createData.user.id,
      email: createData.user.email,
    });

    const newUserId = createData.user.id;

    // Update the email in auth.users to match the original email
    console.log("\n2. Updating email in auth system...");

    const { error: updateAuthError } = await supabase.auth.admin.updateUserById(
      newUserId,
      { email: oldEmail },
    );

    if (updateAuthError) {
      console.error(
        "Error updating email in auth system:",
        updateAuthError.message,
      );
    } else {
      console.log("Email updated successfully in auth system");
    }

    // Update public.users table
    console.log("\n3. Updating public.users table...");

    // First, check if there's an entry for the new user ID
    const { data: newUserData, error: newUserError } = await supabase
      .from("users")
      .select("*")
      .eq("id", newUserId);

    if (newUserError) {
      console.error(
        "Error checking for new user in public.users:",
        newUserError.message,
      );
    } else if (newUserData && newUserData.length > 0) {
      console.log("New user entry found in public.users, deleting it...");

      // Delete the new entry
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", newUserId);

      if (deleteError) {
        console.error("Error deleting new user entry:", deleteError.message);
      } else {
        console.log("New user entry deleted");
      }
    }

    // Update the old entry
    const { error: updateError } = await supabase
      .from("users")
      .update({
        id: newUserId,
        user_id: newUserId,
        token_identifier: newUserId,
        email: oldEmail, // Keep the original email
      })
      .eq("id", oldUserId);

    if (updateError) {
      console.error("Error updating public.users:", updateError.message);
    } else {
      console.log("public.users table updated successfully");
    }

    // Update user_profiles_backup table
    console.log("\n4. Updating user_profiles_backup table...");

    const { error: backupUpdateError } = await supabase
      .from("user_profiles_backup")
      .update({
        id: newUserId,
        user_id: newUserId,
        token_identifier: newUserId,
        email: oldEmail, // Keep the original email
      })
      .eq("id", oldUserId);

    if (backupUpdateError) {
      console.error(
        "Error updating user_profiles_backup:",
        backupUpdateError.message,
      );
    } else {
      console.log("user_profiles_backup table updated successfully");
    }

    // Update manual_user_registry table
    console.log("\n5. Updating manual_user_registry table...");

    const { error: manualUpdateError } = await supabase
      .from("manual_user_registry")
      .update({
        id: newUserId,
        email: oldEmail, // Keep the original email
      })
      .eq("id", oldUserId);

    if (manualUpdateError) {
      console.error(
        "Error updating manual_user_registry:",
        manualUpdateError.message,
      );
    } else {
      console.log("manual_user_registry table updated successfully");
    }

    // Try to sign in with the original email
    console.log("\n6. Attempting to sign in with the original email...");

    const { data: signInData, error: signInError } =
      await supabase.auth.signInWithPassword({
        email: oldEmail,
        password,
      });

    if (signInError) {
      console.error(
        "Error signing in with original email:",
        signInError.message,
      );

      // Try with the new email
      console.log("\n7. Attempting to sign in with the new email...");

      const { data: signInNewData, error: signInNewError } =
        await supabase.auth.signInWithPassword({
          email: newEmail,
          password,
        });

      if (signInNewError) {
        console.error(
          "Error signing in with new email:",
          signInNewError.message,
        );
      } else {
        console.log("Sign in successful with new email:", {
          id: signInNewData.user.id,
          email: signInNewData.user.email,
        });

        console.log(
          "\nNOTE: The user can now sign in with the email:",
          newEmail,
        );
        console.log(
          "You may want to update the application to handle both emails or update the user's email in the auth system.",
        );
      }
    } else {
      console.log("Sign in successful with original email:", {
        id: signInData.user.id,
        email: signInData.user.email,
      });
    }
  } catch (error) {
    console.error("Exception creating new user:", error);
  }
}

// Run the function
createNewUser().catch((err) => {
  console.error("Unhandled error:", err);
  process.exit(1);
});
