"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect } from "react";

import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  CreditCard,
  DollarSign,
  FileCheck,
  FileText,
  Home,
  Landmark,
  LogOut,
  Menu,
  PieChart,
  Quote,
  Receipt,
  Repeat,
  Search,
  Settings,
  Target,
  Truck,
  User,
  Users,
  Wallet,
} from "lucide-react";

import { useAuth } from "@/lib/auth/auth-context";
import { cn } from "@/lib/utils";

import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";

interface User {
  id: string;
  email: string;
  user_metadata?: {
    full_name?: string;
    avatar_url?: string;
  };
  role: string;
  status: "active" | "invited" | "inactive";
  last_active?: string;
}

export default function DashboardNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [userInitials, setUserInitials] = useState("U");
  const [salesOpen, setSalesOpen] = useState(false);
  const [accountsOpen, setAccountsOpen] = useState(false);
  const [desktopSalesOpen, setDesktopSalesOpen] = useState(false);
  const [desktopAccountsOpen, setDesktopAccountsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      title: "New invoice paid",
      description: "Invoice #1234 has been paid",
      time: "2 min ago",
      type: "success",
    },
    {
      id: 2,
      title: "Account balance updated",
      description: "Your account balance has been updated",
      time: "1 hour ago",
      type: "info",
    },
  ]);

  useEffect(() => {
    if (user?.email) {
      const initials = user.email
        .split("@")[0]
        .split(/[^a-zA-Z]/)
        .map((word) => word[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
      setUserInitials(initials);
    }
  }, [user?.email]);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push("/sign-in");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      href: "/dashboard",
      icon: <Home className="h-4 w-4 mr-2" />,
    },
    {
      name: "Transactions",
      href: "/dashboard/transactions",
      icon: <CreditCard className="h-4 w-4 mr-2" />,
    },
    {
      name: "Accounts",
      type: "accounts",
      icon: <Landmark className="h-4 w-4 mr-2" />,
      children: [
        {
          name: "Bank Accounts",
          href: "/dashboard/accounts",
          icon: <Wallet className="h-4 w-4 mr-2" />,
        },
        {
          name: "Manual Journals",
          href: "/dashboard/manual-journals",
          icon: <FileText className="h-4 w-4 mr-2" />,
        },
        {
          name: "Chart of Accounts",
          href: "/dashboard/chart-of-accounts",
          icon: <PieChart className="h-4 w-4 mr-2" />,
        },
      ],
    },
    {
      name: "Budgets",
      href: "/dashboard/budgets",
      icon: <DollarSign className="h-4 w-4 mr-2" />,
    },
    {
      name: "Goals",
      href: "/dashboard/goals",
      icon: <Target className="h-4 w-4 mr-2" />,
    },
    {
      name: "Sales",
      type: "sales",
      icon: <Receipt className="h-4 w-4 mr-2" />,
      children: [
        {
          name: "Customers",
          href: "/dashboard/sales/customers",
          icon: <Users className="h-4 w-4 mr-2" />,
        },
        {
          name: "Quotes",
          href: "/dashboard/sales/quotes",
          icon: <Quote className="h-4 w-4 mr-2" />,
        },
        {
          name: "Delivery Charges",
          href: "/dashboard/sales/delivery-charges",
          icon: <Truck className="h-4 w-4 mr-2" />,
        },
        {
          name: "Invoices",
          href: "/dashboard/sales/invoices",
          icon: <FileText className="h-4 w-4 mr-2" />,
        },
        {
          name: "Payments Received",
          href: "/dashboard/sales/payments",
          icon: <CreditCard className="h-4 w-4 mr-2" />,
        },
        {
          name: "Recurring Invoices",
          href: "/dashboard/sales/recurring-invoices",
          icon: <Repeat className="h-4 w-4 mr-2" />,
        },
        {
          name: "Credit Notes",
          href: "/dashboard/sales/credit-notes",
          icon: <FileCheck className="h-4 w-4 mr-2" />,
        },
      ],
    },
    {
      name: "Reports",
      href: "/dashboard/reports",
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
    },
    {
      name: "AI Features",
      href: "/dashboard/ai-features",
      icon: <PieChart className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <div className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4 md:gap-6">
          <div className="hidden md:flex">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions, accounts..."
                className="w-[200px] pl-8 md:w-[300px] bg-muted/50 focus:bg-background transition-colors"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="relative hover:bg-muted/50 transition-colors"
              >
                <Bell className="h-5 w-5" />
                {notifications.length > 0 && (
                  <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center bg-primary">
                    {notifications.length}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[380px]">
              <DropdownMenuLabel className="font-normal">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Notifications</span>
                  {notifications.length > 0 && (
                    <Button variant="ghost" size="sm" className="text-xs">
                      Mark all as read
                    </Button>
                  )}
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">
                  No new notifications
                </div>
              ) : (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    className="flex flex-col items-start gap-1 p-3 cursor-pointer hover:bg-muted/50 focus:bg-muted/50"
                  >
                    <div className="flex items-center gap-2">
                      <div className="font-medium">{notification.title}</div>
                      <Badge
                        variant={
                          notification.type === "success"
                            ? "default"
                            : "secondary"
                        }
                        className="text-xs"
                      >
                        {notification.type}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {notification.description}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {notification.time}
                    </div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full hover:bg-muted/50 transition-colors"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage
                    src={
                      user?.user_metadata?.avatar_url ||
                      `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.email || "")}&background=random`
                    }
                    alt={user?.email || ""}
                  />
                  <AvatarFallback>
                    {user?.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">
                    {user?.email}
                  </p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer">
                <User className="mr-2 h-4 w-4" />
                <span>Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem className="cursor-pointer">
                <Settings className="mr-2 h-4 w-4" />
                <span>Settings</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
