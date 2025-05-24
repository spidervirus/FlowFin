import { InfoIcon, Plus, LucideProps } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server-client";
import FinancialOverviewCard from "@/components/dashboard-components/financial-overview-card";
import RecentTransactions from "@/components/dashboard-components/recent-transactions";
import AccountsSummary from "@/components/dashboard-components/accounts-summary";
import CashFlowChart from "@/components/dashboard-components/cash-flow-chart";
import BudgetWidget from "@/components/dashboard-components/budget-widget";
import GoalsWidget from "@/components/dashboard-components/goals-widget";
import { Button } from "@/components/ui/button";
import type { Database } from "@/types/supabase";
import { CurrencyCode } from "@/lib/utils";
import DashboardWrapper from "./dashboard-wrapper";
import { headers } from "next/headers";
import FallbackDashboardNew from "@/components/dashboard-components/fallback-dashboard-new";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import ProcessPendingSetup from "@/components/dashboard-components/process-pending-setup";
import { FinancialGoal } from "@/types/financial";
import ErrorDisplay from "@/components/error-display";

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

type Tables = Database['public']['Tables'];
type DbAccount = Tables['accounts']['Row'];
type DbTransaction = Tables['transactions']['Row'];

// Local definitions if 'budgets' and 'budget_tracking' are not in Supabase types
interface DbBudget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount: number; // Assuming 'amount' is part of DbBudget based on BudgetWithTracking
  period: "monthly" | "quarterly" | "yearly" | "one_time"; // Assuming common periods
  start_date: string;
  end_date: string | null;
  created_at: string;
  updated_at: string;
  // Add any other fields that are spread from 'budget' in BudgetWithTracking
}

interface DbBudgetTracking {
  id: string;
  user_id: string;
  budget_id: string;
  period_start_date: string;
  period_end_date: string;
  planned_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
}
// End local definitions

// type DbBudget = Tables['budgets']['Row']; // Original line, commented out
// type DbBudgetTracking = Tables['budget_tracking']['Row']; // Original line, commented out
type DbFinancialGoal = Tables['financial_goals']['Row'];

// Extended types for dashboard use
interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment" | "cash" | "other";
  balance: number;
  currency: CurrencyCode;
  institution: string | null;
  account_number: string | null;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
  user_id: string;
  previous_balance: number;
}

interface DashboardTransaction extends Omit<DbTransaction, 'type' | 'category'> {
  type: 'income' | 'expense';
  category: string;
}

interface BudgetWithTracking extends DbBudget {
  budget_id: string;
  amount: number;
  spent: number;
  remaining: number;
}

interface MonthlyMetric {
  month: string;
  income: number;
  expenses: number;
  balance: number;
}

interface AccountBalance {
  name: string;
  type: Account['type'];
  balance: number;
}

interface BudgetMetric {
  budget_id: string;
  name: string;
  amount: number;
  spent: number;
  remaining: number;
}

// Update account filtering and mapping
const processAccounts = (accounts: DbAccount[] | null): Account[] => {
  const validAccountTypes = ["checking", "savings", "credit", "investment", "cash", "other"] as const;
  type AccountTypeEnum = typeof validAccountTypes[number];

  return accounts?.map((account): Account => {
    let validatedType: AccountTypeEnum = "other"; // Default type
    if (account.type && validAccountTypes.includes(account.type as any)) {
      validatedType = account.type as AccountTypeEnum;
    }
    return {
      id: account.id,
      name: account.name,
      type: validatedType,
      balance: account.balance,
      currency: account.currency as CurrencyCode,
      institution: account.institution,
      account_number: account.account_number,
      is_active: account.is_active,
      notes: account.notes,
      created_at: account.created_at,
      updated_at: account.updated_at,
      user_id: account.user_id,
      previous_balance: account.balance
    };
  }) || [];
};

