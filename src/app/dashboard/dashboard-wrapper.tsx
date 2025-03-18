"use client";

import React, { useEffect, useState } from "react";
import DashboardNavbar from "@/components/dashboard-navbar";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth/auth-context";
import ErrorBoundary from "@/components/error-boundary";
import { handleError, showErrorToast } from "@/lib/error-handler";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function DashboardWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    const checkAuth = async () => {
      try {
        setIsLoading(true);
        const isUserAuthenticated = await isAuthenticated();
        
        if (!isUserAuthenticated) {
          // Store the current URL to redirect back after login
          if (typeof window !== 'undefined') {
            sessionStorage.setItem("redirectUrl", window.location.pathname);
          }
          router.push("/sign-in");
          return;
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error checking authentication:", error);
        const appError = handleError(error);
        showErrorToast(appError);
        
        // Redirect to sign-in on auth error
        if (typeof window !== 'undefined') {
          sessionStorage.setItem("redirectUrl", window.location.pathname);
        }
        router.push("/sign-in");
      }
    };
    
    checkAuth();
  }, [router, isAuthenticated]);
  
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }
  
  return (
    <ErrorBoundary>
      <div className="flex min-h-screen flex-col">
        <DashboardNavbar />
        <div className="flex-1">
          <main className="flex-1 p-4 md:p-6">{children}</main>
        </div>
      </div>
    </ErrorBoundary>
  );
} 