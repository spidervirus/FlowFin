"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import {
  BarChart3,
  Building,
  Calculator,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  Landmark,
  LayoutDashboard,
  LogOut,
  PieChart,
  Quote,
  Receipt,
  Repeat,
  Settings,
  Target,
  Truck,
  UserCircle,
  Users,
  Wallet,
  Users2,
  Package,
} from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "./ui/accordion";

interface SidebarItemProps {
  href?: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const SidebarItem = ({
  href,
  icon,
  label,
  active,
  onClick,
  children,
}: SidebarItemProps) => {
  if (children) {
    return (
      <div className="relative">
        <button
          onClick={onClick}
          className={cn(
            "flex items-center justify-between w-full gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
            active
              ? "bg-primary text-primary-foreground"
              : "hover:bg-accent hover:text-accent-foreground",
          )}
        >
          <div className="flex items-center gap-3">
            {icon}
            {label}
          </div>
          <ChevronDown className="h-4 w-4" />
        </button>
        {children}
      </div>
    );
  }

  if (!href) return null;

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "hover:bg-accent hover:text-accent-foreground",
      )}
    >
      {icon}
      {label}
    </Link>
  );
};

export default function DashboardSidebar() {
  const pathname = usePathname();
  const { signOut } = useAuth();
  const router = useRouter();
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [payrollOpen, setPayrollOpen] = useState(false);

  const handleSignOut = async (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault();
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error during sign out:", error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <LayoutDashboard className="h-4 w-4" />,
    },
    {
      name: "Transactions",
      href: "/dashboard/transactions",
      icon: <CreditCard className="h-4 w-4" />,
    },
    {
      name: "Accounts",
      type: "accounts",
      icon: <Landmark className="h-4 w-4" />,
      children: [
        {
          name: "Bank Accounts",
          href: "/dashboard/accounts",
          icon: <Wallet className="h-4 w-4" />,
        },
        {
          name: "Manual Journals",
          href: "/dashboard/manual-journals",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "Chart of Accounts",
          href: "/dashboard/chart-of-accounts",
          icon: <PieChart className="h-4 w-4" />,
        },
      ],
    },
    {
      name: "Sales",
      type: "sales",
      icon: <Receipt className="h-4 w-4" />,
      children: [
        {
          name: "Customers",
          href: "/dashboard/sales/customers",
          icon: <Users className="h-4 w-4" />,
        },
        /* // Temporarily commented out Quotes link
        {
          name: "Quotes",
          href: "/dashboard/sales/quotes",
          icon: <Quote className="h-4 w-4" />,
        },
        */
        {
          name: "Items",
          href: "/dashboard/sales/items",
          icon: <Package className="h-4 w-4" />,
        },
        {
          name: "Delivery Charges",
          href: "/dashboard/sales/delivery-charges",
          icon: <Truck className="h-4 w-4" />,
        },
        {
          name: "Invoices",
          href: "/dashboard/sales/invoices",
          icon: <FileText className="h-4 w-4" />,
        },
        {
          name: "Payments Received",
          href: "/dashboard/sales/payments",
          icon: <CreditCard className="h-4 w-4" />,
        },
        {
          name: "Recurring Invoices",
          href: "/dashboard/sales/recurring-invoices",
          icon: <Repeat className="h-4 w-4" />,
        },
        {
          name: "Credit Notes",
          href: "/dashboard/sales/credit-notes",
          icon: <FileCheck className="h-4 w-4" />,
        },
      ],
    },
    {
      name: "Payroll",
      type: "payroll",
      icon: <Calculator className="h-4 w-4" />,
      children: [
        {
          name: "Employees",
          href: "/dashboard/payroll/employees",
          icon: <UserCircle className="h-4 w-4" />,
        },
        {
          name: "Timesheets",
          href: "/dashboard/payroll/timesheets",
          icon: <CalendarDays className="h-4 w-4" />,
        },
        {
          name: "Pay Runs",
          href: "/dashboard/payroll/pay-runs",
          icon: <ClipboardList className="h-4 w-4" />,
        },
        {
          name: "Settings",
          href: "/dashboard/payroll/settings",
          icon: <Settings className="h-4 w-4" />,
        },
      ],
    },
    {
      name: "Budgets",
      href: "/dashboard/budgets",
      icon: <DollarSign className="h-4 w-4" />,
    },
    {
      name: "Goals",
      href: "/dashboard/goals",
      icon: <Target className="h-4 w-4" />,
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: <BarChart3 className="h-4 w-4" />,
    },
    {
      name: "AI Features",
      href: "/dashboard/ai-features",
      icon: <PieChart className="h-4 w-4" />,
    },
    {
      name: "Settings",
      href: "/dashboard/settings",
      icon: <Settings className="h-4 w-4" />,
    },
  ];

  return (
    <div className="hidden border-r bg-background md:block md:w-64 lg:w-72">
      <div className="flex h-full flex-col">
        <div className="flex h-16 items-center border-b px-4">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">FlowFin</span>
          </Link>
        </div>
        <div className="flex-1 overflow-auto py-4">
          <div className="px-4 space-y-1">
            {navItems.map((item) => {
              if (item.children) {
                const isAccounts = item.type === "accounts";
                const isSales = item.type === "sales";
                const isPayroll = item.type === "payroll";
                
                let isOpen = false;
                if (isAccounts) isOpen = accountsOpen;
                else if (isSales) isOpen = salesOpen;
                else if (isPayroll) isOpen = payrollOpen;

                const toggleOpen = () => {
                  if (isAccounts) setAccountsOpen(!accountsOpen);
                  else if (isSales) setSalesOpen(!salesOpen);
                  else if (isPayroll) setPayrollOpen(!payrollOpen);
                };

                return (
                  <div key={item.name}>
                    <button
                      onClick={toggleOpen}
                      className={cn(
                        "flex w-full items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                        item.children.some((child) => isActive(child.href))
                          ? "bg-muted font-medium text-primary"
                          : "text-muted-foreground",
                      )}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon}
                        <span>{item.name}</span>
                      </div>
                      <ChevronRight
                        className={cn(
                          "h-4 w-4 transition-transform",
                          isOpen && "rotate-90",
                        )}
                      />
                    </button>
                    {isOpen && (
                      <div className="mt-2 space-y-1 px-6">
                        {item.children.map((child) => (
                          <Link
                            key={child.href}
                            href={child.href}
                            className={cn(
                              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                              isActive(child.href)
                                ? "bg-muted font-medium text-primary"
                                : "text-muted-foreground",
                            )}
                          >
                            {child.icon}
                            <span>{child.name}</span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted",
                    isActive(item.href)
                      ? "bg-muted font-medium text-primary"
                      : "text-muted-foreground",
                  )}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>
        <div className="border-t p-4">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={handleSignOut}
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
}
