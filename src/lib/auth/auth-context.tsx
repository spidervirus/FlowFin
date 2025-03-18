'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import authService, { AuthState } from './auth-service';
import { useRouter } from 'next/navigation';
import { handleError, showErrorToast, AppError } from '@/lib/error-handler';

// Create context with default values
const AuthContext = createContext<{
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error: Error | null }>;
  signUp: (email: string, password: string, metadata?: { [key: string]: any }) => Promise<{ success: boolean; error: Error | null }>;
  signOut: () => Promise<{ success: boolean; error: Error | null }>;
  refreshSession: () => Promise<{ success: boolean; error: Error | null }>;
  isAuthenticated: () => Promise<boolean>;
  getUserId: () => string | null;
}>({
  user: null,
  session: null,
  isLoading: true,
  error: null,
  signIn: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  signUp: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  signOut: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  refreshSession: async () => ({ success: false, error: new Error('AuthContext not initialized') }),
  isAuthenticated: async () => false,
  getUserId: () => null,
});

// Provider component
export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
    error: null,
  });
  
  const router = useRouter();
  
  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get session
        const { session, error: sessionError } = await authService.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setState({
            user: null,
            session: null,
            isLoading: false,
            error: sessionError,
          });
          
          // Don't show error toast during initialization
          // This would disrupt the user experience
          return;
        }
        
        // Get user if we have a session
        if (session) {
          const { user, error: userError } = await authService.getUser();
          
          setState({
            user,
            session,
            isLoading: false,
            error: userError,
          });
          
          if (userError) {
            // Don't show error toast during initialization
            console.error('Error getting user during initialization:', userError);
          }
        } else {
          // Try to get user from stored data
          const { user, error: userError } = await authService.getUser();
          
          setState({
            user,
            session: null,
            isLoading: false,
            error: userError,
          });
          
          if (userError) {
            // Don't show error toast during initialization
            console.error('Error getting user from stored data during initialization:', userError);
          }
        }
      } catch (error) {
        console.error('Exception initializing auth:', error);
        const appError = handleError(error);
        
        setState({
          user: null,
          session: null,
          isLoading: false,
          error: appError.originalError || new Error(appError.message),
        });
        
        // Don't show error toast during initialization
      }
    };
    
    initializeAuth();
  }, []);
  
  // Sign in handler
  const signIn = async (email: string, password: string): Promise<{ success: boolean; error: Error | null }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, error } = await authService.signIn(email, password);
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
      
      // Get session after successful sign in
      const { session, error: sessionError } = await authService.getSession();
      
      setState({
        user,
        session,
        isLoading: false,
        error: sessionError,
      });
      
      if (sessionError) {
        showErrorToast(handleError(sessionError));
        return { success: !!user, error: sessionError };
      }
      
      return { success: !!user, error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      const appError = handleError(error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: appError.originalError || new Error(appError.message) 
      }));
      
      showErrorToast(appError);
      return { success: false, error: appError.originalError || new Error(appError.message) };
    }
  };
  
  // Sign up handler
  const signUp = async (email: string, password: string, metadata?: { [key: string]: any }): Promise<{ success: boolean; error: Error | null }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { user, error } = await authService.signUp(email, password, metadata);
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
      
      // Get session after successful sign up
      const { session, error: sessionError } = await authService.getSession();
      
      setState({
        user,
        session,
        isLoading: false,
        error: sessionError,
      });
      
      if (sessionError) {
        showErrorToast(handleError(sessionError));
        return { success: !!user, error: sessionError };
      }
      
      return { success: !!user, error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      const appError = handleError(error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: appError.originalError || new Error(appError.message) 
      }));
      
      showErrorToast(appError);
      return { success: false, error: appError.originalError || new Error(appError.message) };
    }
  };
  
  // Sign out handler
  const signOut = async (): Promise<{ success: boolean; error: Error | null }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { error } = await authService.signOut();
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error }));
        return { success: false, error };
      }
      
      setState({
        user: null,
        session: null,
        isLoading: false,
        error: null,
      });
      
      // Redirect to sign-in page
      router.push('/sign-in');
      
      return { success: true, error: null };
    } catch (error) {
      console.error('Exception during sign out:', error);
      const appError = handleError(error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: appError.originalError || new Error(appError.message) 
      }));
      
      showErrorToast(appError);
      return { success: false, error: appError.originalError || new Error(appError.message) };
    }
  };
  
  // Refresh session handler
  const refreshSession = async (): Promise<{ success: boolean; error: Error | null }> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const { session, error } = await authService.refreshSession();
      
      if (error) {
        setState(prev => ({ ...prev, isLoading: false, error }));
        
        // Don't show toast for session errors during background refresh
        // This will be handled when the user tries to perform an action
        return { success: false, error };
      }
      
      // Get user after successful refresh
      const { user, error: userError } = await authService.getUser();
      
      setState({
        user,
        session,
        isLoading: false,
        error: userError,
      });
      
      if (userError) {
        // Don't show toast for user errors during background refresh
        console.error('Error getting user after session refresh:', userError);
        return { success: !!session, error: userError };
      }
      
      return { success: !!session, error: null };
    } catch (error) {
      console.error('Exception during session refresh:', error);
      const appError = handleError(error);
      
      setState(prev => ({ 
        ...prev, 
        isLoading: false, 
        error: appError.originalError || new Error(appError.message) 
      }));
      
      // Don't show toast for errors during background refresh
      return { success: false, error: appError.originalError || new Error(appError.message) };
    }
  };
  
  // Check if user is authenticated
  const isAuthenticated = async (): Promise<boolean> => {
    return authService.isAuthenticated();
  };
  
  // Get user ID (synchronous)
  const getUserId = (): string | null => {
    return authService.getUserId();
  };
  
  // Context value
  const value = {
    ...state,
    signIn,
    signUp,
    signOut,
    refreshSession,
    isAuthenticated,
    getUserId,
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// HOC to protect routes
export function withAuth<P extends object>(Component: React.ComponentType<P>): React.FC<P> {
  const WithAuth: React.FC<P> = (props) => {
    const { user, isLoading } = useAuth();
    const router = useRouter();
    
    useEffect(() => {
      if (!isLoading && !user) {
        router.push('/sign-in');
      }
    }, [user, isLoading, router]);
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    
    if (!user) {
      return null;
    }
    
    return <Component {...props} />;
  };
  
  return WithAuth;
}

export default AuthContext; 