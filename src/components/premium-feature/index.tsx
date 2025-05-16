import { ReactNode } from 'react';
// import { useSubscription } from '@/hooks/useSubscription'; // Removed
// import { Button } from '@/components/ui/button'; // No longer needed for upsell
// import { Lock } from 'lucide-react'; // No longer needed for upsell
// import Link from 'next/link'; // No longer needed for upsell
/* // No longer needed for upsell card
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
*/
// import { STRIPE_PLANS } from '@/lib/stripe/config'; // Removed

interface PremiumFeatureProps {
  feature: string; // Keep for potential future non-Stripe logic, or remove if truly unused
  children: ReactNode;
  title?: string; // Keep for potential future non-Stripe logic, or remove if truly unused
  description?: string; // Keep for potential future non-Stripe logic, or remove if truly unused
}

export function PremiumFeature({
  children,
}: PremiumFeatureProps) {
  // const { canAccessFeature, subscription, loading } = useSubscription(); // Removed

  // if (loading) { // Removed
  // return <div>Loading...</div>;
  // }

  // if (!canAccessFeature(feature)) { // Removed, all features accessible
    // const requiredPlan = feature === 'futureForecasting' ? 'ENTERPRISE' : 'PRO'; // Removed
    // const planName = STRIPE_PLANS[requiredPlan].name; // Removed

    // return ( // Removed upsell card
    //   <Card className="border-dashed">
    //     <CardHeader>
    //       <CardTitle className="flex items-center gap-2">
    //         <Lock className="w-5 h-5" />
    //         {title || 'Premium Feature'}
    //       </CardTitle>
    //       <CardDescription>
    //         {description || 'This feature is not available in your current plan'}
    //       </CardDescription>
    //     </CardHeader>
    //     <CardContent className="flex flex-col items-center space-y-4">
    //       <p className="text-sm text-muted-foreground text-center">
    //         Upgrade to {planName} to access this feature
    //       </p>
    //       <Link href="/pricing">
    //         <Button>View Plans</Button>
    //       </Link>
    //     </CardContent>
    //   </Card>
    // );
  // }

  return <>{children}</>;
} 