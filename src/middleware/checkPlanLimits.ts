// import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'; // Commented out
// import { NextResponse } from 'next/server'; // Commented out
import type { NextRequest } from 'next/server';

export async function checkPlanLimits(
  request: NextRequest, // request might still be needed by other parts of middleware, kept for signature compatibility
  feature: 'transactions' | 'receipts',
) {
  // Stripe plan limit checks are disabled. Always allow the action.
  console.log(`checkPlanLimits called for feature: "${feature}". Access granted (Stripe disabled).`);
  return {
    allowed: true,
  };

  /* Original Code:
  try {
    const supabase = createMiddlewareClient({ 
      req: request, 
      res: NextResponse.next()
    });
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return {
        error: 'Unauthorized',
        allowed: false,
      };
    }

    // Get user's subscription status
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('subscription_plan, subscription_status')
      .eq('id', user.id)
      .single();

    if (userError) {
      console.error('Error fetching user subscription:', userError);
      return {
        error: 'Error checking subscription',
        allowed: false,
      };
    }

    // If user is on free plan, check limits
    if (userData.subscription_plan === 'free' || userData.subscription_status !== 'active') {
      // Get current usage
      const { data: limits, error: limitsError } = await supabase
        .from('subscription_limits')
        .select('transactions_count, receipts_count')
        .eq('user_id', user.id)
        .single();

      if (limitsError && limitsError.code !== 'PGRST116') { // PGRST116 is "no rows returned"
        console.error('Error fetching usage limits:', limitsError);
        return {
          error: 'Error checking usage limits',
          allowed: false,
        };
      }

      const currentUsage = limits || { transactions_count: 0, receipts_count: 0 };

      // Check limits based on feature
      if (feature === 'transactions' && currentUsage.transactions_count >= 25) {
        return {
          error: 'Monthly transaction limit reached',
          allowed: false,
        };
      }

      if (feature === 'receipts' && currentUsage.receipts_count >= (userData.subscription_plan === 'pro' ? 50 : 0)) {
        return {
          error: 'Monthly receipt scanning limit reached',
          allowed: false,
        };
      }

      // If we're here, the action is allowed. Update the usage count.
      const { error: updateError } = await supabase
        .from('subscription_limits')
        .upsert({
          user_id: user.id,
          [feature === 'transactions' ? 'transactions_count' : 'receipts_count']: (currentUsage[`${feature}_count`] || 0) + 1,
          ...((!limits) && {
            period_start: new Date().toISOString(),
            period_end: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString(),
          }),
        });

      if (updateError) {
        console.error('Error updating usage limits:', updateError);
        return {
          error: 'Error updating usage limits',
          allowed: false,
        };
      }
    }

    // If we're here, either the user has a paid plan or they haven't exceeded their limits
    return {
      allowed: true,
    };
  } catch (error) {
    console.error('Error in checkPlanLimits:', error);
    return {
      error: 'Internal server error',
      allowed: false,
    };
  }
  */
} 