/**
 * Profile Creation Debug Utilities
 * 
 * This module provides comprehensive debugging and monitoring
 * for profile creation issues, including RLS policy violations.
 */

import { logger } from '@/lib/logger';
import { createClient } from '@/lib/utils/supabase-server';
import { SupabaseClient } from '@supabase/supabase-js';

export interface ProfileCreationContext {
  userId: string;
  email: string;
  name: string;
  fullName: string;
  role?: string;
  timestamp: string;
  authContext?: {
    hasAuthUid: boolean;
    userRole?: string;
    sessionUser?: string;
  };
}

export interface ProfileCreationResult {
  success: boolean;
  profileId?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
    hint?: string;
    isRlsViolation: boolean;
    isUniqueViolation: boolean;
  };
  fallbackUsed: boolean;
  debugInfo: {
    authContext: any;
    rlsPolicies: any[];
    existingProfile?: any;
  };
}

export class ProfileDebugger {
  private supabase: SupabaseClient;

  constructor(supabaseClient?: SupabaseClient) {
    this.supabase = supabaseClient || createClient();
  }

  /**
   * Comprehensive profile creation with full debugging
   */
  async createProfileWithDebug(
    context: ProfileCreationContext
  ): Promise<ProfileCreationResult> {
    const startTime = Date.now();
    logger.info('Starting profile creation with debug', context);

    const result: ProfileCreationResult = {
      success: false,
      fallbackUsed: false,
      debugInfo: {
        authContext: {},
        rlsPolicies: []
      }
    };

    try {
      // 1. Gather auth context
      result.debugInfo.authContext = await this.gatherAuthContext();
      logger.info('Auth context gathered', result.debugInfo.authContext);

      // 2. Check existing profile
      const existingProfile = await this.checkExistingProfile(context.userId);
      if (existingProfile) {
        result.debugInfo.existingProfile = existingProfile;
        logger.warn('Profile already exists', { userId: context.userId, existingProfile });
        return {
          ...result,
          success: true,
          profileId: existingProfile.id,
          error: {
            code: 'PROFILE_EXISTS',
            message: 'Profile already exists for this user',
            isRlsViolation: false,
            isUniqueViolation: false
          }
        };
      }

      // 3. Gather RLS policies for debugging
      result.debugInfo.rlsPolicies = await this.gatherRlsPolicies();
      logger.info('RLS policies gathered', { count: result.debugInfo.rlsPolicies.length });

      // 4. Attempt profile creation
      const { data: profileData, error: profileError } = await this.supabase
        .from('profiles')
        .insert({
          user_id: context.userId,
          email: context.email,
          name: context.name,
          full_name: context.fullName,
          role: context.role || 'user'
        })
        .select('*')
        .single();

      if (profileError) {
        result.error = this.analyzeError(profileError);
        logger.error('Profile creation failed', profileError, {
          context,
          errorAnalysis: result.error
        });

        // 5. If RLS violation, try fallback strategies
        if (result.error.isRlsViolation) {
          const fallbackResult = await this.tryFallbackStrategies(context);
          if (fallbackResult.success) {
            result.success = true;
            result.profileId = fallbackResult.profileId;
            result.fallbackUsed = true;
            logger.info('Fallback strategy succeeded', fallbackResult);
          }
        }
      } else {
        result.success = true;
        result.profileId = profileData.id;
        logger.info('Profile created successfully', {
          profileId: profileData.id,
          duration: Date.now() - startTime
        });
      }

      return result;

    } catch (error) {
      logger.error('Unexpected error in profile creation debug', error, context);
      result.error = {
        code: 'UNEXPECTED_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
        isRlsViolation: false,
        isUniqueViolation: false
      };
      return result;
    }
  }

