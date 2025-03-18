'use client';

import { createClient } from '@/lib/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { handleError, showErrorToast, ErrorType, ErrorSeverity, createError } from '@/lib/error-handler';

// Define types for our auth state
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: Error | null;
}

// Define types for stored user data
export interface StoredUserData {
  id: string;
  email?: string;
  lastAuthenticated: number; // timestamp
}

class AuthService {
  private static instance: AuthService;
  private supabase = createClient();
  private refreshTimerId: NodeJS.Timeout | null = null;
  private refreshInterval = 10 * 60 * 1000; // 10 minutes
  
  // Private constructor for singleton pattern
  private constructor() {
    // Initialize refresh timer if we have a session
    this.initializeFromStorage();
  }
  
  // Get singleton instance
  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  // Initialize from localStorage
  private initializeFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Check if we have a session in Supabase storage
      this.supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log('Session found, setting up refresh timer');
          this.setupRefreshTimer();
          this.storeUserData(session.user);
        } else {
          console.log('No session found in Supabase storage');
        }
      }).catch(error => {
        console.error('Error getting session during initialization:', error);
        const appError = handleError(error);
        // Don't show toast during initialization to avoid disrupting user experience
      });
    } catch (error) {
      console.error('Error initializing from storage:', error);
      handleError(error);
    }
  }
  
  // Set up refresh timer
  private setupRefreshTimer(): void {
    // Clear any existing timer
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
    }
    
    // Set up new timer
    this.refreshTimerId = setInterval(async () => {
      try {
        console.log('Refreshing session token...');
        const { data, error } = await this.supabase.auth.refreshSession();
        
        if (error) {
          console.error('Error refreshing session:', error);
          this.handleSessionError(error);
        } else if (data.session) {
          console.log('Session refreshed successfully');
          this.storeUserData(data.session.user);
        }
      } catch (error) {
        console.error('Exception refreshing session:', error);
        this.handleSessionError(error);
      }
    }, this.refreshInterval);
  }
  
  // Handle session error
  private handleSessionError(error?: any): void {
    // Clear refresh timer
    if (this.refreshTimerId) {
      clearInterval(this.refreshTimerId);
      this.refreshTimerId = null;
    }
    
    // Mark session as requiring re-authentication
    const userData = this.getUserData();
    if (userData) {
      userData.lastAuthenticated = 0; // Force re-authentication
      this.setUserData(userData);
    }
    
    // Create and handle error
    if (error) {
      const appError = createError(
        ErrorType.AUTHENTICATION,
        'Your session has expired. Please sign in again.',
        ErrorSeverity.WARNING,
        error,
        'auth/session-expired'
      );
      
      // Don't show toast for session errors during background refresh
      // This will be handled when the user tries to perform an action
    }
  }
  
  // Store user data in localStorage
  private storeUserData(user: User): void {
    if (!user) return;
    
    const userData: StoredUserData = {
      id: user.id,
      email: user.email || undefined,
      lastAuthenticated: Date.now()
    };
    
    // Store in multiple formats for compatibility
    localStorage.setItem('currentUserId', user.id);
    localStorage.setItem('userData', JSON.stringify({ user: { id: user.id, email: user.email } }));
    localStorage.setItem('authUserData', JSON.stringify(userData));
    
    // Also store in sessionStorage for redundancy
    sessionStorage.setItem('currentUserId', user.id);
  }
  
  // Get stored user data
  private getUserData(): StoredUserData | null {
    try {
      const userDataStr = localStorage.getItem('authUserData');
      if (userDataStr) {
        return JSON.parse(userDataStr);
      }
    } catch (error) {
      console.error('Error parsing stored user data:', error);
      handleError(error);
    }
    return null;
  }
  
  // Set user data
  private setUserData(userData: StoredUserData): void {
    localStorage.setItem('authUserData', JSON.stringify(userData));
  }
  
  // Sign in with email and password
  public async signIn(email: string, password: string): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) {
        console.error('Sign in error:', error);
        const appError = handleError({
          ...error,
          code: error.code || 'auth/unknown'
        });
        return { user: null, error: appError.originalError || new Error(appError.message) };
      }
      
      if (data.user) {
        this.storeUserData(data.user);
        this.setupRefreshTimer();
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Exception during sign in:', error);
      const appError = handleError(error);
      return { user: null, error: appError.originalError || new Error(appError.message) };
    }
  }
  
  // Sign up with email and password
  public async signUp(email: string, password: string, metadata?: { [key: string]: any }): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata
        }
      });
      
      if (error) {
        console.error('Sign up error:', error);
        const appError = handleError({
          ...error,
          code: error.code || 'auth/unknown'
        });
        return { user: null, error: appError.originalError || new Error(appError.message) };
      }
      
      if (data.user) {
        this.storeUserData(data.user);
        this.setupRefreshTimer();
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Exception during sign up:', error);
      const appError = handleError(error);
      return { user: null, error: appError.originalError || new Error(appError.message) };
    }
  }
  
  // Sign out
  public async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();
      
      // Clear refresh timer
      if (this.refreshTimerId) {
        clearInterval(this.refreshTimerId);
        this.refreshTimerId = null;
      }
      
      // Clear stored user data
      localStorage.removeItem('currentUserId');
      localStorage.removeItem('userData');
      localStorage.removeItem('authUserData');
      sessionStorage.removeItem('currentUserId');
      
      if (error) {
        const appError = handleError({
          ...error,
          code: error.code || 'auth/unknown'
        });
        return { error: appError.originalError || new Error(appError.message) };
      }
      
      return { error: null };
    } catch (error) {
      console.error('Exception during sign out:', error);
      const appError = handleError(error);
      return { error: appError.originalError || new Error(appError.message) };
    }
  }
  
  // Get current user
  public async getUser(): Promise<{ user: User | null; error: Error | null }> {
    try {
      // First try to get from Supabase
      const { data, error } = await this.supabase.auth.getUser();
      
      if (error) {
        console.error('Error getting user:', error);
        // Fall back to stored user data
        const userData = this.getUserData();
        if (userData) {
          // Check if stored data is still valid (less than 24 hours old)
          const isValid = Date.now() - userData.lastAuthenticated < 24 * 60 * 60 * 1000;
          if (isValid) {
            return { 
              user: { 
                id: userData.id,
                email: userData.email || null,
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: ''
              } as User, 
              error: null 
            };
          }
        }
        
        const appError = handleError({
          ...error,
          code: error.code || 'auth/unknown'
        });
        return { user: null, error: appError.originalError || new Error(appError.message) };
      }
      
      if (data.user) {
        this.storeUserData(data.user);
      }
      
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Exception getting user:', error);
      const appError = handleError(error);
      return { user: null, error: appError.originalError || new Error(appError.message) };
    }
  }
  
  // Get current session
  public async getSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.getSession();
      
      if (error) {
        console.error('Error getting session:', error);
        const appError = handleError({
          ...error,
          code: error.code || 'auth/unknown'
        });
        return { session: null, error: appError.originalError || new Error(appError.message) };
      }
      
      if (data.session) {
        this.setupRefreshTimer();
      }
      
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Exception getting session:', error);
      const appError = handleError(error);
      return { session: null, error: appError.originalError || new Error(appError.message) };
    }
  }
  
  // Refresh session
  public async refreshSession(): Promise<{ session: Session | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.refreshSession();
      
      if (error) {
        console.error('Error refreshing session:', error);
        this.handleSessionError(error);
        const appError = handleError({
          ...error,
          code: error.code || 'auth/session-expired'
        });
        return { session: null, error: appError.originalError || new Error(appError.message) };
      }
      
      if (data.session) {
        this.storeUserData(data.session.user);
      }
      
      return { session: data.session, error: null };
    } catch (error) {
      console.error('Exception refreshing session:', error);
      this.handleSessionError(error);
      const appError = handleError(error);
      return { session: null, error: appError.originalError || new Error(appError.message) };
    }
  }
  
  // Check if user is authenticated
  public async isAuthenticated(): Promise<boolean> {
    const { user, error } = await this.getUser();
    return !!user && !error;
  }
  
  // Get user ID (synchronous version for immediate use)
  public getUserId(): string | null {
    // Try localStorage first
    const userId = localStorage.getItem('currentUserId');
    if (userId) return userId;
    
    // Try userData
    try {
      const userDataStr = localStorage.getItem('userData');
      if (userDataStr) {
        const userData = JSON.parse(userDataStr);
        if (userData?.user?.id) return userData.user.id;
      }
    } catch (e) {
      console.error('Error parsing userData:', e);
      handleError(e);
    }
    
    // Try authUserData
    try {
      const authUserDataStr = localStorage.getItem('authUserData');
      if (authUserDataStr) {
        const authUserData = JSON.parse(authUserDataStr);
        if (authUserData?.id) return authUserData.id;
      }
    } catch (e) {
      console.error('Error parsing authUserData:', e);
      handleError(e);
    }
    
    // Try sessionStorage
    const sessionUserId = sessionStorage.getItem('currentUserId');
    if (sessionUserId) return sessionUserId;
    
    return null;
  }
}

// Export singleton instance
export const authService = AuthService.getInstance();

// Export default for convenience
export default authService; 