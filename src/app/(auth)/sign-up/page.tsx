"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SignUp({
  searchParams,
}: {
  searchParams?: { message?: string; error?: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.get("email")?.toString().toLowerCase(), // Ensure email is lowercase
          password: formData.get("password"),
          fullName: formData.get("full_name"),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("A user with this email already exists");
        } else if (data.error) {
          throw new Error(data.error);
        } else {
          throw new Error("Failed to create account");
        }
      }

      // Success - redirect to sign-in
      router.push(
        "/sign-in?message=Please check your email to verify your account",
      );
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-center justify-center bg-background px-4 py-16 mt-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        {(searchParams?.message || searchParams?.error || error) && (
          <FormMessage
            message={
              searchParams?.error || error
                ? { error: searchParams?.error || error || "" }
                : { message: searchParams?.message || "" }
            }
            className="mb-4"
          />
        )}

        <form action={onSubmit} className="flex flex-col space-y-6">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Create Account
            </h1>
            <p className="text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link
                className="text-primary font-medium hover:underline transition-all"
                href="/sign-in"
              >
                Sign in
              </Link>
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                name="full_name"
                type="text"
                placeholder="John Doe"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="you@example.com"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm Password</Label>
              <Input
                id="confirm_password"
                name="confirm_password"
                type="password"
                placeholder="••••••••"
                required
                disabled={loading}
              />
            </div>
          </div>

          <SubmitButton disabled={loading}>
            {loading ? "Creating Account..." : "Create Account"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