// Process transactions for dashboard
const processDashboardTransactions = (transactions: (DbTransaction & { category: Tables['categories']['Row'] | null })[] | null): DashboardTransaction[] => {
  return transactions?.filter(t => t.type !== 'transfer').map(t => ({
    ...t,
    type: t.type as 'income' | 'expense',
    category: t.category?.name || ''
  })) || [];
};

// Process budgets with tracking
const processBudgetTracking = (
  budgets: DbBudget[] | null,
  tracking: DbBudgetTracking[] | null
): BudgetWithTracking[] => {
  return budgets?.map(budget => {
    const trackingData = tracking?.find(t => t.budget_id === budget.id);
    return {
      ...budget,
      budget_id: budget.id,
      amount: trackingData?.planned_amount || 0,
      spent: trackingData?.actual_amount || 0,
      remaining: (trackingData?.planned_amount || 0) - (trackingData?.actual_amount || 0)
    };
  }) || [];
};

// Process goals for dashboard
const processGoals = (goals: DbFinancialGoal[] | null): FinancialGoal[] => {
  return goals?.map(goal => ({
    id: goal.id,
    user_id: goal.user_id,
    name: goal.name,
    description: goal.description ?? null, // Use description from DbFinancialGoal
    target_amount: goal.target_amount,
    current_amount: goal.current_amount,
    start_date: goal.start_date ?? goal.created_at, // Prefer start_date if it exists
    target_date: goal.target_date,
    is_completed: goal.is_completed ?? false, // Use direct boolean field
    is_active: goal.is_active ?? true,       // Use direct boolean field
    created_at: goal.created_at,
    updated_at: goal.updated_at,
    category_id: goal.category_id || null,
    icon: goal.icon ?? null, // Use icon from DbFinancialGoal
    color: goal.color ?? null, // Use color from DbFinancialGoal
    category: undefined,
    contributions: []
  })) || [];
};

