import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase-browser";
import { CURRENCY_CONFIG, CurrencyCode } from "@/lib/utils";
import { toast } from "sonner";

// Define types for the component
export interface BudgetInsight {
  id: string;
  title: string;
  description: string;
  amount: number;
  changePercentage: number;
  isPositive: boolean;
  type: "overspending" | "savings" | "income" | "trend";
  category?: string;
  categoryColor?: string;
}

export interface MonthlyTrendsData {
  months: string[];
  income: number[];
  expenses: number[];
  savings: number[];
  categories: {
    name: string;
    color: string;
    values: number[];
  }[];
}

export interface BudgetRecommendation {
  id: string;
  title: string;
  description: string;
  impact: number;
  difficulty: "easy" | "medium" | "hard";
  category?: string;
  categoryColor?: string;
}

export interface CompanySettings {
  id?: string;
  user_id?: string;
  company_name?: string;
  address?: string;
  country?: string;
  default_currency?: CurrencyCode;
  fiscal_year_start?: string;
  industry?: string;
  tax_rate?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  category_id?: string;
  category?: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
  created_at: string;
  updated_at: string;
}

export function useBudgetingData() {
  const [budgetInsights, setBudgetInsights] = useState<BudgetInsight[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<MonthlyTrendsData>({
    months: [],
    income: [],
    expenses: [],
    savings: [],
    categories: [],
  });
  const [recommendations, setRecommendations] = useState<
    BudgetRecommendation[]
  >([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  // Check authentication and get user ID
  useEffect(() => {
    const getUser = async () => {
      try {
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError) {
          console.error("Authentication error:", userError);
          setError("Authentication failed. Please sign in again.");
          setUserId(null);
        } else if (user) {
          console.log("User ID set for budgeting:", user.id);
          setUserId(user.id);
        } else {
          console.error("No user found");
          setError("Authentication failed. Please sign in again.");
          setUserId(null);
        }
      } catch (err) {
        console.error("Error getting user:", err);
        setError("Failed to authenticate user");
        setUserId(null);
      }
    };

    getUser();
  }, []);

  // Fetch data function with explicit userId parameter
  const fetchData = useCallback(
    async (forceUserId?: string) => {
      setLoading(true);
      setError(null);

      const effectiveUserId = forceUserId || userId;

      if (!effectiveUserId) {
        console.error("No user ID available for budgeting request");
        setError("Authentication required. Please sign in.");
        setLoading(false);
        return;
      }

      try {
        console.log("Fetching budgeting data for user:", effectiveUserId);

        // First fetch company settings
        const supabase = createClient();
        const { data: settingsData, error: settingsError } = await supabase
          .from("company_settings")
          .select("*")
          .eq("user_id", effectiveUserId)
          .single();

        if (settingsError && settingsError.code !== "PGRST116") {
          console.error("Error fetching company settings:", settingsError);
          toast.error("Failed to load company settings");
        }

        // Use fetched settings or a default
        const effectiveSettings = settingsData || {
          id: "default",
          user_id: effectiveUserId,
          company_name: "Your Company",
          address: "",
          country: "US",
          default_currency: "USD" as CurrencyCode,
          fiscal_year_start: "01",
          industry: "other",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        setSettings(effectiveSettings);

        // Fetch transactions for tax preparation
        try {
          const { data: transactionsData, error: transactionsError } =
            await supabase
              .from("transactions")
              .select(
                `
            *,
            category:categories(id, name, type, color)
          `,
              )
              .eq("user_id", effectiveUserId)
              .order("date", { ascending: false });

          if (transactionsError) {
            console.error("Error fetching transactions:", transactionsError);
          } else {
            setTransactions(transactionsData || []);
          }
        } catch (err) {
          console.error("Error in transactions query:", err);
        }

        // Make API request to budgeting endpoint
        const response = await fetch("/api/ai-features/budgeting", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: effectiveUserId,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("API response error:", response.status, errorText);
          let errorData;
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            errorData = { error: errorText || "Unknown server error" };
          }
          throw new Error(
            errorData.error || `Server error: ${response.status}`,
          );
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to process budgeting data");
        }

        // Update state with API response data
        setBudgetInsights(data.data?.budgetInsights || []);
        setMonthlyTrends(
          data.data?.monthlyTrends || {
            months: [],
            income: [],
            expenses: [],
            savings: [],
            categories: [],
          },
        );
        setRecommendations(data.data?.recommendations || []);
        setError(null);
        toast.success("Budgeting data updated successfully");
      } catch (err) {
        console.error("Error in fetchData:", err);
        setError(
          err instanceof Error
            ? err.message
            : "An error occurred while fetching budgeting data",
        );
        setBudgetInsights([]);
        setMonthlyTrends({
          months: [],
          income: [],
          expenses: [],
          savings: [],
          categories: [],
        });
        setRecommendations([]);
        toast.error(
          err instanceof Error ? err.message : "Failed to fetch budgeting data",
        );
      } finally {
        setLoading(false);
      }
    },
    [userId],
  );

  // Fetch data when userId is available
  useEffect(() => {
    if (userId) {
      fetchData();
    }
  }, [fetchData, userId]);

  // Return a refreshData function that can accept an override userId
  const refreshDataWithPossibleOverride = useCallback(async () => {
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user?.id) {
        console.log("Refreshing budgeting data with latest user ID:", user.id);
        await fetchData(user.id);
        return;
      }

      if (!userId) {
        toast.error("Authentication failed. Please sign in again.");
        return;
      }

      await fetchData();
    } catch (error) {
      console.error("Error refreshing budgeting data:", error);
      toast.error("Failed to refresh budgeting data");
    }
  }, [fetchData, userId]);

  return {
    budgetInsights,
    monthlyTrends,
    recommendations,
    loading,
    error,
    refreshData: refreshDataWithPossibleOverride,
    settings,
    transactions,
  };
}
