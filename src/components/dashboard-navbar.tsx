"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  BarChart3,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Menu,
  PieChart,
  Settings,
  User,
  Wallet,
  DollarSign,
  Target,
} from "lucide-react";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { useAuth } from "@/lib/auth/auth-context";
import { useState, useEffect } from "react";

export default function DashboardNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [userInitials, setUserInitials] = useState("U");
  
  useEffect(() => {
    if (user?.email) {
      const email = user.email;
      const initials = email.charAt(0).toUpperCase();
      setUserInitials(initials);
    }
  }, [user]);

  const isActive = (path: string) => {
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const handleSignOut = async (e: React.MouseEvent<Element, MouseEvent>) => {
    e.preventDefault();
    try {
      const result = await signOut();
      if (result.success) {
        router.push('/sign-in');
      } else {
        console.error('Sign out failed:', result.error);
      }
    } catch (error) {
      console.error('Error during sign out:', error);
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
      href: "/dashboard/accounts",
      icon: <Wallet className="h-4 w-4 mr-2" />,
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
      name: "Reports",
      href: "/dashboard/reports",
      icon: <BarChart3 className="h-4 w-4 mr-2" />,
    },
    {
      name: "Invoices",
      href: "/dashboard/invoices",
      icon: <FileText className="h-4 w-4 mr-2" />,
    },
    {
      name: "AI Features",
      href: "/dashboard/ai-features",
      icon: <PieChart className="h-4 w-4 mr-2" />,
    },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center gap-4 md:gap-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-bold text-xl">FlowFin</span>
          </Link>

          <nav className="hidden md:flex gap-6">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                  isActive(item.href)
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-8 w-8 rounded-full"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarImage src="" alt="User" />
                  <AvatarFallback>{userInitials}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Settings</Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleSignOut}>
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Menu"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <Link href="/" className="flex items-center space-x-2 mb-8">
                <span className="font-bold text-xl">FlowFin</span>
              </Link>
              <nav className="flex flex-col gap-4">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                      isActive(item.href)
                        ? "text-foreground"
                        : "text-muted-foreground"
                    }`}
                  >
                    {item.icon}
                    {item.name}
                  </Link>
                ))}
                <Link
                  href="/dashboard/settings"
                  className={`flex items-center text-sm font-medium transition-colors hover:text-primary ${
                    isActive("/dashboard/settings")
                      ? "text-foreground"
                      : "text-muted-foreground"
                  }`}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Settings
                </Link>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

