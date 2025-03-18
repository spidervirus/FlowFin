'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  CreditCard,
  FileText,
  BarChart3,
  Settings,
  Users,
  Receipt,
  PieChart,
  Building,
  Landmark
} from 'lucide-react';

interface SidebarItemProps {
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
}

const SidebarItem = ({ href, icon, label, active }: SidebarItemProps) => (
  <Link
    href={href}
    className={cn(
      'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-all hover:bg-accent',
      active ? 'bg-accent text-accent-foreground font-medium' : 'text-muted-foreground'
    )}
  >
    {icon}
    <span>{label}</span>
  </Link>
);

export default function DashboardSidebar() {
  const pathname = usePathname();
  
  const routes = [
    {
      href: '/dashboard',
      icon: <LayoutDashboard className="h-4 w-4" />,
      label: 'Dashboard',
      active: pathname === '/dashboard'
    },
    {
      href: '/dashboard/accounts',
      icon: <Landmark className="h-4 w-4" />,
      label: 'Accounts',
      active: pathname.startsWith('/dashboard/accounts')
    },
    {
      href: '/dashboard/transactions',
      icon: <CreditCard className="h-4 w-4" />,
      label: 'Transactions',
      active: pathname.startsWith('/dashboard/transactions')
    },
    {
      href: '/dashboard/invoices',
      icon: <FileText className="h-4 w-4" />,
      label: 'Invoices',
      active: pathname.startsWith('/dashboard/invoices')
    },
    {
      href: '/dashboard/expenses',
      icon: <Receipt className="h-4 w-4" />,
      label: 'Expenses',
      active: pathname.startsWith('/dashboard/expenses')
    },
    {
      href: '/dashboard/reports',
      icon: <BarChart3 className="h-4 w-4" />,
      label: 'Reports',
      active: pathname.startsWith('/dashboard/reports')
    },
    {
      href: '/dashboard/analytics',
      icon: <PieChart className="h-4 w-4" />,
      label: 'Analytics',
      active: pathname.startsWith('/dashboard/analytics')
    },
    {
      href: '/dashboard/clients',
      icon: <Users className="h-4 w-4" />,
      label: 'Clients',
      active: pathname.startsWith('/dashboard/clients')
    },
    {
      href: '/dashboard/company',
      icon: <Building className="h-4 w-4" />,
      label: 'Company',
      active: pathname.startsWith('/dashboard/company')
    },
    {
      href: '/dashboard/settings',
      icon: <Settings className="h-4 w-4" />,
      label: 'Settings',
      active: pathname.startsWith('/dashboard/settings')
    }
  ];

  return (
    <div className="hidden border-r bg-background md:block md:w-64 lg:w-72">
      <div className="flex h-full flex-col gap-2 p-4">
        <div className="py-2">
          <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
            Navigation
          </h2>
          <div className="space-y-1">
            {routes.map((route) => (
              <SidebarItem
                key={route.href}
                href={route.href}
                icon={route.icon}
                label={route.label}
                active={route.active}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 