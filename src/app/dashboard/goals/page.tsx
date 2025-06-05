"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import DashboardWrapper from "../dashboard-wrapper";
import GoalsList from "@/components/goal-components/goals-list";
import GoalsOverview from "@/components/goal-components/goals-overview";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { FinancialGoal } from "@/types/financial";
import type { Database } from "@/app/types/supabase";

interface CompanySettings {
  id: string;
  user_id: string;
  company_name?: string;
  default_currency: CurrencyCode;
  address?: string;
  country?: string;
  fiscal_year_start?: string;
  industry?: string;
  created_at?: string;
  updated_at?: string;
}

type DbFinancialGoal = Database["public"]["Tables"]["financial_goals"]["Row"] & {
  category: Database["public"]["Tables"]["categories"]["Row"] | null;
  contributions: Database["public"]["Tables"]["goal_contributions"]["Row"][];
};

export default function GoalsPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [goals, setGoals] = useState<FinancialGoal[]>([]);
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

        if (settingsData) {
          const transformedSettings: CompanySettings = {
            id: settingsData.id,
            user_id: settingsData.user_id,
            company_name: settingsData.company_name ?? "N/A",
            default_currency: (settingsData.default_currency as CurrencyCode) ?? "USD",
            address: (settingsData as any).address ?? undefined,
            country: (settingsData as any).country ?? undefined,
            fiscal_year_start: (settingsData as any).fiscal_year_start ?? undefined,
            industry: (settingsData as any).industry ?? undefined,
            created_at: (settingsData as any).created_at ?? undefined,
            updated_at: (settingsData as any).updated_at ?? undefined,
          };
          setSettings(transformedSettings);
          // Use the transformed and validated currency
          setCurrency(transformedSettings.default_currency);
        } else {
          setSettings(null);
          setCurrency("USD"); // Default if no settings
        }

        // Fetch active goals with categories and contributions
        const { data: goalsData, error: goalsError } = await supabaseClient
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
          toast.error("Failed to load goals");
          return;
        }

        // Transform the data to match FinancialGoal type
        const transformedGoals = (goalsData || []).map((goal: any) => ({
          ...goal,
          category: goal.category?.[0] || undefined
        })) as FinancialGoal[];

        setGoals(transformedGoals);
      } catch (error) {
        console.error("Error in fetchData:", error);
        toast.error("An error occurred while loading data");
      } finally {
        setIsLoading(false);
      }
    }

    fetchData();

    // Set up real-time subscription for goal updates
    const supabaseClient = createClient();
    const goalsSubscription = supabaseClient
      .channel("goals_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "financial_goals",
          filter: `user_id=eq.${supabaseClient.auth.getUser().then(({ data: { user } }) => user?.id)}`,
        },
        () => {
          fetchData();
        },
      )
      .subscribe();

    return () => {
      goalsSubscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading goals...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Financial Goals</h1>
            <Link href="/dashboard/goals/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </Link>
          </div>
          <p className="text-muted-foreground">
            Set and track your financial goals
          </p>
        </div>

        <GoalsOverview goals={goals} currency={currency} />
        <GoalsList goals={goals} currency={currency} />
      </div>
    </DashboardWrapper>
  );
}
