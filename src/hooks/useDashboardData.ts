import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CurrencyCode, formatCurrency } from "@/lib/utils";
import { Transaction, Account, Budget, FinancialGoal } from "@/types/financial";

interface DashboardData {
  currentMonthRevenue: number;
  currentMonthExpenses: number;
  lastMonthRevenue: number;
  lastMonthExpenses: number;
  totalBalance: number;
  lastMonthBalance: number;
  recentTransactions: Transaction[];
  budgets: Budget[];
  goals: FinancialGoal[];
  cashFlowData: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      console.log("useDashboardData: Starting data fetch");
      try {
        const supabase = createClient();

        // Get current user
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error("useDashboardData: User error:", userError);
          throw new Error("User not found");
        }

        console.log("useDashboardData: Got user, fetching settings");

        // Get company settings
        const { data: settings, error: settingsError } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", user.id)
          .single();

        if (settingsError) {
          console.error("useDashboardData: Settings error:", settingsError);
          throw settingsError;
        }

        // Set currency from settings
        if (settings?.default_currency) {
          setCurrency(settings.default_currency as CurrencyCode);
        }

        // Fetch all data in parallel
        console.log("useDashboardData: Fetching all data in parallel");
        const [transactionsResult, budgetsResult, goalsResult, accountsResult] =
          await Promise.all([
            supabase
              .from("transactions")
              .select("*, category:categories(*)")
              .eq("user_id", user.id)
              .order("created_at", { ascending: false })
              .limit(5),
            supabase.from("budgets").select("*").eq("user_id", user.id),
            supabase.from("goals").select("*").eq("user_id", user.id),
            supabase.from("accounts").select("*").eq("user_id", user.id),
          ]);

        if (!isMounted) {
          console.log(
            "useDashboardData: Component unmounted, stopping data processing",
          );
          return;
        }

        // Process the data
        const transactions: Transaction[] = transactionsResult.data || [];
        const budgets: Budget[] = budgetsResult.data || [];
        const goals: FinancialGoal[] = goalsResult.data || [];
        const accounts: Account[] = accountsResult.data || [];

        // Calculate totals
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth();
        const currentYear = currentDate.getFullYear();
        const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
        const lastYear = currentMonth === 0 ? currentYear - 1 : currentYear;

        const currentMonthTransactions = transactions.filter((t: Transaction) => {
          const tDate = new Date(t.created_at);
          return (
            tDate.getMonth() === currentMonth &&
            tDate.getFullYear() === currentYear
          );
        });

        const lastMonthTransactions = transactions.filter((t: Transaction) => {
          const tDate = new Date(t.created_at);
          return (
            tDate.getMonth() === lastMonth && tDate.getFullYear() === lastYear
          );
        });

        const dashboardData: DashboardData = {
          currentMonthRevenue: currentMonthTransactions
            .filter((t: Transaction) => t.type === "income")
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          currentMonthExpenses: currentMonthTransactions
            .filter((t: Transaction) => t.type === "expense")
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          lastMonthRevenue: lastMonthTransactions
            .filter((t: Transaction) => t.type === "income")
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          lastMonthExpenses: lastMonthTransactions
            .filter((t: Transaction) => t.type === "expense")
            .reduce((sum: number, t: Transaction) => sum + t.amount, 0),
          totalBalance: accounts.reduce((sum: number, a: Account) => sum + a.balance, 0),
          lastMonthBalance: accounts.reduce((sum: number, a: Account) => sum + a.balance, 0),
          recentTransactions: transactions,
          budgets,
          goals,
          cashFlowData: [], // This would need to be calculated based on your requirements
        };

        console.log("useDashboardData: Data processed successfully");
        setData(dashboardData);
        setLoading(false);
      } catch (err) {
        console.error("useDashboardData: Error fetching data:", err);
        if (isMounted) {
          setError(
            err instanceof Error
              ? err.message
              : "Failed to fetch dashboard data",
          );
          setLoading(false);
        }
      }
    }

    fetchData();

    return () => {
      console.log("useDashboardData: Cleaning up");
      isMounted = false;
    };
  }, []);

  return { data, currency, loading, error };
}
