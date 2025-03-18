import DashboardNavbar from "@/components/dashboard-navbar";
import SpendingInsights from "@/components/ai-features/spending-insights";
import ReceiptScanner from "@/components/ai-features/receipt-scanner";
import SmartBudgeting from "@/components/ai-features/smart-budgeting";
import FutureForecasting from "@/components/ai-features/future-forecasting";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Sparkles, Receipt } from "lucide-react";
import { CurrencyCode } from "@/lib/utils";
import { createSupabaseClient } from '@/lib/supabase-client';

export default async function AIFeaturesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get company settings
  const supabaseClient = createSupabaseClient();
  const { data: settings } = await supabaseClient
    .from('company_settings')
    .select('*')
    .single();

  // Use default currency if settings don't exist
  const currency = settings?.default_currency as CurrencyCode || 'USD';

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">AI Features</h1>
              <p className="text-muted-foreground">
                Intelligent insights and recommendations for your finances
              </p>
            </div>
          </header>

          {/* AI Features Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-blue-100">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <CardTitle className="text-lg">Spending Insights</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Analyze your spending patterns and get personalized recommendations to optimize your budget.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-amber-100">
                    <Lightbulb className="h-5 w-5 text-amber-600" />
                  </div>
                  <CardTitle className="text-lg">Smart Budgeting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Get AI-powered budget suggestions based on your income, expenses, and financial goals.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-purple-100">
                    <Sparkles className="h-5 w-5 text-purple-600" />
                  </div>
                  <CardTitle className="text-lg">Future Forecasting</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Predict future expenses and income based on your historical financial data.
                </CardDescription>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-full bg-green-100">
                    <Receipt className="h-5 w-5 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">Receipt Scanner</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  Upload receipt images to automatically extract and create transactions with OCR technology.
                </CardDescription>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="spending-insights" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="spending-insights">Spending Insights</TabsTrigger>
              <TabsTrigger value="smart-budgeting">Smart Budgeting</TabsTrigger>
              <TabsTrigger value="future-forecasting">Future Forecasting</TabsTrigger>
              <TabsTrigger value="receipt-scanner">Receipt Scanner</TabsTrigger>
            </TabsList>
            
            <TabsContent value="spending-insights">
              <SpendingInsights currency={currency} />
            </TabsContent>
            
            <TabsContent value="smart-budgeting">
              <SmartBudgeting currency={currency} />
            </TabsContent>
            
            <TabsContent value="future-forecasting">
              <FutureForecasting currency={currency} />
            </TabsContent>
            
            <TabsContent value="receipt-scanner">
              <ReceiptScanner currency={currency} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
