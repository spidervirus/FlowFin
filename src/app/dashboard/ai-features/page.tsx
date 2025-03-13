import DashboardNavbar from "@/components/dashboard-navbar";
import SpendingInsights from "@/components/ai-features/spending-insights";
import ReceiptScanner from "@/components/ai-features/receipt-scanner";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Lightbulb, TrendingUp, Sparkles, Receipt } from "lucide-react";

export default async function AIFeaturesPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

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
                  Upload receipt images to automatically extract and create transactions with AI.
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
              <SpendingInsights />
            </TabsContent>
            
            <TabsContent value="smart-budgeting">
              <Card>
                <CardHeader>
                  <CardTitle>Smart Budgeting</CardTitle>
                  <CardDescription>
                    AI-powered budget recommendations
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Lightbulb className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md">
                      We're working on intelligent budget recommendations based on your spending patterns and financial goals.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="future-forecasting">
              <Card>
                <CardHeader>
                  <CardTitle>Future Forecasting</CardTitle>
                  <CardDescription>
                    Predict your future financial situation
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">Coming Soon</h3>
                    <p className="text-muted-foreground max-w-md">
                      We're developing advanced forecasting models to help you predict and plan for your financial future.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="receipt-scanner">
              <ReceiptScanner />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </>
  );
}
