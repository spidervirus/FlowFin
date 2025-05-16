'use client';

// import { useEffect, useState } from 'react'; // Commented out
// import { useSupabase } from '@/contexts/SupabaseProvider'; // Commented out
// import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'; // Commented out
// import { Progress } from '@/components/ui/progress'; // Commented out
// import { useSubscription } from '@/hooks/useSubscription'; // Commented out

/* // Commented out UsageLimits interface as it's not used
interface UsageLimits {
  transactions_count: number;
  receipts_count: number;
  reset_date: string;
}
*/

export function SubscriptionAnalytics() {
  // const { supabase, user } = useSupabase(); // Commented out
  // const { subscription } = useSubscription(); // Commented out
  // const [usage, setUsage] = useState<UsageLimits | null>(null); // Commented out
  // const [loading, setLoading] = useState(true); // Commented out

  /* // Commented out useEffect for fetching usage data
  useEffect(() => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    async function fetchUsage() {
      try {
        const { data, error } = await supabase
          .from('usage_limits')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (error) throw error;
        setUsage(data);
      } catch (error) {
        console.error('Error fetching usage:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchUsage();

    // Subscribe to usage updates
    const channel = supabase
      .channel('usage_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'usage_limits',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setUsage(payload.new as UsageLimits);
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [supabase, user?.id]);
  */

  /* // Commented out loading and usage checks
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!usage) {
    return null;
  }
  */

  /* // Commented out helper functions for limits and formatting
  const getLimit = (type: 'transactions' | 'receipts') => {
    // ... original logic
  };

  const formatUsage = (current: number, limit: number) => {
    // ... original logic
  };

  const calculateProgress = (current: number, limit: number) => {
    // ... original logic
  };

  const nextReset = usage.reset_date
    ? new Date(usage.reset_date).toLocaleDateString()
    : 'N/A';
  */

  return (
    <div className="p-4 border rounded-lg bg-muted/40">
      <h3 className="text-lg font-semibold mb-2">Usage Analytics</h3>
          <p className="text-sm text-muted-foreground">
        Subscription and usage analytics are currently unavailable as Stripe integration is disabled.
      </p>
      <p className="text-sm text-muted-foreground mt-1">
        All features are operating without usage restrictions.
          </p>
    </div>
  );
} 