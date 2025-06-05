import { ReactNode } from "react";

interface DashboardWrapperProps {
  children: ReactNode;
  needsSetup?: boolean;
}

export function DashboardWrapper({ children, needsSetup }: DashboardWrapperProps) {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      {children}
    </div>
  );
}