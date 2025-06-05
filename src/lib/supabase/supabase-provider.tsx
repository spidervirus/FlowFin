"use client";

import react from "react";
import {
  createClientComponentClient,
  User,
} from "@supabase/auth-helpers-nextjs";
import { SupabaseClient } from "@supabase/supabase-js";
import { getAuthCookieOptions } from '@/lib/utils/cookies';

interface SupabaseContextType {
  supabase: SupabaseClient;
  user: User | null;
  isLoading: boolean;
}

const SupabaseContext = react.createContext<SupabaseContextType | undefined>(
  undefined,
);

export function SupabaseProvider({ children }: { children: React.ReactNode }) {
  const [supabase] = react.useState(() => createClientComponentClient({
    cookieOptions: {
      ...getAuthCookieOptions(),
      secure: process.env.NODE_ENV === 'production',
      domain: isBrowser() ? window.location.hostname : undefined,
    }
  }));
  const [user, setUser] = react.useState<User | null>(null);
  const [isLoading, setIsLoading] = react.useState(true);
  const isMounted = react.useRef(true);

  react.useEffect(() => {
    // Set mounted flag
    isMounted.current = true;
    let authListener: { data: { subscription: { unsubscribe: () => void } } } | null = null;

    const getUser = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase.auth.getUser();
        
        if (error) {
          console.error('Error getting user:', error.message);
          if (isMounted.current) {
            setUser(null);
          }
        } else if (isMounted.current) {
          setUser(data.user);
        }
      } catch (error) {
        console.error('Unexpected error during getUser:', error);
        if (isMounted.current) {
          setUser(null);
        }
      } finally {
        if (isMounted.current) {
          setIsLoading(false);
        }
      }
    };

    // Get initial user
    getUser();

    // Setup auth listener with error handling
    try {
      // Listen for auth changes
      authListener = supabase.auth.onAuthStateChange((event, session) => {
        console.debug('Auth state changed:', event);
        if (isMounted.current) {
          setUser(session?.user ?? null);
          // Set loading to false once we have auth state
          setIsLoading(false);
        }
      });
    } catch (error) {
      console.error('Error setting up auth listener:', error);
      if (isMounted.current) {
        setIsLoading(false);
      }
    }

    // Clean up on unmount
    return () => {
      isMounted.current = false;
      if (authListener?.data?.subscription) {
        try {
          authListener.data.subscription.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from auth listener:', error);
        }
      }
    };
  }, [supabase]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = react.useMemo(() => ({
    supabase,
    user,
    isLoading
  }), [supabase, user, isLoading]);

  return (
    <SupabaseContext.Provider value={contextValue}>
      {children}
    </SupabaseContext.Provider>
  );
}

export function useSupabase() {
  const context = react.useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error("useSupabase must be used within a SupabaseProvider");
  }
  return context;
}

// Utility function to safely check if we're in a browser environment
export function isBrowser(): boolean {
  return typeof window !== 'undefined';
}
