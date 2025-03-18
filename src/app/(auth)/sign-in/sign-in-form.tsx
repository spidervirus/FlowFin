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
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { CheckCircle2 } from "lucide-react";

type SignInFormProps = {
  searchParams: Message;
};

export function SignInForm({ searchParams }: SignInFormProps) {
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { signIn } = useAuth();

  // Check for messages in sessionStorage on component mount
  useEffect(() => {
    const errorMsg = sessionStorage.getItem("error");
    const successMsg = sessionStorage.getItem("success");
    
    if (errorMsg) {
      setFormError(errorMsg);
      sessionStorage.removeItem("error");
    }
    
    if (successMsg) {
      setFormSuccess(successMsg);
      sessionStorage.removeItem("success");
    }
    
    // Check for error in URL params
    if (searchParams && "error" in searchParams) {
      setFormError(searchParams.error);
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    
    if (!email || !password) {
      setFormError("Email and password are required");
      setIsLoading(false);
      return;
    }
    
    try {
      const { success, error } = await signIn(email, password);
      
      if (error) {
        // Use our error handler to get a user-friendly message
        const appError = handleError(error);
        setFormError(appError.message);
      } else if (success) {
        // Check if there's a redirect URL in sessionStorage
        const redirectUrl = sessionStorage.getItem("redirectUrl");
        if (redirectUrl) {
          sessionStorage.removeItem("redirectUrl");
          router.push(redirectUrl);
        } else {
          // Default redirect to dashboard
          router.push("/dashboard");
        }
      }
    } catch (error) {
      console.error("Sign in error:", error);
      const appError = handleError(error);
      setFormError(appError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Sign In</h1>
        <p className="text-muted-foreground">
          Enter your credentials to access your account
        </p>
      </div>

      {formError && (
        <FormErrorMessage 
          message={formError} 
          variant="destructive" 
          onDismiss={() => setFormError(null)}
        />
      )}
      
      {formSuccess && (
        <Alert className="bg-success/10 border-success/30 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{formSuccess}</AlertDescription>
        </Alert>
      )}
      
      {searchParams && "error" in searchParams && !formError && (
        <FormErrorMessage 
          message={searchParams.error} 
          variant="destructive"
        />
      )}
      
      {searchParams && "success" in searchParams && (
        <Alert className="bg-success/10 border-success/30 text-success">
          <CheckCircle2 className="h-4 w-4" />
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>{searchParams.success}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
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
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link
              href="/reset-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            name="password"
            type="password"
            placeholder="••••••••"
            required
            autoComplete="current-password"
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
              Signing in...
            </>
          ) : (
            "Sign In"
          )}
        </button>
      </form>

      <div className="text-center text-sm">
        Don&apos;t have an account?{" "}
        <Link href="/sign-up" className="text-primary hover:underline">
          Sign up
        </Link>
      </div>
    </div>
  );
} 