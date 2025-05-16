"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth/auth-context";
import { Button } from "./ui/button";
import { BarChart3, Menu, AlertTriangle } from "lucide-react";
import UserProfile from "./user-profile";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import DashboardNavbar from "./dashboard-navbar";
import { Alert, AlertDescription } from "./ui/alert";

export default function Navbar() {
  const pathname = usePathname();
  const mountedRef = useRef(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  
  // Use try/catch to handle potential auth context errors
  let user = null;
  let isLoading = true;
  
  try {
    const auth = useAuth();
    user = auth.user;
    isLoading = auth.isLoading;
  } catch (error) {
    console.error("Error accessing auth context:", error);
    setAuthError("Authentication service unavailable");
  }

  // Cleanup function when component unmounts
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // If we're on a dashboard route, render the dashboard navbar
  if (pathname?.startsWith('/dashboard')) {
    return <DashboardNavbar />;
  }
  
  // Add margin to the page content to account for fixed navbar
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.style.paddingTop = '60px';
    }
    return () => {
      if (typeof document !== 'undefined') {
        document.body.style.paddingTop = '0';
      }
    };
  }, []);

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 fixed top-0 left-0 right-0 z-[100]">
      {authError && (
        <Alert variant="destructive" className="absolute top-0 left-0 right-0 z-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{authError}</AlertDescription>
        </Alert>
      )}
      <div className="container mx-auto px-4 flex justify-between items-center">
        <Link href="/" prefetch className="text-xl font-bold flex items-center">
          <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
          <span>FlowFin</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex space-x-6">
          <Link
            href="/features"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/resources"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Resources
          </Link>
          <Link
            href="/about"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            About
          </Link>
        </div>

        {/* User Actions */}
        <div className="flex gap-4 items-center">
          {/* Show login/signup buttons when loading or on error, authenticated content when logged in */}
          {isLoading || authError ? (
            // While loading or on error, show login/signup buttons for landing page
            <>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          ) : user ? (
            <>
              <Link href="/dashboard" className="hidden sm:block">
                <Button variant="outline" className="font-medium">
                  Dashboard
                </Button>
              </Link>
              <UserProfile />
            </>
          ) : (
            <>
              <Link
                href="/sign-in"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Get Started
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div className={`${isMobileMenuOpen ? '' : 'hidden'} md:hidden`}>
        <div className="px-4 pt-2 pb-3 space-y-1">
          <Link
            href="/features"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Features
          </Link>
          <Link
            href="/pricing"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/resources"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Resources
          </Link>
          <Link
            href="/about"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            About
          </Link>
          {!isLoading && !authError && user && (
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              Dashboard
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
