"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useRouter } from "next/navigation";
import { User, Session } from "@supabase/supabase-js";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { createClient } from '@/lib/supabase/client';
import {
  getAuthCookieName,
  getAuthCookieOptions,
  getAllCookies,
  hasAuthCookie,
  clearAuthCookie,
  logCookieDebugInfo,
  diagnoseCookieIssues
} from '@/lib/utils/cookies';

type AuthError = {
  message: string;
  code?: string;
};

export type AuthState = {
  isLoading: boolean;
  isAuthenticated: boolean;
  user: User | null;
  error: AuthError | null;
  session: Session | null;
};

type SignInResponse = {
  success: boolean;
  error?: string | null;
};

type AuthContextType = AuthState & {
  signIn: (email: string, password: string) => Promise<SignInResponse>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create a singleton instance of the Supabase client with consistent cookie options
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null;

const getSupabase = () => {
  if (!supabaseInstance) {
    // Create with enhanced secure cookie options
    const cookieOptions = {
      ...getAuthCookieOptions(),
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      sameSite: 'lax' as const,
      domain: process.env.NODE_ENV === 'production' ? process.env.NEXT_PUBLIC_SITE_URL?.replace('https://', '') : undefined,
      path: '/',
    };
    
    console.debug('[Auth Debug] Creating Supabase client with secure cookie options:', cookieOptions);
    
    supabaseInstance = createClientComponentClient({
      cookieOptions,
    });
    
    // Add debug listener for auth state changes
    if (typeof window !== 'undefined') {
      supabaseInstance.auth.onAuthStateChange((event, session) => {
        console.debug('[Auth Debug] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          accessToken: session?.access_token ? '[REDACTED]' : undefined,
          cookies: getAllCookies()
        });
      });
    }
  }
  return supabaseInstance;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    isLoading: true,
    isAuthenticated: false,
    user: null,
    session: null,
    error: null
  });

  // Use the consistent Supabase client from getSupabase instead of createClient
  const supabase = useRef(getSupabase());
  const currentUser = useRef<User | null>(null);
  const currentSession = useRef<Session | null>(null);
  const isInitialized = useRef(false);
  const navigationInProgress = useRef(false);

  const updateAuthState = useCallback((
    user: User | null,
    session: Session | null,
    error: AuthError | null = null,
    source: string = 'unknown'
  ) => {
    console.debug('[Auth Context Debug] Updating auth state:', {
      hasUser: !!user,
      hasSession: !!session,
      error,
      source,
      isInitialized: isInitialized.current
    });

    setState(prev => {
      // Only update if there's a change to prevent unnecessary re-renders
      if (
        prev.user?.id === user?.id &&
        prev.session?.access_token === session?.access_token &&
        prev.error === error &&
        prev.isAuthenticated === !!session
      ) {
        return prev;
      }

      return {
        ...prev,
        isAuthenticated: !!session,
        user,
        session,
        error,
        isLoading: false
      };
    });
  }, []);

  // Initialize auth state
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let isMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;

    const initializeAuth = async () => {
      try {
        console.debug('[Auth Context Debug] Initializing auth state');
        
          // Check for cookie issues using our utility
          if (typeof window !== 'undefined' && isMounted) {
            try {
              logCookieDebugInfo('Auth Context Init');
              const { hasIssues, issues } = diagnoseCookieIssues();
            
              if (hasIssues) {
                console.warn('[Auth Context Debug] Cookie issues detected:', issues);
              }
            } catch (cookieError) {
              console.error('[Auth Context Debug] Error checking cookies:', cookieError);
            }
          }
        
          // Use a safer approach to fetch session with timeout
          let sessionResult;
          
          try {
            // Start the fetch
            const fetchPromise = supabase.current.auth.getSession();
            
            // Create a timeout promise
            const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => {
                reject(new Error('Session fetch timeout'));
              }, 5000);
            });
            
            // Race the fetch against the timeout
            sessionResult = await Promise.race([
              fetchPromise,
              timeoutPromise
            ]);
            
            // Clear timeout after successful fetch
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
            }
          } catch (fetchError) {
            // Clear timeout if it exists
            if (timeoutId) {
              clearTimeout(timeoutId);
              timeoutId = null;
        }
        
            // Handle timeout or other errors
            sessionResult = { 
              data: { session: null },
              error: fetchError instanceof Error ? 
                fetchError : 
                new Error('Session fetch failed')
            };
          }
          
          // Guard against component unmounting during async operation
          if (!isMounted) return;
          
          let session: Session | null = null, error: any = null;
          if (
            sessionResult &&
            typeof sessionResult === 'object' &&
            'data' in sessionResult &&
            sessionResult.data && typeof sessionResult.data === 'object' && 'session' in sessionResult.data &&
            'error' in sessionResult
          ) {
            session = (sessionResult.data as { session?: Session | null }).session || null;
            error = sessionResult.error || null;
          } else {
            session = null;
            error = new Error('Session fetch failed');
          }
        
        if (error) {
          let errorMessage = 'Unknown error';
          if (error instanceof Error) {
            errorMessage = error.message;
          }
          console.error('[Auth Context Debug] Session error:', errorMessage);
          
          try {
          // Handle cookie-related errors specially
            if ((error instanceof Error && (error.message.includes('cookie') || error.message.includes('token') || error.message === 'Timeout'))) {
            console.debug('[Auth Context Debug] Cookie-related error detected, clearing session');
            
              try {
                // Try force cookie cleanup with secure cookie utilities
                if (typeof window !== 'undefined') {
                  clearAuthCookie();
                }
              } catch (clearError) {
                console.error('[Auth Context Debug] Error clearing auth state:', clearError);
              }
              
              if (isMounted) {
            updateAuthState(null, null, { 
              message: 'Session expired. Please sign in again.',
              code: 'cookie_error' 
            }, 'init-cookie-error');
              }
          } else {
              if (isMounted) {
                updateAuthState(null, null, { message: errorMessage }, 'init-error');
              }
            }
          } catch (handlingError) {
            console.error('[Auth Context Debug] Error handling auth error:', handlingError);
            // Ensure we still update state even if error handling fails
            if (isMounted) {
              updateAuthState(null, null, { message: 'Authentication error' }, 'error-handling-failed');
            }
          }
          return;
        }

        console.debug('[Auth Context Debug] Initial session check:', {
          hasSession: !!session,
          userId: session?.user?.id
        });

        if (session && isMounted) {
          currentUser.current = session.user;
          currentSession.current = session;
          updateAuthState(session.user, session, null, 'init-session');
        } else if (isMounted) {
          updateAuthState(null, null, null, 'init-no-session');
        }

        isInitialized.current = true;

        // Set up auth state change listener
        const {
          data: { subscription }
        } = supabase.current.auth.onAuthStateChange(async (event, session) => {
          console.debug('[Auth Context Debug] Auth state changed:', {
            event,
            hasSession: !!session,
            userId: session?.user?.id,
            isInitialized: isInitialized.current
          });

          // Skip duplicate initial session events
          if (event === 'INITIAL_SESSION' && isInitialized.current) {
            console.debug('[Auth Context Debug] Skipping duplicate initial session');
            return;
          }

          if (session && isMounted) {
            currentUser.current = session.user;
            currentSession.current = session;
            updateAuthState(session.user, session, null, `event-${event}`);
          } else if (event === 'SIGNED_OUT' && isMounted) {
            currentUser.current = null;
            currentSession.current = null;
            updateAuthState(null, null, null, 'sign-out');
          }
        });

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[Auth Context Debug] Auth initialization error:', error);
        if (isMounted) {
        updateAuthState(null, null, { 
          message: error instanceof Error ? error.message : 'Failed to initialize auth'
        }, 'init-catch-error');
        }
      }
    };

    initializeAuth();
    
    return () => {
      isMounted = false;
      
      // Clean up any pending timeouts
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
    };
  }, [updateAuthState]);

  const router = useRouter();
  
  const handleNavigation = useCallback((path: string, params: URLSearchParams) => {
    if (navigationInProgress.current) {
      console.debug('[Auth Context Debug] Navigation already in progress, skipping');
      return;
    }
    
    navigationInProgress.current = true;
    console.debug('[Auth Context Debug] Starting navigation:', { path, params: Object.fromEntries(params) });

    try {
      let finalPath = path;
      
      // Add query parameters if provided
      if (params.size > 0) {
        const queryString = Array.from(params.entries())
          .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
          .join('&');
        finalPath = `${path}${path.includes('?') ? '&' : '?'}${queryString}`;
      }

      // Use Next.js router for more reliable navigation that preserves cookies
      router.push(finalPath);
      
      // Set a timeout to reset the navigation flag
      setTimeout(() => {
        navigationInProgress.current = false;
      }, 2000);
    } catch (error) {
      console.error('[Auth Context Debug] Navigation error:', error);
      navigationInProgress.current = false;
    }
  }, [router]);

  const signIn = useCallback(async (email: string, password: string): Promise<SignInResponse> => {
    // Set a local mounted flag to prevent state updates after unmount
    let isLocalMounted = true;
    
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      console.debug('[Auth Context Debug] Attempting sign in:', { email });

      // Check for any existing auth cookies before sign in
      if (typeof window !== 'undefined') {
        try {
          logCookieDebugInfo('Auth Context Before SignIn');
          
          // If there are cookie issues, clear them first
          const { hasIssues } = diagnoseCookieIssues();
          if (hasIssues) {
            console.debug('[Auth Context Debug] Clearing problematic cookies before sign in');
            // Use secure cookie deletion
            clearAuthCookie();
            
            // Wait a moment for cookies to clear
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        } catch (cookieError) {
          console.error('[Auth Context Debug] Error handling cookies before sign in:', cookieError);
          // Continue with sign-in even if cookie check fails
        }
      }

      const { data, error } = await supabase.current.auth.signInWithPassword({
        email: email.toLowerCase(),
        password
      });

      if (error) {
        console.error('[Auth Context Debug] Sign in error:', error);
        updateAuthState(null, null, { message: error.message }, 'sign-in-error');
        return { success: false, error: error.message };
      }

      if (!data.session) {
        console.error('[Auth Context Debug] No session created');
        updateAuthState(null, null, { message: 'No session created' }, 'sign-in-no-session');
        return { success: false, error: 'No session created' };
      }

      console.debug('[Auth Context Debug] Sign in successful:', {
        userId: data.user?.id,
        hasSession: true,
        expiresAt: data.session.expires_at
      });

      // Verify the cookie was set properly using secure cookie checks
      const hasCookie = hasAuthCookie();
        console.debug('[Auth Context Debug] Cookie check after sign in:', { hasCookie });
        
        if (!hasCookie) {
          console.warn('[Auth Context Debug] Auth cookie not set properly after sign in');
        // Try to manually sync cookie state and ensure secure cookie settings
        const refreshResult = await supabase.current.auth.refreshSession();
        
        // If we still don't have a cookie, try to manually set one
        if (refreshResult.data.session && !hasAuthCookie()) {
          // Store session token securely
          document.cookie = `${getAuthCookieName()}=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax; ${process.env.NODE_ENV === 'production' ? 'Secure;' : ''}`;
        }
      }

      // Check if component is still mounted before updating state
      if (isLocalMounted) {
      currentUser.current = data.user;
      currentSession.current = data.session;
      updateAuthState(data.user, data.session, null, 'sign-in-success');

      const params = new URLSearchParams();
      params.set('auth_state', 'post_signin');
      handleNavigation('/dashboard', params);
      }
      
      return { success: true };
    } catch (error) {
      console.error('[Auth Context Debug] Sign in error:', error);
      const message = error instanceof Error ? error.message : 'Sign in failed';
      if (isLocalMounted) {
      updateAuthState(null, null, { message }, 'sign-in-catch-error');
      }
      return { success: false, error: message };
    }
  }, [updateAuthState, handleNavigation]);

  const signOut = useCallback(async () => {
    // Set a local mounted flag to prevent state updates after unmount
    let isLocalMounted = true;
    let timeoutId: NodeJS.Timeout | null = null;
    
    try {
      setState(prev => ({ ...prev, isLoading: true }));
      console.debug('[Auth Context Debug] Signing out');
      
      // Check cookies before sign out using our utility
      if (typeof window !== 'undefined') {
        try {
          logCookieDebugInfo('Auth Context Before SignOut');
        } catch (cookieError) {
          console.error('[Auth Context Debug] Error handling cookies before sign out:', cookieError);
        }
      }
      
      // Implement a simpler approach to sign out with timeout
      let signOutResult;
      
      try {
        // Create a sign out promise
        const signOutPromise = supabase.current.auth.signOut({ scope: 'local' });
        
        // Set a timeout
        const timeoutPromise = new Promise<{error: Error}>((resolve) => {
          timeoutId = setTimeout(() => {
            resolve({error: new Error('Sign out timeout')});
          }, 3000);
        });
        
        // Race the sign out against the timeout
        signOutResult = await Promise.race([
          signOutPromise,
          timeoutPromise
        ]);
        
        // Clear timeout after completion
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
      } catch (signOutError) {
        // Clear timeout if it exists
        if (timeoutId) {
          clearTimeout(timeoutId);
          timeoutId = null;
        }
        
        // Handle any unexpected errors
        signOutResult = {
          error: signOutError instanceof Error ? 
            signOutError : 
            new Error('Sign out failed')
        };
      }
      
      // Guard against component unmounting during async operation
      if (!isLocalMounted) return;
      
      const { error } = signOutResult;
      
      if (error) {
        console.error('[Auth Context Debug] Sign out error:', error);
        updateAuthState(null, null, { message: error.message }, 'sign-out-error');
        
        // Even with error, proceed with cleanup to ensure user is signed out client-side
        console.debug('[Auth Context Debug] Proceeding with client-side cleanup despite error');
      }

      // Check if component is still mounted before updating state
      if (isLocalMounted) {
      // Clear all references to the session and user
      currentUser.current = null;
      currentSession.current = null;
      updateAuthState(null, null, null, 'sign-out-success');
      
      const params = new URLSearchParams();
      params.set('auth_state', 'post_signout');
      handleNavigation('/sign-in', params);
      }
    } catch (error) {
      console.error('[Auth Context Debug] Sign out error:', error);
      const message = error instanceof Error ? error.message : 'Sign out failed';
      updateAuthState(null, null, { message }, 'sign-out-catch-error');
      
      // Check if component is still mounted before updating state
      if (isLocalMounted) {
        try {
          // Always clear cookies and state on error
          if (typeof window !== 'undefined') {
            clearAuthCookie();
          }
          
          currentUser.current = null;
          currentSession.current = null;
          updateAuthState(null, null, { message }, 'sign-out-cleanup');
        } catch (cleanupError) {
          console.error('[Auth Context Debug] Error during sign-out cleanup:', cleanupError);
        }
      }
      
      throw error;
    }
  }, [updateAuthState, handleNavigation]);

  // Define context value with proper dependencies
  const value = useMemo(() => ({
    ...state,
    signIn,
    signOut
  }), [state, signIn, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

function withAuth<P extends object>(
  Component: React.ComponentType<P>,
): React.FC<P> {
  function WithAuthComponent(props: P) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
      // Provide a minimal loading state that won't cause DOM manipulation errors
      return <div className="p-4 text-center">Loading authentication state...</div>;
    }

    // Let the middleware handle redirects
    return user ? <Component {...props} /> : null;
  }
  
  // Add displayName for better debugging
  WithAuthComponent.displayName = `withAuth(${Component.displayName || Component.name || 'Component'})`;
  
  return WithAuthComponent;
}

export default AuthContext;
