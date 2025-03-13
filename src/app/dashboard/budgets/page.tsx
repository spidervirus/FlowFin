import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import BudgetList from "@/components/budget-components/budget-list";
import BudgetOverview from "@/components/budget-components/budget-overview";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function BudgetsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get current month for filtering
  const currentDate = new Date();
  const currentMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).toISOString().split("T")[0];

  // Get active budgets for current month
  const { data: budgets, error } = await supabase
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
    .lte("start_date", currentDate)
    .gte("end_date", currentDate)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching budgets:", error);
  }

  // Get budget tracking data for current month
  let tracking = [];
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
    } else {
      tracking = trackingData;
      
      // Add tracking data to each budget
      budgets.forEach((budget) => {
        budget.tracking = tracking.filter(
          (item) => item.budget_id === budget.id
        );
      });
    }
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Budget Management</h1>
              <p className="text-muted-foreground">
                Create and manage your budgets to track spending
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/budgets/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Budget
                </Button>
              </Link>
            </div>
          </header>

          {/* Budget Overview */}
          <section className="grid grid-cols-1 gap-6">
            <BudgetOverview budgets={budgets || []} tracking={tracking || []} />
          </section>

          {/* Budget List */}
          <section className="grid grid-cols-1 gap-6">
            <BudgetList budgets={budgets || []} />
          </section>
        </div>
      </main>
    </>
  );
} 