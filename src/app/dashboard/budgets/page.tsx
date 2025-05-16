"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import DashboardWrapper from "../dashboard-wrapper";
import BudgetList from "@/components/budget-components/budget-list";
import BudgetOverview from "@/components/budget-components/budget-overview";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { Budget, BudgetTracking, CompanySettings, Category } from "@/types/financial";
import type { Database } from "@/types/supabase";

interface DatabaseCategory {
  id: string;
  name: string;
  type: "income" | "expense";
  color: string | null;
}

interface DatabaseBudgetTracking {
  id: string;
  budget_id: string;
  category_id: string | null;
  month: string;
  planned_amount: number;
  actual_amount: number;
  created_at: string;
  updated_at: string;
  category: DatabaseCategory | null;
}

interface CategoryData {
  id: string;
  budget_id: string;
  user_id: string;
  category_id: string;
  amount: number;
  category: DatabaseCategory | null;
}

export default function BudgetsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [tracking, setTracking] = useState<BudgetTracking[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const supabaseClient = createClient();

        // Check if user is authenticated
        const {
          data: { user },
        } = await supabaseClient.auth.getUser();
        if (!user) {
          router.push("/sign-in");
          return;
        }

        // Fetch company settings
        const { data: settingsData, error: settingsError } =
          await supabaseClient
            .from("company_settings")
            .select("*")
            .eq("user_id", user.id)
            .single();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
          toast.error("Failed to load company settings");
          return;
        }

        setSettings(settingsData);
        if (settingsData?.default_currency) {
          setCurrency(settingsData.default_currency as CurrencyCode);
        }

        // Get current month for filtering
        const currentDate = new Date();
        const currentMonth = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, "0")}-01`;

        // Fetch active budgets
        const { data: budgetsData, error: budgetsError } = await supabaseClient
          .from("budgets")
          .select("*")
          .eq("user_id", user.id)
          .eq("is_active", true)
          .lte("start_date", currentDate.toISOString().split("T")[0])
          .gte("end_date", currentDate.toISOString().split("T")[0])
          .order("created_at", { ascending: false });

        if (budgetsError) {
          console.error("Error fetching budgets:", budgetsError);
          toast.error("Failed to load budgets");
          return;
        }

        if (budgetsData && budgetsData.length > 0) {
          const budgetIds = budgetsData.map((budget) => budget.id);

          // Fetch budget categories
          const { data: rawCategoriesData, error: categoriesError } =
            await supabaseClient
              .from("budget_categories")
              .select(
                `
                id,
                budget_id,
                user_id,
                category_id,
                amount,
                category:categories(id, name, type, color)
              `,
              )
              .in("budget_id", budgetIds)
              .eq("user_id", user.id);

          if (categoriesError) {
            console.error("Error fetching budget categories:", categoriesError);
            toast.error("Failed to load budget categories");
            return;
          }

          // Add categories to each budget
          const categoriesData = (rawCategoriesData as unknown) as CategoryData[];
          const budgetsWithCategories = budgetsData.map((budget) => ({
            ...budget,
            budget_categories: categoriesData
              .filter((item) => item.budget_id === budget.id)
              .map((item) => ({
                ...item,
                category: item.category ? {
                  id: item.category.id,
                  name: item.category.name,
                  type: item.category.type || "expense",
                  color: item.category.color
                } as Category : undefined
              }))
          })) as Budget[];

          setBudgets(budgetsWithCategories);

          // Fetch budget tracking data
          const { data: trackingData, error: trackingError } =
            await supabaseClient
              .from("budget_tracking")
              .select(`
                *,
                category:categories(id, name, type, color)
              `)
              .eq("user_id", user.id)
              .gte("month", currentMonth);

          if (trackingError) {
            console.error("Error fetching budget tracking:", trackingError);
            toast.error("Failed to load budget tracking data");
            return;
          }

          // Transform the tracking data to match BudgetTracking interface
          const transformedTracking: BudgetTracking[] = (trackingData || []).map((item: DatabaseBudgetTracking) => ({
            id: item.id,
            user_id: user.id,
            budget_id: item.budget_id,
            amount: item.planned_amount,
            spent: item.actual_amount,
            remaining: item.planned_amount - item.actual_amount,
            category: item.category ? {
              id: item.category.id,
              name: item.category.name,
              type: item.category.type,
              color: item.category.color,
              parent_id: null, // Default values for required fields
              is_active: true,
              created_at: item.created_at,
              updated_at: item.updated_at,
              user_id: user.id,
              is_default: false
            } : undefined,
            created_at: item.created_at,
            updated_at: item.updated_at
          }));

          setTracking(transformedTracking);
        } else {
          setBudgets([]);
          setTracking([]);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
        toast.error("An error occurred while loading data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    // Set up real-time subscription for budget updates
    const supabaseClient = createClient();
    const budgetsSubscription = supabaseClient
      .channel("budgets_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "budgets",
          filter: `user_id=eq.${supabaseClient.auth.getUser().then(({ data: { user } }) => user?.id)}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      budgetsSubscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading budgets...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Budgets</h1>
            <Link href="/dashboard/budgets/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Budget
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            Manage your budgets and track your spending across different
            categories
          </p>
        </div>

        <BudgetOverview
          budgets={budgets}
          tracking={tracking}
          currency={currency}
        />
        <BudgetList budgets={budgets} tracking={tracking} currency={currency} />
      </div>
    </DashboardWrapper>
  );
}
