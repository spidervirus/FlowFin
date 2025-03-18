'use client';

import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "./ui/button";
import { BarChart3, Menu, X } from "lucide-react";
import UserProfile from "./user-profile";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useRef } from "react";
import { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const mountedRef = useRef(true);
  const supabase = createClient();

  const getUser = useCallback(async () => {
    try {
      const { data } = await supabase.auth.getUser();
      if (mountedRef.current) {
        setUser(data.user);
      }
    } catch (error) {
      console.error("Error fetching user:", error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [supabase.auth]);

  useEffect(() => {
    // Set up auth state listener
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (mountedRef.current) {
        setUser(session?.user ?? null);
        setIsLoading(false);
      }
    });

    // Get initial user
    getUser();

    // Cleanup
    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [getUser, supabase.auth]);
  
  if (isLoading) {
    return (
      <nav className="w-full border-b border-gray-200 bg-white py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Link href="/" prefetch className="text-xl font-bold flex items-center">
            <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
            <span>FlowFin</span>
          </Link>
        </div>
      </nav>
    );
  }

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 sticky top-0 z-50">
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
          {/* <Link
            href="/pricing"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Pricing
          </Link> */}
          {/* <Link
            href="/resources"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            Resources
          </Link> */}
          <Link
            href="/about"
            className="text-gray-600 hover:text-gray-900 font-medium transition-colors"
          >
            About
          </Link>
        </div>

        {/* User Actions */}
        <div className="flex gap-4 items-center">
          {user ? (
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
              {/* <Link
                href="/sign-in"
                className="items-center justify-center px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                Sign In
              </Link> */}
              <Link
                href="#waitlist"
                className="items-center justify-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
              >
                Join Waitlist
              </Link>
            </>
          )}

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-100 transition-colors"
            onClick={() => {
              const mobileMenu = document.getElementById('mobile-menu');
              mobileMenu?.classList.toggle('hidden');
            }}
          >
            <Menu className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      <div id="mobile-menu" className="hidden md:hidden">
        <div className="px-4 pt-2 pb-3 space-y-1">
          <Link
            href="/features"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Features
          </Link>
          {/* <Link
            href="/pricing"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Pricing
          </Link> */}
          {/* <Link
            href="/resources"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            Resources
          </Link> */}
          <Link
            href="/about"
            className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
          >
            About
          </Link>
          {user && (
            <Link
              href="/dashboard"
              className="block px-3 py-2 text-base font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors"
            >
              Dashboard
            </Link>
          )}
          {!user && (
            <Link
              href="#waitlist"
              className="block px-3 py-2 text-base font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
            >
              Join Waitlist
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}
