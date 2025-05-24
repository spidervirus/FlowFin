"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { FormMessage } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function SignUp({
  searchParams,
}: {
  searchParams?: { message?: string; error?: string };
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);

  useEffect(() => {
    async function fetchCsrfToken() {
      try {
        setLoading(true);
        const res = await fetch('/api/auth/csrf-token');
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.error || 'Failed to fetch CSRF token');
        }
        const data = await res.json();
        if (!data.csrfToken) {
          throw new Error('CSRF token not found in response');
        }
        setCsrfToken(data.csrfToken);
      } catch (err) {
        console.error("Failed to fetch CSRF token:", err);
        setError(err instanceof Error ? err.message : "Failed to initialize form. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchCsrfToken();
  }, []);

  async function onSubmit(formData: FormData) {
    setLoading(true);
    setError(null);

    if (!csrfToken) {
      setError("CSRF token is not available. Please refresh and try again.");
      setLoading(false);
      return;
    }

    if (!termsAccepted) {
      setError("You must accept the terms and conditions to create an account.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-CSRF-Token": csrfToken,
        },
        body: JSON.stringify({
          email: formData.get("email")?.toString().toLowerCase(),
          password: formData.get("password"),
          name: formData.get("name"),
          terms: termsAccepted,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409) {
          throw new Error("A user with this email already exists");
        } else if (data.error && typeof data.error === 'string') {
          throw new Error(data.error);
        } else if (data.error && typeof data.error === 'object') {
          const fieldErrors = Object.values(data.error).flat().join(", ");
          throw new Error(fieldErrors || "Failed to create account due to validation errors.");
        } else {
          throw new Error("Failed to create account (unknown server error)");
        }
      }

      router.push(
        "/dashboard"
      );
    } catch (err) {
      console.error("Sign up error:", err);
      setError(err instanceof Error ? err.message : "Failed to create account (client error)");
    } finally {
      setLoading(false);
    }
  }

  const formMessageContent = 
    searchParams?.error || error
      ? { error: searchParams?.error || error || "An unexpected error occurred. Please try again." }
      : searchParams?.message
      ? { message: searchParams.message }
      : null;

  return (
    <div className="flex flex-col items-center justify-center bg-background px-4 py-16 mt-16">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-sm">
        {formMessageContent && (
          <FormMessage
            message={formMessageContent}
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
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                name="name"
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
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="terms" 
                checked={termsAccepted} 
                onCheckedChange={(checked) => setTermsAccepted(checked as boolean)}
                disabled={loading}
              />
              <Label htmlFor="terms" className="text-sm font-normal">
                I accept the{" "}
                <Link href="/terms" className="underline hover:text-primary">
                  terms and conditions
                </Link>
              </Label>
            </div>
          </div>

          <SubmitButton disabled={loading || !csrfToken || !termsAccepted}>
            {loading ? "Creating Account..." : "Create Account"}
          </SubmitButton>
        </form>
      </div>
    </div>
  );
}
