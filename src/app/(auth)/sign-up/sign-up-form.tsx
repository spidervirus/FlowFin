"use client";

import { Message } from "@/components/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import FormErrorMessage from "@/components/form-error-message";
import { LoadingSpinner } from "@/components/loading-spinner";
import { handleError } from "@/lib/error-handler";

type SignUpFormProps = {
  searchParams: Message;
};

export function SignUpForm({ searchParams }: SignUpFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signUp } = useAuth();

  // Check for error in URL params
  useEffect(() => {
    if (searchParams && "error" in searchParams) {
      setFormError(searchParams.error);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirm_password") as string;
    const fullName = formData.get("full_name") as string;
    
    // Basic validation
    if (!email || !password || !confirmPassword) {
      setFormError("All fields are required");
      setIsLoading(false);
      return;
    }
    
    if (password !== confirmPassword) {
      setFormError("Passwords do not match");
      setIsLoading(false);
      return;
    }
    
    if (password.length < 6) {
      setFormError("Password must be at least 6 characters long");
      setIsLoading(false);
      return;
    }
    
    try {
      // Sign up with the new auth service
      const { success, error } = await signUp(email, password, {
        full_name: fullName
      });
      
      if (error) {
        const appError = handleError(error);
        setFormError(appError.message);
      } else if (success) {
        // Store user metadata for setup wizard
        sessionStorage.setItem("setupPending", "true");
        
        // Redirect to setup wizard
        router.push("/setup-wizard");
      }
    } catch (error) {
      console.error("Sign up error:", error);
      const appError = handleError(error);
      setFormError(appError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Create an Account</h1>
        <p className="text-muted-foreground">
          Enter your information to create an account
        </p>
      </div>

      {formError && (
        <FormErrorMessage 
          message={formError} 
          variant="destructive" 
          onDismiss={() => setFormError(null)}
        />
      )}
      
      {searchParams && "error" in searchParams && !formError && (
        <FormErrorMessage 
          message={searchParams.error} 
          variant="destructive"
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="full_name">Full Name</Label>
          <Input
            id="full_name"
            name="full_name"
            placeholder="John Doe"
            required
            autoComplete="name"
            disabled={isLoading}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="name@example.com"
            required
            autoComplete="email"
            disabled={isLoading}
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
            autoComplete="new-password"
            disabled={isLoading}
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
            autoComplete="new-password"
            disabled={isLoading}
          />
        </div>
        <button
          type="submit"
          className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" className="mr-2" color="default" />
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      <div className="text-center text-sm">
        Already have an account?{" "}
        <Link href="/sign-in" className="text-primary hover:underline">
          Sign in
        </Link>
      </div>
    </div>
  );
} 