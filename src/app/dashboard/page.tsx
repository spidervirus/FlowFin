import DashboardNavbar from "@/components/dashboard-navbar";
import { InfoIcon, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "../../../supabase/server";
import FinancialOverviewCard from "@/components/dashboard-components/financial-overview-card";
import RecentTransactions from "@/components/dashboard-components/recent-transactions";
import AccountsSummary from "@/components/dashboard-components/accounts-summary";
import CashFlowChart from "@/components/dashboard-components/cash-flow-chart";
import BudgetWidget from "@/components/dashboard-components/budget-widget";
import GoalsWidget from "@/components/dashboard-components/goals-widget";
import { Button } from "@/components/ui/button";
import { BudgetTracking } from "@/types/financial";

export default async function Dashboard() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get current month for filtering - format as YYYY-MM-DD to avoid time zone issues
  const currentDate = new Date();
  const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-01`;

  // Get active budgets for current month
  const { data: budgets, error: budgetsError } = await supabase
    .from("budgets")
    .select(`
      *,
      budget_categories(
        id,
        amount,
        category:categories(id, name, type, color)
      )
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .lte("start_date", currentDate.toISOString().split('T')[0])
    .gte("end_date", currentDate.toISOString().split('T')[0])
    .order("created_at", { ascending: false });

  if (budgetsError) {
    console.error("Error fetching budgets:", budgetsError);
  }

  // Get budget tracking data for current month
  let tracking: BudgetTracking[] = [];
  if (budgets && budgets.length > 0) {
    const budgetIds = budgets.map((budget) => budget.id);
    const { data: trackingData, error: trackingError } = await supabase
      .from("budget_tracking")
      .select(`
        *,
        category:categories(id, name, type, color)
      `)
      .in("budget_id", budgetIds)
      .eq("month", currentMonth);

    if (trackingError) {
      console.error("Error fetching budget tracking:", trackingError);
    } else if (trackingData) {
      tracking = trackingData;
      
      // Add tracking data to each budget
      budgets.forEach((budget) => {
        budget.tracking = tracking.filter(
          (item) => item.budget_id === budget.id
        );
      });
    }
  }

  // Get active goals
  const { data: goals, error: goalsError } = await supabase
    .from("financial_goals")
    .select(`
      *,
      category:categories(*)
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("target_date", { ascending: true });

  if (goalsError) {
    console.error("Error fetching goals:", goalsError);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Financial Dashboard</h1>
              <p className="text-muted-foreground">
                Welcome back, {user.user_metadata?.full_name || user.email}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">Export Reports</Button>
              <Link href="/dashboard/transactions/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Transaction
                </Button>
              </Link>
            </div>
          </header>

          {/* Financial Overview Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <FinancialOverviewCard
              title="Total Revenue"
              amount={24500}
              percentageChange={12.5}
              timeframe="from last month"
              type="income"
            />
            <FinancialOverviewCard
              title="Total Expenses"
              amount={18200}
              percentageChange={8.2}
              timeframe="from last month"
              type="expense"
            />
            <FinancialOverviewCard
              title="Net Profit"
              amount={6300}
              percentageChange={15.3}
              timeframe="from last month"
              type="profit"
            />
            <FinancialOverviewCard
              title="Account Balance"
              amount={42800}
              percentageChange={5.7}
              timeframe="from last month"
              type="balance"
            />
          </section>

          {/* Cash Flow Chart */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <CashFlowChart />
            <AccountsSummary
              title="Accounts Receivable"
              description="Outstanding customer invoices"
              accounts={[]}
              type="receivable"
            />
            <BudgetWidget 
              budgets={budgets || []} 
              tracking={tracking} 
            />
          </section>

          {/* Recent Transactions */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <RecentTransactions />
            <AccountsSummary
              title="Accounts Payable"
              description="Bills to be paid"
              accounts={[]}
              type="payable"
            />
            <GoalsWidget goals={goals || []} />
          </section>

          {/* Info Section */}
          <section className="bg-blue-50 border border-blue-100 rounded-xl p-6 flex gap-4 items-start">
            <InfoIcon size="20" className="text-blue-500 mt-1" />
            <div>
              <h3 className="font-semibold text-blue-800 mb-1">
                Getting Started
              </h3>
              <p className="text-blue-700">
                This is a demo of the financial dashboard. In a real
                application, you would connect your bank accounts, import
                transactions, and manage your finances. Explore the features to
                see what's possible!
              </p>
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