export default async function DashboardPage() {
  try {
    const supabase = createServerClient();

    // Get the authenticated user instead of using session.user
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError) {
      console.error('Error getting user:', userError);
      return <ErrorDisplay message="Error loading user data" />;
    }

    if (!user) {
      redirect('/sign-in');
    }

    // Get company settings and data in parallel
    const [
      settingsResult,
      currentMonthTransactionsResult,
      lastMonthTransactionsResult,
      accountsResult
    ] = await Promise.all([
      supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", user.id)
        .single(),
      supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .gte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .lte("date", new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString()),
      supabase
        .from("transactions")
        .select("*, category:categories(*)")
        .eq("user_id", user.id)
        .gte("date", new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).toISOString())
        .lte("date", new Date(new Date().getFullYear(), new Date().getMonth(), 0).toISOString()),
      supabase
        .from("accounts")
        .select("*")
        .eq("user_id", user.id)
    ]);

    // Handle errors
    if (settingsResult.error && settingsResult.error.code !== 'PGRST116') {
      console.error('Error getting settings:', settingsResult.error);
      return <ErrorDisplay message="Error loading company settings" />;
    }

    if (currentMonthTransactionsResult.error) {
      console.error('Error getting current month transactions:', currentMonthTransactionsResult.error);
      return <ErrorDisplay message="Error loading transaction data" />;
    }

    if (lastMonthTransactionsResult.error) {
      console.error('Error getting last month transactions:', lastMonthTransactionsResult.error);
      return <ErrorDisplay message="Error loading transaction data" />;
    }

    if (accountsResult.error) {
      console.error('Error getting accounts:', accountsResult.error);
      return <ErrorDisplay message="Error loading account data" />;
    }

    // Process the data
    const settings = settingsResult.data;
    const currency = (settings?.default_currency as CurrencyCode) || "USD";
    const currentMonthTransactions = currentMonthTransactionsResult.data || [];
    const lastMonthTransactions = lastMonthTransactionsResult.data || [];
    const accounts = accountsResult.data || [];

    // Calculate metrics
    const currentMonthRevenue = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentMonthExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthRevenue = lastMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const lastMonthExpenses = lastMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Calculate changes
    const revenueChange = lastMonthRevenue === 0 ? 100 : ((currentMonthRevenue - lastMonthRevenue) / lastMonthRevenue) * 100;
    const expensesChange = lastMonthExpenses === 0 ? 100 : ((currentMonthExpenses - lastMonthExpenses) / lastMonthExpenses) * 100;
    const netProfitChange = lastMonthRevenue - lastMonthExpenses === 0 ? 100 : 
      (((currentMonthRevenue - currentMonthExpenses) - (lastMonthRevenue - lastMonthExpenses)) / 
      Math.abs(lastMonthRevenue - lastMonthExpenses)) * 100;

    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const lastMonthBalance = totalBalance - (currentMonthRevenue - currentMonthExpenses);
    const balanceChange = lastMonthBalance === 0 ? 100 : 
      ((totalBalance - lastMonthBalance) / Math.abs(lastMonthBalance)) * 100;

    // Use the comprehensive processAccounts function to get correctly typed accounts
    const fullyProcessedAccounts = processAccounts(accounts); 

    // Transform transactions to match Transaction type
    const transformedTransactions = currentMonthTransactions
      ?.filter(transaction => transaction.type !== 'transfer')
      ?.map(transaction => ({
        id: transaction.id,
        date: transaction.date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type as 'income' | 'expense',
        category: transaction.category_id || '',
        account_id: transaction.account_id,
        status: transaction.status,
        notes: transaction.notes || '',
        user_id: transaction.user_id
      })) || [];

    // Determine if setup is needed (e.g., based on company settings)
    const needsSetup = !settingsResult.data;

    return (
      <DashboardWrapper needsSetup={needsSetup}>
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">
                {settings?.company_name
                  ? `Welcome to ${settings.company_name}'s Dashboard`
                  : "Welcome to Your Dashboard"}
              </h1>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {new Date().toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </span>
              </div>
            </div>
            <p className="text-muted-foreground">
              Track your financial performance and manage your budgets all in one place.
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
            <CashFlowChart 
              currency={currency} 
              data={[
                { month: "Current", income: currentMonthRevenue, expenses: currentMonthExpenses },
                { month: "Last", income: lastMonthRevenue, expenses: lastMonthExpenses }
              ]} 
            />
            <AccountsSummary
              title="Checking Accounts"
              description="Your primary transaction accounts"
              accounts={fullyProcessedAccounts.filter(a => a.type === 'checking')}
              currency={currency}
            />
            <AccountsSummary
              title="Savings Accounts"
              description="Your savings and deposits"
              accounts={fullyProcessedAccounts.filter(a => a.type === 'savings')}
              currency={currency}
            />
          </section>

          {/* Recent Transactions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RecentTransactions
              transactions={transformedTransactions}
              currency={currency}
            />
            <AccountsSummary
              title="Credit Accounts"
              description="Your credit cards and loans"
              accounts={fullyProcessedAccounts.filter(a => a.type === 'credit')}
              currency={currency}
            />
            <GoalsWidget goals={[]} currency={currency} />
          </section>

          {/* Info Section */}
          {(!fullyProcessedAccounts || fullyProcessedAccounts.length === 0) && (
            <section className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4 items-start">
              <InfoIcon size="20" className="text-blue-500 mt-1" />
              <div>
                <h3 className="font-semibold text-blue-800 mb-1">
                  Getting Started
                </h3>
                <p className="text-blue-700">
                  Your account has been set up successfully! Start by adding
                  your accounts and transactions to see your financial data
                  here. Use the buttons above to get started.
                </p>
              </div>
            </section>
          )}
        </div>
      </DashboardWrapper>
    );
  } catch (error) {
    console.error('Unexpected error:', error);
    return <ErrorDisplay message="An unexpected error occurred" />;
  }
}
