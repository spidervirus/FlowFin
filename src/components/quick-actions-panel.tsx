"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  X,
  CreditCard,
  Wallet,
  Receipt,
  FileText,
  PiggyBank,
  DollarSign,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/utils/utils";

export default function QuickActionsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Don't show on auth pages
  if (
    pathname?.includes("/sign-in") ||
    pathname?.includes("/sign-up") ||
    pathname?.includes("/forgot-password") ||
    !pathname?.includes("/dashboard")
  ) {
    return null;
  }

  const actions = [
    {
      label: "Add Transaction",
      icon: <CreditCard className="h-4 w-4" />,
      href: "/dashboard/transactions/new",
      color: "bg-blue-500 hover:bg-blue-600",
    },
    {
      label: "New Account",
      icon: <Wallet className="h-4 w-4" />,
      href: "/dashboard/accounts/new",
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      label: "New Invoice",
      icon: <FileText className="h-4 w-4" />,
      href: "/dashboard/invoices/new",
      color: "bg-purple-500 hover:bg-purple-600",
    },
    {
      label: "New Budget",
      icon: <DollarSign className="h-4 w-4" />,
      href: "/dashboard/budgets/new",
      color: "bg-amber-500 hover:bg-amber-600",
    },
    {
      label: "New Goal",
      icon: <PiggyBank className="h-4 w-4" />,
      href: "/dashboard/goals/new",
      color: "bg-indigo-500 hover:bg-indigo-600",
    },
    {
      label: "Import Transactions",
      icon: <Receipt className="h-4 w-4" />,
      href: "/dashboard/transactions/import",
      color: "bg-teal-500 hover:bg-teal-600",
    },
  ];

  const handleActionClick = (href: string) => {
    router.push(href);
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen && (
        <div className="absolute bottom-16 right-0 mb-2 flex flex-col-reverse gap-2">
          {actions.map((action, index) => (
            <Button
              key={index}
              size="sm"
              className={cn(
                "flex items-center gap-2 text-white shadow-md transition-all",
                action.color,
                "translate-y-0 opacity-100 scale-100",
              )}
              style={{
                transitionDelay: `${index * 50}ms`,
              }}
              onClick={() => handleActionClick(action.href)}
            >
              {action.icon}
              <span>{action.label}</span>
            </Button>
          ))}
        </div>
      )}

      <Button
        size="icon"
        className={cn(
          "h-12 w-12 rounded-full shadow-lg transition-transform",
          isOpen
            ? "bg-red-500 hover:bg-red-600 rotate-45"
            : "bg-blue-500 hover:bg-blue-600",
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
      </Button>
    </div>
  );
}
