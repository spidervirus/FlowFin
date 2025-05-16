import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { handleAuthError } from "./error-handler";

export interface AuthError {
  message: string;
  status?: number;
}

export interface AuthResponse {
  success: boolean;
  error?: AuthError;
  data?: any;
}

export class AuthService {
  private static instance: AuthService;
  private supabase = createClient();
  private authStateChangeListener: any = null;

  private constructor() {
    // Initialize auth state change listener
    this.authStateChangeListener = this.supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (event === "SIGNED_IN" && session?.user) {
          // Create or update user profile
          await this.createOrUpdateUserProfile(session.user);
        } else if (event === "SIGNED_OUT") {
          // Clear any local state
          this.clearLocalState();
        }
      },
    );
  }

  public static getInstance(): AuthService {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }

  private clearLocalState(): void {
    // Clear any local storage or state
    localStorage.removeItem("user_preferences");
    // Add any other cleanup needed
  }

  private async createOrUpdateUserProfile(user: any): Promise<void> {
    try {
      // First check if profile exists
      const { data: existingProfile, error: fetchError } = await this.supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (fetchError && fetchError.code !== "PGRST116") {
        console.error("Error fetching profile:", fetchError);
        toast.error("Error loading user profile");
        return;
      }

      const profileData = {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name || "",
        avatar_url: user.user_metadata?.avatar_url || "",
        job_title: user.user_metadata?.job_title || "",
        phone: user.user_metadata?.phone || "",
        department: user.user_metadata?.department || "",
        updated_at: new Date().toISOString(),
      };

      if (!existingProfile) {
        // Create new profile with retry mechanism
        let retryCount = 0;
        const maxRetries = 3;
        
        while (retryCount < maxRetries) {
          const { error: insertError } = await this.supabase
            .from("user_profiles")
            .insert([
              {
                ...profileData,
                created_at: new Date().toISOString(),
              },
            ]);

          if (!insertError) {
            break; // Success, exit retry loop
          }

          console.error(`Error creating profile (attempt ${retryCount + 1}):`, insertError);
          retryCount++;

          if (retryCount === maxRetries) {
            toast.error("Error creating user profile");
            return;
          }

          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      } else {
        // Update existing profile
        const { error: updateError } = await this.supabase
          .from("user_profiles")
          .update(profileData)
          .eq("id", user.id);

        if (updateError) {
          console.error("Error updating profile:", updateError);
          toast.error("Error updating user profile");
          return;
        }
      }

      // Set up user preferences
      await this.setupUserPreferences(user.id);
    } catch (error) {
      console.error("Error in createOrUpdateUserProfile:", error);
      toast.error("Error managing user profile");
    }
  }

  private async setupUserPreferences(userId: string): Promise<void> {
    try {
      // Check if preferences exist with retry mechanism
      let retryCount = 0;
      const maxRetries = 3;
      let existingPrefs = null;
      let fetchError = null;

      while (retryCount < maxRetries) {
        const result = await this.supabase
          .from("dashboard_settings")
          .select("*")
          .eq("user_id", userId)
          .single();

        existingPrefs = result.data;
        fetchError = result.error;

        if (!fetchError || fetchError.code === "PGRST116") {
          break; // Success or not found, exit retry loop
        }

        console.error(`Error fetching preferences (attempt ${retryCount + 1}):`, fetchError);
        retryCount++;

        if (retryCount < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }

      if (fetchError && fetchError.code !== "PGRST116") {
        toast.error("Error loading user preferences");
        return;
      }

      if (!existingPrefs) {
        // Create default preferences with retry mechanism
        retryCount = 0;
        
        while (retryCount < maxRetries) {
          const { error: insertError } = await this.supabase
            .from("dashboard_settings")
            .insert([
              {
                user_id: userId,
                layout: {},
                theme: "light",
                default_view: "monthly",
                widgets: [],
                notifications_enabled: true,
                email_notifications: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);

          if (!insertError) {
            break; // Success, exit retry loop
          }

          console.error(`Error creating preferences (attempt ${retryCount + 1}):`, insertError);
          retryCount++;

          if (retryCount === maxRetries) {
            toast.error("Error setting up user preferences");
            return;
          }

          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    } catch (error) {
      console.error("Error in setupUserPreferences:", error);
      toast.error("Error managing user preferences");
    }
  }

  public async signUp(
    email: string,
    password: string,
    fullName: string,
  ): Promise<AuthResponse> {
    try {
      // Validate inputs
      if (!email || !password || !fullName) {
        return {
          success: false,
          error: {
            message: "All fields are required",
            status: 400,
          },
        };
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return {
          success: false,
          error: {
            message: "Invalid email format",
            status: 400,
          },
        };
      }

      // Enhanced password validation
      if (password.length < 8 || 
          !/[A-Z]/.test(password) || 
          !/[a-z]/.test(password) || 
          !/[0-9]/.test(password) || 
          !/[!@#$%^&*]/.test(password)) {
        return {
          success: false,
          error: {
            message: "Password must be at least 8 characters long and contain uppercase, lowercase, number and special character",
            status: 400,
          },
        };
      }

      // First check if user already exists
      const { data: existingUser, error: checkError } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return {
          success: false,
          error: {
            message: "An account with this email already exists",
            status: 409,
          },
        };
      }

      // Attempt to create the user
      const { data, error } = await this.supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        const authError = handleAuthError(error);
        return {
          success: false,
          error: {
            message: authError.message,
            status: error.status,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Sign up error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during sign up",
        },
      };
    }
  }

  public async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Validate inputs
      if (!email || !password) {
        return {
          success: false,
          error: {
            message: "Email and password are required",
            status: 400,
          },
        };
      }

      const { data, error } = await this.supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        const authError = handleAuthError(error);
        return {
          success: false,
          error: {
            message: authError.message,
            status: error.status,
          },
        };
      }

      return {
        success: true,
        data,
      };
    } catch (error) {
      console.error("Sign in error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during sign in",
        },
      };
    }
  }

  public async signOut(): Promise<AuthResponse> {
    try {
      const { error } = await this.supabase.auth.signOut();

      if (error) {
        const authError = handleAuthError(error);
        return {
          success: false,
          error: {
            message: authError.message,
            status: error.status,
          },
        };
      }

      this.clearLocalState();
      return {
        success: true,
      };
    } catch (error) {
      console.error("Sign out error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred during sign out",
        },
      };
    }
  }

  public async resetPassword(email: string): Promise<AuthResponse> {
    try {
      // Validate email
      if (!email) {
        return {
          success: false,
          error: {
            message: "Email is required",
            status: 400,
          },
        };
      }

      const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (error) {
        const authError = handleAuthError(error);
        return {
          success: false,
          error: {
            message: authError.message,
            status: error.status,
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred while resetting password",
        },
      };
    }
  }

  public async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      // Validate password
      if (!newPassword || newPassword.length < 8) {
        return {
          success: false,
          error: {
            message: "Password must be at least 8 characters long",
            status: 400,
          },
        };
      }

      const { error } = await this.supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        const authError = handleAuthError(error);
        return {
          success: false,
          error: {
            message: authError.message,
            status: error.status,
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Update password error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred while updating password",
        },
      };
    }
  }

  public async updateProfile(profileData: any): Promise<AuthResponse> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: {
            message: "User not found",
            status: 404,
          },
        };
      }

      const { error: updateError } = await this.supabase
        .from("user_profiles")
        .update({
          ...profileData,
          updated_at: new Date().toISOString(),
        })
        .eq("id", user.id);

      if (updateError) {
        return {
          success: false,
          error: {
            message: "Error updating profile",
            status: 500,
          },
        };
      }

      return {
        success: true,
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred while updating profile",
        },
      };
    }
  }

  public async getCurrentUser(): Promise<AuthResponse> {
    try {
      const {
        data: { user },
        error,
      } = await this.supabase.auth.getUser();

      if (error) {
        const authError = handleAuthError(error);
        return {
          success: false,
          error: {
            message: authError.message,
            status: error.status,
          },
        };
      }

      if (!user) {
        return {
          success: false,
          error: {
            message: "No user found",
            status: 404,
          },
        };
      }

      return {
        success: true,
        data: user,
      };
    } catch (error) {
      console.error("Get current user error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred while getting user",
        },
      };
    }
  }

  public async getProfile(): Promise<AuthResponse> {
    try {
      const {
        data: { user },
        error: userError,
      } = await this.supabase.auth.getUser();

      if (userError || !user) {
        return {
          success: false,
          error: {
            message: "User not found",
            status: 404,
          },
        };
      }

      const { data: profile, error: profileError } = await this.supabase
        .from("user_profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) {
        return {
          success: false,
          error: {
            message: "Error fetching profile",
            status: 500,
          },
        };
      }

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      console.error("Get profile error:", error);
      return {
        success: false,
        error: {
          message: "An unexpected error occurred while getting profile",
        },
      };
    }
  }

  public cleanup(): void {
    if (this.authStateChangeListener) {
      this.authStateChangeListener.subscription.unsubscribe();
    }
  }
}