  /**
   * Gather current authentication context
   */
  private async gatherAuthContext(): Promise<any> {
    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      
      // Try to get additional context via RPC if available
      const contextQueries = [
        'SELECT auth.uid() as auth_uid',
        'SELECT auth.role() as auth_role',
        'SELECT current_user as current_user',
        'SELECT session_user as session_user'
      ];

      const context: any = {
        user: user ? { id: user.id, email: user.email } : null,
        timestamp: new Date().toISOString()
      };

      // Try to execute context queries (may fail if RPC not available)
      for (const query of contextQueries) {
        try {
          const { data, error } = await this.supabase.rpc('exec_sql', { sql: query });
          if (!error && data) {
            const key = query.split(' as ')[1];
            context[key] = data;
          }
        } catch {
          // Ignore RPC errors
        }
      }

      return context;
    } catch (error) {
      logger.warn('Could not gather full auth context', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  /**
   * Check if profile already exists
   */
  private async checkExistingProfile(userId: string): Promise<any> {
    try {
      const { data, error } = await this.supabase
        .from('profiles')
        .select('id, user_id, email, created_at')
        .eq('user_id', userId)
        .single();

      return error ? null : data;
    } catch {
      return null;
    }
  }

  /**
   * Gather RLS policies for debugging
   */
  private async gatherRlsPolicies(): Promise<any[]> {
    try {
      const { data, error } = await this.supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'profiles')
        .eq('schemaname', 'public');

      return error ? [] : data;
    } catch {
      return [];
    }
  }

  /**
   * Analyze error and categorize it
   */
  private analyzeError(error: any): ProfileCreationResult['error'] {
    const isRlsViolation = 
      error.code === 'PGRST116' || 
      error.message?.includes('row-level security') ||
      error.message?.includes('insufficient_privilege');

    const isUniqueViolation = error.code === '23505';

    return {
      code: error.code || 'UNKNOWN',
      message: error.message || 'Unknown error',
      details: error.details,
      hint: error.hint,
      isRlsViolation,
      isUniqueViolation
    };
  }

  /**
   * Try fallback strategies when main profile creation fails
   */
  private async tryFallbackStrategies(
    context: ProfileCreationContext
  ): Promise<{ success: boolean; profileId?: string; strategy?: string }> {
    const strategies = [
      () => this.tryBackupTable(context),
      () => this.tryServiceRoleInsert(context),
      () => this.tryDelayedVerification(context)
    ];

    for (const [index, strategy] of strategies.entries()) {
      try {
        const result = await strategy();
        if (result.success) {
          logger.info(`Fallback strategy ${index + 1} succeeded`, result);
          return result;
        }
      } catch (error) {
        logger.warn(`Fallback strategy ${index + 1} failed`, error);
      }
    }

    return { success: false };
  }

  /**
   * Try inserting into backup table
   */
  private async tryBackupTable(
    context: ProfileCreationContext
  ): Promise<{ success: boolean; profileId?: string; strategy: string }> {
    const { data, error } = await this.supabase
      .from('user_profiles_backup')
      .insert({
        user_id: context.userId,
        email: context.email,
        name: context.name,
        full_name: context.fullName,
        role: context.role || 'user'
      })
      .select('*')
      .single();

    return {
      success: !error,
      profileId: data?.id,
      strategy: 'backup_table'
    };
  }

  /**
   * Try using service role client
   */
  private async tryServiceRoleInsert(
    context: ProfileCreationContext
  ): Promise<{ success: boolean; profileId?: string; strategy: string }> {
    // This would require a service role client
    // For now, just return failure
    return {
      success: false,
      strategy: 'service_role'
    };
  }

  /**
   * Try delayed verification (check if profile was actually created)
   */
  private async tryDelayedVerification(
    context: ProfileCreationContext
  ): Promise<{ success: boolean; profileId?: string; strategy: string }> {
    // Wait a bit and check if profile exists
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const existingProfile = await this.checkExistingProfile(context.userId);
    
    return {
      success: !!existingProfile,
      profileId: existingProfile?.id,
      strategy: 'delayed_verification'
    };
  }
}

/**
 * Convenience function for quick profile creation with debugging
 */
export async function createProfileWithDebug(
  context: ProfileCreationContext,
  supabaseClient: SupabaseClient
): Promise<ProfileCreationResult> {
  const profileDebugger = new ProfileDebugger(supabaseClient);
  return profileDebugger.createProfileWithDebug(context);
}

/**
 * Monitor profile creation health
 */
export async function monitorProfileCreationHealth(
  supabaseClient?: SupabaseClient
): Promise<{
  healthy: boolean;
  issues: string[];
  recommendations: string[];
}> {
  const supabase = supabaseClient || createClient();
  const issues: string[] = [];
  const recommendations: string[] = [];

  try {
    // Check RLS policies
    const { data: policies } = await supabase
      .from('pg_policies')
      .select('*')
      .eq('tablename', 'profiles');

    if (!policies || policies.length === 0) {
      issues.push('No RLS policies found for profiles table');
      recommendations.push('Create appropriate RLS policies for the profiles table');
    }

    const insertPolicies = policies?.filter(p => p.cmd === 'INSERT') || [];
    if (insertPolicies.length === 0) {
      issues.push('No INSERT policies found for profiles table');
      recommendations.push('Create an INSERT policy that allows profile creation during signup');
    }

    // Check table structure
    const { data: tableInfo, error: tableError } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (tableError) {
      issues.push(`Cannot access profiles table: ${tableError.message}`);
      recommendations.push('Verify profiles table exists and is accessible');
    }

    return {
      healthy: issues.length === 0,
      issues,
      recommendations
    };
  } catch (error) {
    return {
      healthy: false,
      issues: [`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
      recommendations: ['Check database connectivity and permissions']
    };
  }
}