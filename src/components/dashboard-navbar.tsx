"use client";

import Link from "next/link";
import { createClient } from "../../supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import {
  BarChart3,
  FileText,
  Home,
  PieChart,
  Plus,
  Receipt,
  Settings,
  Sparkles,
  UserCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardNavbar() {
  const supabase = createClient();
  const router = useRouter();

  return (
    <nav className="w-full border-b border-gray-200 bg-white py-4 sticky top-0 z-50">
      <div className="container mx-auto px-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            prefetch
            className="text-xl font-bold flex items-center"
          >
            <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
            <span>FinanceFlow</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1 ml-8">
            <Link href="/dashboard">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <PieChart className="h-4 w-4" />
                <span>Dashboard</span>
              </Button>
            </Link>
            <Link href="/dashboard/transactions">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Receipt className="h-4 w-4" />
                <span>Transactions</span>
              </Button>
            </Link>
            <Link href="/dashboard/invoices">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <FileText className="h-4 w-4" />
                <span>Invoices</span>
              </Button>
            </Link>
            <Link href="/dashboard/reports">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <BarChart3 className="h-4 w-4" />
                <span>Reports</span>
              </Button>
            </Link>
            <Link href="/dashboard/ai-features">
              <Button
                variant="ghost"
                size="sm"
                className="flex items-center gap-2"
              >
                <Sparkles className="h-4 w-4" />
                <span>AI Features</span>
              </Button>
            </Link>
          </div>
        </div>

        <div className="flex gap-4 items-center">
          <Link href="/dashboard/transactions/new">
            <Button
              size="sm"
              variant="outline"
              className="hidden md:flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Transaction</span>
            </Button>
          </Link>

          <Link href="/dashboard/settings">
            <Button variant="ghost" size="icon" className="hidden md:flex">
              <Settings className="h-5 w-5 text-gray-500" />
            </Button>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <UserCircle className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href="/" className="flex w-full">
                  <Home className="mr-2 h-4 w-4" />
                  <span>Home</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Link href="/dashboard/settings" className="flex w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  <span>Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await supabase.auth.signOut();
                  router.refresh();
                }}
              >
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </nav>
  );
}
