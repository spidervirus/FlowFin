import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Brain, Sparkles } from "lucide-react";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import AIDataEntry from "@/components/ai-features/ai-data-entry";
import PredictiveAnalytics from "@/components/ai-features/predictive-analytics";
import SmartCategorization from "@/components/ai-features/smart-categorization";

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
              <h1 className="text-3xl font-bold">AI-Powered Features</h1>
              <p className="text-muted-foreground">
                Leverage artificial intelligence to streamline your accounting
                workflow
              </p>
            </div>
            <Button className="gap-2">
              <Sparkles className="h-4 w-4" />
              Upgrade to Pro
            </Button>
          </header>

          {/* AI Features Overview */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-100 rounded-xl p-6">
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <div className="h-16 w-16 rounded-full bg-purple-100 flex items-center justify-center">
                <Brain className="h-8 w-8 text-purple-600" />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-xl font-bold text-purple-900 mb-2">
                  AI-Powered Accounting Assistant
                </h2>
                <p className="text-purple-800 max-w-3xl">
                  Our AI features help you save time, reduce errors, and gain
                  deeper insights into your financial data. From automated data
                  entry to predictive analytics and smart categorization, our AI
                  tools are designed to make accounting easier and more
                  efficient.
                </p>
              </div>
            </div>
          </div>

          {/* AI Data Entry */}
          <section className="space-y-2">
            <h2 className="text-2xl font-bold">Automated Data Entry</h2>
            <p className="text-muted-foreground mb-4">
              Extract transaction data automatically from receipts, invoices,
              and bank statements
            </p>
            <AIDataEntry />
          </section>

          {/* Predictive Analytics */}
          <section className="space-y-2">
            <h2 className="text-2xl font-bold">Predictive Analytics</h2>
            <p className="text-muted-foreground mb-4">
              Forecast future financial trends and detect anomalies in your
              transactions
            </p>
            <PredictiveAnalytics />
          </section>

          {/* Smart Categorization */}
          <section className="space-y-2">
            <h2 className="text-2xl font-bold">Smart Categorization</h2>
            <p className="text-muted-foreground mb-4">
              Automatically categorize transactions with machine learning that
              improves over time
            </p>
            <SmartCategorization />
          </section>

          {/* AI Benefits */}
          <section className="mt-8">
            <h2 className="text-2xl font-bold mb-6">
              Benefits of AI-Powered Accounting
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Save Time",
                  description:
                    "Reduce manual data entry by up to 80% with automated extraction and categorization",
                  icon: "⏱️",
                },
                {
                  title: "Reduce Errors",
                  description:
                    "AI validation helps catch mistakes and inconsistencies before they impact your books",
                  icon: "✓",
                },
                {
                  title: "Better Insights",
                  description:
                    "Predictive analytics help you anticipate cash flow needs and identify spending patterns",
                  icon: "📊",
                },
                {
                  title: "Simplified Tax Prep",
                  description:
                    "Smart categorization ensures transactions are properly classified for tax purposes",
                  icon: "📝",
                },
                {
                  title: "Continuous Learning",
                  description:
                    "Our AI improves over time as it learns from your corrections and preferences",
                  icon: "🧠",
                },
                {
                  title: "Seamless Integration",
                  description:
                    "Works with your existing accounting workflow without disrupting your processes",
                  icon: "🔄",
                },
              ].map((benefit, index) => (
                <div
                  key={index}
                  className="bg-white rounded-xl border p-6 hover:shadow-md transition-shadow"
                >
                  <div className="text-3xl mb-4">{benefit.icon}</div>
                  <h3 className="text-lg font-bold mb-2">{benefit.title}</h3>
                  <p className="text-muted-foreground">{benefit.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
