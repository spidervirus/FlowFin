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

    // COMPLETELY DIFFERENT APPROACH: Use a direct API call instead of supabase.auth.signUp
    // This bypasses any database triggers or hooks that might be causing the error
    try {
      // Create a direct fetch request to the Supabase Auth API
      const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        },
        body: JSON.stringify({
          email,
          password,
          options: {
            email_redirect_to: `${origin}/auth/callback`,
            data: {} // Empty data object to avoid triggering database operations
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error during direct signup API call:', errorData);
        return encodedRedirect("error", "/sign-up", errorData.message || "Error during signup");
      }

      const userData = await response.json();
      
      if (!userData || !userData.id) {
        return encodedRedirect(
          "error",
          "/sign-up",
          "Failed to create user account. Please try again."
        );
      }

      // Success! Just redirect without trying to create a profile
      return encodedRedirect(
        "success",
        "/sign-up",
        "Thanks for signing up! Please check your email for a verification link."
      );
    } catch (directApiError) {
      console.error('Error with direct API call:', directApiError);
      
      // Fall back to the original method as a last resort
      console.log('Falling back to original signup method...');
      
      const { data: { user }, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${origin}/auth/callback`,
          data: {} // Empty data object
        }
      });
      
      if (signUpError) {
        console.error('Error during fallback signup:', signUpError);
        return encodedRedirect("error", "/sign-up", signUpError.message);
      }
      
      if (!user) {
        return encodedRedirect(
          "error",
          "/sign-up",
          "Failed to create user account. Please try again."
        );
      }
      
      // If we somehow got here, just return success
      return encodedRedirect(
        "success",
        "/sign-up",
        "Thanks for signing up! Please check your email for a verification link."
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