'use client';

// import { useSubscription } from '@/hooks/useSubscription'; // Commented out
// import { STRIPE_PLANS } from '@/lib/stripe/config'; // Commented out
// import { Button } from '@/components/ui/button'; // Commented out
/* // Commented out Card components as they are not used in the disabled state
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
*/
// import { Badge } from '@/components/ui/badge'; // Commented out
// import { SubscriptionAnalytics } from '@/components/subscription/SubscriptionAnalytics'; // Commented out

export default function BillingPage() {
  // const { subscription, loading, error, openBillingPortal } = useSubscription(); // Commented out

  /* // Commented out loading and error states as they depend on useSubscription
  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }
  */

  // const currentPlan = STRIPE_PLANS[subscription.plan]; // Commented out, depends on useSubscription

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Billing Settings</h1>

      <div className="grid gap-8">
        {/* Original Card for Current Plan is removed */}
        <div>
          <h2 className="text-2xl font-semibold mb-2">Subscription Status</h2>
          <p className="text-muted-foreground">
            Billing and subscription management are currently unavailable.
          </p>
          <p className="text-muted-foreground mt-2">
            All features are temporarily available. No payment is required at this time.
          </p>
        </div>

        {/* Original Card for Usage Analytics is removed */}
        {/* 
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your current subscription plan and status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold">{currentPlan.name}</h3>
                <p className="text-muted-foreground">${currentPlan.price}/month</p>
              </div>
              <Badge variant={subscription.status === 'active' ? 'default' : 'destructive'}>
                {subscription.status.charAt(0).toUpperCase() + subscription.status.slice(1)}
              </Badge>
            </div>

            {subscription.cancelAtPeriodEnd && (
              <div className="bg-muted p-4 rounded-lg mb-4">
                <p>
                  Your subscription will end on{' '}
                  {subscription.currentPeriodEnd
                    ? new Date(subscription.currentPeriodEnd).toLocaleDateString()
                    : 'N/A'}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <h4 className="font-medium">Features included:</h4>
              <ul className="list-disc list-inside space-y-1">
                {currentPlan.features.map((feature, index) => (
                  <li key={index} className="text-muted-foreground">
                    {feature}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-6">
              <Button onClick={openBillingPortal} className="w-full">
                {subscription.plan === 'FREE'
                  ? 'Upgrade Plan'
                  : 'Manage Subscription'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {subscription.plan !== 'FREE' && (
          <Card>
            <CardHeader>
              <CardTitle>Usage Analytics</CardTitle>
              <CardDescription>Track your subscription usage and limits</CardDescription>
            </CardHeader>
            <CardContent>
              <SubscriptionAnalytics />
            </CardContent>
          </Card>
        )}
        */}
      </div>
    </div>
  );
} 