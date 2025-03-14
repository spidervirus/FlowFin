"use server";

import { encodedRedirect } from "@/utils/utils";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "../../supabase/server";
import { createAdminClient } from "../../supabase/admin";
import { v4 as uuidv4 } from 'uuid';

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const fullName = formData.get("full_name")?.toString() || '';
  const supabase = await createClient();
  const origin = headers().get("origin");

  if (!email || !password) {
    return encodedRedirect("error", "/sign-up", "Email and password are required");
  }

  try {
    // First, check if the user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('email')
      .eq('email', email)
      .limit(1);
    
    if (checkError) {
      console.error('Error checking for existing user:', checkError);
    }
    
    if (existingUsers && existingUsers.length > 0) {
      return encodedRedirect(
        "error",
        "/sign-up",
        "A user with this email already exists. Please sign in instead."
      );
    }

    // Create the user in auth.users WITHOUT any metadata
    // This is critical - the metadata is causing the database error
    const { data: { user }, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${origin}/auth/callback`,
        // IMPORTANT: Do NOT include any metadata here
      }
    });
    
    if (signUpError) {
      console.error('Error during signup:', signUpError);
      return encodedRedirect("error", "/sign-up", signUpError.message);
    }
    
    if (!user) {
      return encodedRedirect(
        "error",
        "/sign-up",
        "Failed to create user account. Please try again."
      );
    }

    // Now we need to create the user profile in public.users
    // But we need to use the service role client to bypass RLS
    try {
      // Try to create the admin client
      const adminSupabase = await createAdminClient();
      
      // Use the admin client to insert the user profile
      const { error: insertError } = await adminSupabase
        .from('users')
        .insert({
          id: user.id,
          email: email,
          name: fullName || email.split('@')[0],
          full_name: fullName || email.split('@')[0],
          user_id: user.id,
          token_identifier: user.id,
          created_at: new Date().toISOString()
        });
      
      if (insertError) {
        console.error('Error creating user profile with admin client:', insertError);
        
        // If admin client fails, try a different approach
        // Let's try to update the user metadata and hope the trigger works
        const { error: updateError } = await supabase.auth.updateUser({
          data: {
            full_name: fullName,
          }
        });
        
        if (updateError) {
          console.error('Error updating user metadata:', updateError);
          return encodedRedirect(
            "warning",
            "/sign-up",
            "Your account was created, but there was an issue setting up your profile. You can still sign in."
          );
        }
        
        return encodedRedirect(
          "success",
          "/sign-up",
          "Thanks for signing up! Please check your email for a verification link."
        );
      }
      
      return encodedRedirect(
        "success",
        "/sign-up",
        "Thanks for signing up! Please check your email for a verification link."
      );
    } catch (profileError) {
      console.error('Error in user profile creation:', profileError);
      
      // If all else fails, just return success and let the user try to sign in
      // The trigger might still work on its own
      return encodedRedirect(
        "warning",
        "/sign-up",
        "Your account was created, but there was an issue setting up your profile. You can still sign in."
      );
    }
  } catch (err) {
    console.error('Unexpected error during signup:', err);
    return encodedRedirect(
      "error",
      "/sign-up",
      "An unexpected error occurred. Please try again."
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
  }

  return redirect("/dashboard");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = headers().get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/protected/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/protected/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Passwords do not match",
    );
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect(
      "error",
      "/dashboard/reset-password",
      "Password update failed",
    );
  }

  encodedRedirect("success", "/protected/reset-password", "Password updated");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};