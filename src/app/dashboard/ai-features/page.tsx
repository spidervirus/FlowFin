"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Lightbulb, TrendingUp, Sparkles, Receipt } from "lucide-react";
import { CurrencyCode } from "@/lib/utils";
import DashboardWrapper from "../dashboard-wrapper";
import SpendingInsights from "@/components/ai-features/spending-insights";
import ReceiptScanner from "@/components/ai-features/receipt-scanner";
import SmartBudgeting from "@/components/ai-features/smart-budgeting/index";
import FutureForecasting from "@/components/ai-features/future-forecasting";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface CompanySettings {
  default_currency: CurrencyCode;
}

export default function AIFeaturesPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [activeTab, setActiveTab] = useState("insights");

  useEffect(() => {
    let settingsSubscription: any;
    let isMounted = true;

    async function fetchDataAndSubscribe() {
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

        if (!isMounted) return;

        // Transform settingsData to match the local CompanySettings interface
        let currencyToSet: CurrencyCode = "USD"; // Default fallback
        if (settingsData?.default_currency && ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "CNY", "INR"].includes(settingsData.default_currency.toUpperCase())) {
          currencyToSet = settingsData.default_currency.toUpperCase() as CurrencyCode;
        }
        
        setSettings({ default_currency: currencyToSet });
        setCurrency(currencyToSet); // Also update the separate currency state

    // Set up real-time subscription for settings updates
        settingsSubscription = supabaseClient
      .channel("settings_changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "company_settings",
              filter: `user_id=eq.${user.id}`,
        },
        () => {
              fetchDataAndSubscribe(); // re-fetch settings on change
        },
      )
      .subscribe();
      } catch (error) {
        console.error("Error in fetchDataAndSubscribe:", error);
        toast.error("An error occurred while loading data");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchDataAndSubscribe();

    return () => {
      isMounted = false;
      if (settingsSubscription) settingsSubscription.unsubscribe();
    };
  }, [router]);

  if (isLoading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading AI features...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <header>
          <h1 className="text-3xl font-bold">AI Features</h1>
          <p className="text-muted-foreground">
            Leverage artificial intelligence to enhance your financial
            management
          </p>
        </header>

        {/* AI Features Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="insights">
              <Lightbulb className="mr-2 h-4 w-4" />
              Spending Insights
            </TabsTrigger>
            <TabsTrigger value="budgeting">
              <TrendingUp className="mr-2 h-4 w-4" />
              Smart Budgeting
            </TabsTrigger>
            <TabsTrigger value="forecasting">
              <Sparkles className="mr-2 h-4 w-4" />
              Future Forecasting
            </TabsTrigger>
            <TabsTrigger value="scanner">
              <Receipt className="mr-2 h-4 w-4" />
              Receipt Scanner
            </TabsTrigger>
          </TabsList>

          <TabsContent value="insights">
              <SpendingInsights currency={currency} />
          </TabsContent>

          <TabsContent value="budgeting">
            <SmartBudgeting />
          </TabsContent>

          <TabsContent value="forecasting">
              <FutureForecasting currency={currency} />
          </TabsContent>

          <TabsContent value="scanner">
              <ReceiptScanner currency={currency} />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardWrapper>
  );
}
