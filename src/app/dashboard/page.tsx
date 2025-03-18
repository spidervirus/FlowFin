import DashboardNavbar from "@/components/dashboard-navbar";
import { InfoIcon, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createSupabaseClient } from '@/lib/supabase-client';
import FinancialOverviewCard from "@/components/dashboard-components/financial-overview-card";
import RecentTransactions from "@/components/dashboard-components/recent-transactions";
import AccountsSummary from "@/components/dashboard-components/accounts-summary";
import CashFlowChart from "@/components/dashboard-components/cash-flow-chart";
import BudgetWidget from "@/components/dashboard-components/budget-widget";
import GoalsWidget from "@/components/dashboard-components/goals-widget";
import { Button } from "@/components/ui/button";
import { BudgetTracking } from "@/types/financial";
import { CurrencyCode } from "@/lib/utils";
import DashboardWrapper from "./dashboard-wrapper";
import { headers } from "next/headers";
import FallbackDashboardNew from "@/components/dashboard-components/fallback-dashboard-new";
import { createClient as createServerClient } from '@supabase/supabase-js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { LucideProps } from "lucide-react";
import ProcessPendingSetup from "@/components/dashboard-components/process-pending-setup";

// Define Icons object with necessary icons
const Icons = {
  dollarSign: (props: LucideProps) => (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <line x1="12" y1="1" x2="12" y2="23"></line>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
    </svg>
  ),
};

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Get company settings
  const supabaseClient = createSupabaseClient();
  const { data: settings } = await supabaseClient
    .from('company_settings')
    .select('*')
    .single();

  // Use default currency if settings don't exist
  const currency = settings?.default_currency as CurrencyCode || 'USD';

  // Fetch all necessary data
  const now = new Date();
  const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

  // Fetch transactions for current and last month
  const { data: currentMonthTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', firstDayOfMonth.toISOString())
    .lte('date', lastDayOfMonth.toISOString());

  const { data: lastMonthTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', firstDayOfLastMonth.toISOString())
    .lte('date', lastDayOfLastMonth.toISOString());

  // Calculate current month metrics
  const currentMonthRevenue = currentMonthTransactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

  const currentMonthExpenses = currentMonthTransactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

  // Calculate last month metrics for comparison
  const lastMonthRevenue = lastMonthTransactions
    ?.filter(t => t.type === 'income')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

  const lastMonthExpenses = lastMonthTransactions
    ?.filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0) || 0;

  // Calculate percentage changes
  const revenueChange = lastMonthRevenue ? ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100 : 0;
  const expensesChange = lastMonthExpenses ? ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100 : 0;
  const netProfitChange = lastMonthRevenue ? (((currentMonthRevenue - currentMonthExpenses) - (lastMonthRevenue - lastMonthExpenses)) / (lastMonthRevenue - lastMonthExpenses)) * 100 : 0;

  // Fetch accounts data
  const { data: accounts } = await supabase
    .from('accounts')
    .select('*')
    .eq('user_id', user.id);

  // Calculate account balances
  const totalBalance = accounts
    ?.reduce((sum, account) => sum + (parseFloat(account.balance) || 0), 0) || 0;

  const lastMonthBalance = accounts
    ?.reduce((sum, account) => sum + (parseFloat(account.previous_balance) || 0), 0) || 0;

  const balanceChange = lastMonthBalance ? ((totalBalance - lastMonthBalance) / lastMonthBalance) * 100 : 0;

  // Fetch accounts receivable and payable
  const receivableAccounts = accounts?.filter(a => a.type === 'receivable') || [];
  const payableAccounts = accounts?.filter(a => a.type === 'payable') || [];

  // Fetch recent transactions
  const { data: recentTransactions } = await supabase
    .from('transactions')
    .select(`
      *,
      category:categories(*)
    `)
    .eq('user_id', user.id)
    .order('date', { ascending: false })
    .limit(5);

  // Fetch budgets and tracking data
  const { data: budgets } = await supabase
    .from('budgets')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_active', true);

  const { data: tracking } = await supabase
    .from('budget_tracking')
    .select('*')
    .eq('user_id', user.id);

  // Fetch active goals
  const { data: goals } = await supabase
    .from('goals')
    .select('*')
    .eq('user_id', user.id)
    .eq('is_completed', false);

  // Fetch cash flow data for the chart (last 12 months)
  const firstDayOfYear = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const { data: cashFlowTransactions } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.id)
    .gte('date', firstDayOfYear.toISOString())
    .lte('date', lastDayOfMonth.toISOString());

  // Process cash flow data
  const cashFlowData = Array.from({ length: 12 }, (_, i) => {
    const month = new Date(now.getFullYear(), now.getMonth() - 11 + i, 1);
    const monthTransactions = cashFlowTransactions?.filter(t => {
      const transDate = new Date(t.date);
      return transDate.getMonth() === month.getMonth() && transDate.getFullYear() === month.getFullYear();
    }) || [];

    const income = monthTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    const expenses = monthTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    return {
      month: month.toLocaleString('default', { month: 'short' }),
      income,
      expenses
    };
  });

  return (
    <DashboardWrapper>
      <main className="flex-1">
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {settings?.company_name 
                  ? `Welcome to ${settings.company_name}'s Dashboard` 
                  : "Welcome to Your Dashboard"}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              {budgets?.length === 0 && tracking?.length === 0 && goals?.length === 0
                ? "Your account has been set up successfully! Start by adding your accounts and transactions to see your financial data here."
                : "Track your financial performance and manage your budgets all in one place."}
            </p>
          </div>

          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FinancialOverviewCard
              title="Total Revenue"
              amount={currentMonthRevenue}
              percentageChange={revenueChange}
              timeframe="from last month"
              type="income"
              currency={currency}
            />
            <FinancialOverviewCard
              title="Total Expenses"
              amount={currentMonthExpenses}
              percentageChange={expensesChange}
              timeframe="from last month"
              type="expense"
              currency={currency}
            />
            <FinancialOverviewCard
              title="Net Profit"
              amount={currentMonthRevenue - currentMonthExpenses}
              percentageChange={netProfitChange}
              timeframe="from last month"
              type="profit"
              currency={currency}
            />
            <FinancialOverviewCard
              title="Account Balance"
              amount={totalBalance}
              percentageChange={balanceChange}
              timeframe="from last month"
              type="balance"
              currency={currency}
            />
          </section>

          {/* Cash Flow Chart */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CashFlowChart currency={currency} data={cashFlowData} />
            <AccountsSummary
              title="Accounts Receivable"
              description="Outstanding customer invoices"
              accounts={receivableAccounts}
              type="receivable"
              currency={currency}
            />
            <BudgetWidget 
              budgets={budgets || []} 
              tracking={tracking || []}
              currency={currency}
            />
          </section>

          {/* Recent Transactions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RecentTransactions transactions={recentTransactions || []} currency={currency} />
            <AccountsSummary
              title="Accounts Payable"
              description="Bills to be paid"
              accounts={payableAccounts}
              type="payable"
              currency={currency}
            />
            <GoalsWidget goals={goals || []} currency={currency} />
          </section>

          {/* Info Section */}
          {budgets?.length === 0 && tracking?.length === 0 && goals?.length === 0 && (
            <section className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4 items-start">
              <InfoIcon size="20" className="text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  Getting Started
                </h3>
                <p className="text-blue-700">
                  Your account has been set up successfully! Start by adding your accounts and transactions to see your financial data here. Use the buttons above to get started.
                </p>
              </div>
            </section>
          )}
        </div>
      </main>
    </DashboardWrapper>
  );
}
