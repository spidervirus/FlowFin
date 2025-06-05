import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { User, Session, AuthChangeEvent } from "@supabase/supabase-js";
import { handleError, showErrorToast } from "@/lib/error-handler";
import { getAuthCookieOptions } from "@/lib/utils/cookies";
import { createAdminClient } from '@/lib/supabase/supabase-admin';
import { logger } from '@/lib/logger';

interface ErrorMetadata {
  message: string;
  code?: string;
  context?: ProfileCreationContext;
}

export interface ProfileCreationContext {
  userId: string;
  email: string;
  name: string;
  fullName: string;
  role: string;
  timestamp: string;
}

/**
 * Creates a user profile with comprehensive debugging
 */
export async function createProfileWithDebug(context: ProfileCreationContext) {
  const { userId, email, name, fullName, role, timestamp } = context;
  
  logger.debug('Starting profile creation with context', context);
  
  try {
    const supabase = createAdminClient();
    
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          id: userId,
          email,
          // username: name, // username column does not exist, using full_name for now
          full_name: name, // Assuming 'name' from context is the intended username/display name
          // full_name: fullName, // fullName from context might be redundant if 'name' is the primary display identifier
          // role, // role column does not exist in user_profiles
          created_at: timestamp,
          updated_at: timestamp
        }
      ])
      .select()
      .single();
    
    if (profileError) {
      logger.error('Failed to create user profile', profileError, { context });
      throw profileError;
    }
    
    logger.info('Successfully created user profile', {
      userId,
      email,
      profile
    });
    
    return profile;
  } catch (error) {
    logger.error(
       'Unexpected error during profile creation',
       error instanceof Error ? error : new Error(String(error)),
       { context }
     );
    throw error;
  }
}

// Create a singleton instance of the Supabase client
let supabaseInstance: ReturnType<typeof createClientComponentClient> | null = null;

const getSupabase = () => {
  if (!supabaseInstance) {
    supabaseInstance = createClientComponentClient({
      cookieOptions: getAuthCookieOptions()
    });

    // Add debug listener for auth state changes
    supabaseInstance.auth.onAuthStateChange((event, session) => {
      try {
        const cookieOptions = getAuthCookieOptions();
        console.debug('[Auth Service Debug] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          accessToken: session?.access_token ? '[REDACTED]' : undefined,
          cookieConfig: {
            path: cookieOptions.path,
            sameSite: cookieOptions.sameSite,
            secure: cookieOptions.secure
          },
          cookies: typeof window !== 'undefined' ? document.cookie.split(';').map(c => c.trim().split('=')[0]) : []
        });
      } catch (error) {
        console.error('[Auth Service Error] Failed to handle auth state change:', error);
      }
    });
  }
  return supabaseInstance;
};

export class AuthService {
  private static instance: AuthService | null = null;
  private refreshTimerId: NodeJS.Timeout | null = null;
  private isInitialized = false;
  private authStateSubscription: { unsubscribe: () => void } | null = null;
  private readonly refreshInterval = 60 * 60 * 1000; // 1 hour in milliseconds
  private supabase: ReturnType<typeof createClientComponentClient>;

  private constructor() {
    this.supabase = getSupabase();
    if (typeof window !== "undefined") {
      this.initialize();
    }
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private async initialize() {
    if (this.isInitialized) return;

    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      console.debug('[Auth Service Debug] Initializing service:', {
        hasSession: !!session,
        userId: session?.user?.id,
        error: error?.message,
        cookies: typeof window !== 'undefined' ? document.cookie.split(';').map(c => c.trim().split('=')[0]) : []
      });

      if (error) {
        console.error("Error initializing auth:", error);
        return;
      }

      if (session) {
        this.setupRefreshTimer(session);
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("Failed to initialize auth service:", error);
    }
  }

  private setupAuthListener() {
    const {
      data: { subscription },
    } = this.supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session) => {
        console.debug('[Auth Service Debug] Auth state changed:', {
          event,
          hasSession: !!session,
          userId: session?.user?.id,
          cookies: typeof window !== 'undefined' ? document.cookie.split(';').map(c => c.trim().split('=')[0]) : []
        });

        switch (event) {
          case "SIGNED_IN":
          case "TOKEN_REFRESHED":
            if (session) {
              this.setupRefreshTimer(session);
            }
            break;

          case "SIGNED_OUT":
            this.clearStaleData();
            break;
        }
      },
    );

