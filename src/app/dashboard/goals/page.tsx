import DashboardNavbar from "@/components/dashboard-navbar";
import { redirect } from "next/navigation";
import { createClient } from "../../../../supabase/server";
import GoalsList from "@/components/goal-components/goals-list";
import GoalsOverview from "@/components/goal-components/goals-overview";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default async function GoalsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return redirect("/sign-in");
  }

  // Get active goals
  const { data: goals, error } = await supabase
    .from("financial_goals")
    .select(`
      *,
      category:categories(*),
      contributions:goal_contributions(*)
    `)
    .eq("user_id", user.id)
    .eq("is_active", true)
    .order("target_date", { ascending: true });

  if (error) {
    console.error("Error fetching goals:", error);
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8 flex flex-col gap-8">
          {/* Header Section */}
          <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">Financial Goals</h1>
              <p className="text-muted-foreground">
                Set and track your savings goals
              </p>
            </div>
            <div className="flex gap-3">
              <Link href="/dashboard/goals/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Create Goal
                </Button>
              </Link>
            </div>
          </header>

          {/* Goals Overview */}
          <section className="grid grid-cols-1 gap-6">
            <GoalsOverview goals={goals || []} />
          </section>

          {/* Goals List */}
          <section className="grid grid-cols-1 gap-6">
            <GoalsList goals={goals || []} />
          </section>
        </div>
      </main>
    </>
  );
} 