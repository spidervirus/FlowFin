"use server";

import { createClient } from "@/lib/supabase/client";
import { redirect } from "next/navigation";
import { AuthError } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";

export async function signUpAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const fullName = formData.get("full_name") as string;

  if (!email || !password || !fullName) {
    redirect("/sign-up?error=All fields are required");
  }

  if (password.length < 6) {
    redirect("/sign-up?error=Password must be at least 6 characters long");
  }

  try {
    const supabase = createClient();

    // First check if user exists
    const { data: existingUser } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (existingUser) {
      redirect("/sign-up?error=A user with this email already exists");
    }

    // Create the user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
        },
      },
    });

    if (error) throw error;

    revalidatePath("/", "layout");
    redirect("/sign-in?message=Please check your email to verify your account");
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/sign-up?error=${encodeURIComponent(error.message)}`);
    }
    redirect("/sign-up?error=Failed to create account");
  }
}

export async function signInAction(formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    redirect("/sign-in?error=Email and password are required");
  }

  try {
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) throw error;

    revalidatePath("/", "layout");
    redirect("/dashboard");
  } catch (error) {
    if (error instanceof AuthError) {
      redirect(`/sign-in?error=${encodeURIComponent(error.message)}`);
    }
    redirect("/sign-in?error=Invalid email or password");
  }
}

export async function signOutAction() {
  try {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    revalidatePath("/", "layout");
    redirect("/");
  } catch (error) {
    console.error("Error signing out:", error);
    redirect("/?error=Failed to sign out");
  }
}