    this.authStateSubscription = subscription;
  }

  private setupRefreshTimer(session: Session) {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
    }

    const timeUntilExpiry = session.expires_at
      ? session.expires_at * 1000 - Date.now()
      : this.refreshInterval;

    const refreshTime = Math.max(0, timeUntilExpiry - 60 * 1000); // Refresh 1 minute before expiry

    console.debug('[Auth Service Debug] Setting up refresh timer:', {
      timeUntilExpiry: Math.floor(timeUntilExpiry / 1000),
      refreshTime: Math.floor(refreshTime / 1000),
      sessionExpiresAt: session.expires_at
    });

    this.refreshTimerId = setTimeout(async () => {
      await this.refreshSession();
    }, refreshTime);
  }

  private clearStaleData(): void {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }

    if (typeof window !== "undefined") {
      console.debug('[Auth Service Debug] Clearing stale data');
      this.supabase.auth.signOut();
    }
  }

  public async signIn(
    email: string,
    password: string,
  ): Promise<{ user: User | null; error: Error | null }> {
    try {
      console.debug('[Auth Service Debug] Attempting sign in:', { email });
      
      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.debug('[Auth Service Debug] Sign in result:', {
        success: !error,
        hasUser: !!data.user,
        cookies: typeof window !== 'undefined' ? document.cookie.split(';').map(c => c.trim().split('=')[0]) : []
      });

      if (error) throw error;

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Sign in error:", error);
      return { user: null, error: error as Error };
    }
  }

  public async signUp(
    email: string,
    password: string,
    metadata?: { [key: string]: any },
  ): Promise<{ user: User | null; error: Error | null }> {
    try {
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;

      return { user: data.user, error: null };
    } catch (error) {
      console.error("Sign up error:", error);
      return { user: null, error: error as Error };
    }
  }

  public async signOut(): Promise<{ error: Error | null }> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) throw error;

      this.clearStaleData();
      return { error: null };
    } catch (error) {
      console.error("Sign out error:", error);
      return { error: error as Error };
    }
  }

  public async getSession(): Promise<{
    session: Session | null;
    error: Error | null;
  }> {
    if (!this.isInitialized && typeof window !== "undefined") {
      await this.initialize();
    }

    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        this.setupRefreshTimer(session);
      }

      return { session, error: null };
    } catch (error) {
      console.error("Get session error:", error);
      return { session: null, error: error as Error };
    }
  }

  public async refreshSession(): Promise<{
    session: Session | null;
    error: Error | null;
  }> {
    try {
      const {
        data: { session },
        error,
      } = await this.supabase.auth.refreshSession();

      if (error) throw error;

      if (session) {
        this.setupRefreshTimer(session);
      }

      return { session, error: null };
    } catch (error) {
      console.error("Session refresh error:", error);
      return { session: null, error: error as Error };
    }
  }

  public async isAuthenticated(): Promise<boolean> {
    try {
      const { session, error } = await this.getSession();
      return !error && !!session;
    } catch {
      return false;
    }
  }

  public onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null) => void,
  ): { data: { subscription: { unsubscribe: () => void } } } {
    return this.supabase.auth.onAuthStateChange(callback);
  }

  public cleanup(): void {
    if (this.refreshTimerId) {
      clearTimeout(this.refreshTimerId);
      this.refreshTimerId = null;
    }
  }
}

// Create and export the singleton instance
export const authService =
  typeof window !== "undefined" ? AuthService.getInstance() : null;
export default authService;
