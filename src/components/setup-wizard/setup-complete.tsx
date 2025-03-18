'use client';

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function SetupComplete() {
  const router = useRouter();
  
  const handleManualRedirect = () => {
    console.log("Manual redirect to setup-redirect page...");
    router.push('/setup-redirect');
  };

  return (
    <div className="text-center space-y-4">
      <h3 className="text-lg font-medium">Setup Complete!</h3>
      <p>Your company has been set up successfully.</p>
      <p>You should be redirected to the dashboard automatically.</p>
      <p className="text-sm text-muted-foreground">If you're not redirected automatically, please click the button below:</p>
      <Button 
        onClick={handleManualRedirect} 
        className="w-full"
      >
        Go to Dashboard
      </Button>
    </div>
  );
} 