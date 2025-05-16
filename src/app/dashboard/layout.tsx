import React from 'react';
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/toaster";
import QuickActionsPanel from "@/components/quick-actions-panel";
import DashboardSidebar from "@/components/dashboard-sidebar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="flex h-screen overflow-hidden">
        <DashboardSidebar />
        <div className="flex-1 overflow-y-auto">
          <main className="container mx-auto p-6">
            {children}
          </main>
        </div>
      </div>
      <QuickActionsPanel />
      <Toaster />
    </div>
  );
} 