"use client";

import React, { Suspense, useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function LoadingSpinner() {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
    </div>
  );
}

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="flex h-screen items-center justify-center">
      <div className="text-center">
        <h2 className="text-lg font-semibold text-red-600">Error</h2>
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </div>
  );
}

export default function DashboardWrapper({
  children,
  needsSetup,
}: {
  children: React.ReactNode;
  needsSetup: boolean;
}) {
  const [showSetupReminder, setShowSetupReminder] = useState(needsSetup);

  // Optionally hide the reminder after a certain time or if user dismisses it
  useEffect(() => {
    if (!needsSetup) {
      setShowSetupReminder(false);
    }
  }, [needsSetup]);

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <div className={showSetupReminder ? "pointer-events-none" : ""}>
        {children}
      </div>

      {showSetupReminder && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <Card className="w-[350px]">
            <CardHeader>
              <CardTitle>Complete Your Setup</CardTitle>
              <CardDescription>Unlock full features by completing your company setup.</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-between items-center">
              <Button asChild size="sm">
                <Link href="/setup">Go to Setup</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={() => setShowSetupReminder(false)}>
                Dismiss
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </Suspense>
  );
}
