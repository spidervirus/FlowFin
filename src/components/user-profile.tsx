"use client";
import { UserCircle, Loader2 } from "lucide-react";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useRef } from "react";

export default function UserProfile() {
  const router = useRouter();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isMounted = useRef(true);

  // Handle cleanup on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleSignOut = async () => {
    if (isSigningOut) return; // Prevent multiple clicks
    
    try {
      setIsSigningOut(true);
      
      const supabase = createClient();
      
      // Set a timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        const id = setTimeout(() => {
          clearTimeout(id);
          reject(new Error('Sign out timeout'));
        }, 3000);
      });
      
      // Race the sign out against a timeout
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        timeoutPromise
      ]);
      
      // Only navigate if component is still mounted
      if (isMounted.current) {
        router.push("/sign-in");
      }
    } catch (error) {
      console.error("Error signing out:", error);
      
      // Force navigation on error
      if (isMounted.current) {
        router.push("/sign-in");
      }
    } finally {
      // Reset signing out state if component is still mounted
      if (isMounted.current) {
        setIsSigningOut(false);
      }
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={isSigningOut}>
        <Button variant="ghost" size="icon">
          {isSigningOut ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <UserCircle className="h-6 w-6" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem 
          onClick={handleSignOut}
          disabled={isSigningOut}
        >
          {isSigningOut ? "Signing out..." : "Sign out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
