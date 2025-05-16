"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  AlertCircle,
  Edit,
} from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import DashboardWrapper from "../dashboard-wrapper";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { Budget, Category, BudgetCategory, BudgetTracking } from "@/types/financial";
import { Skeleton } from "@/components/ui/skeleton";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { startOfMonth, endOfMonth } from "date-fns";
import { Progress } from "@/components/ui/progress";

// Define a minimal user type for our purposes
interface MinimalUser {
  id: string;
  email?: string;
}

export default function BudgetPage() {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<MinimalUser | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");
  const [refreshKey, setRefreshKey] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });

  // Function to force refresh data
  const refreshData = () => {
    console.log("Forcing data refresh");
    setRefreshKey((prevKey) => prevKey + 1);
  };

  // Fetch categories when component mounts
  useEffect(() => {
    async function fetchCategories() {
      try {
        const { data: categoriesData, error } = await supabase
          .from("categories")
          .select("*")
          .order("name");

        if (error) {
          console.error("Error fetching categories:", error);
          return;
        }

        // Cast the data to Category type
        const typedCategories = (categoriesData || []).map((category) => ({
          id: String(category.id),
          name: String(category.name),
          type: String(category.type),
        })) as Category[];

        setCategories(typedCategories);
      } catch (error) {
        console.error("Error in fetchCategories:", error);
      }
    }

    fetchCategories();
  }, []);

  // Force a refresh when the component mounts or when returning to this page
  useEffect(() => {
    console.log("Budget page mounted or pathname changed");

    // Check if we need to refresh based on localStorage flag
    const needsRefresh = localStorage.getItem("budgetNeedRefresh") === "true";
    if (needsRefresh) {
      console.log("Found budgetNeedRefresh flag, clearing and refreshing");
      localStorage.removeItem("budgetNeedRefresh");
      refreshData();
    }

    // Force a refresh when the component mounts
    refreshData();
  }, [pathname]);

  useEffect(() => {
    async function fetchData() {
      console.log("Fetching budget data, refreshKey:", refreshKey);
      setLoading(true);

      try {
        // Check if user is authenticated
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        let effectiveUser: MinimalUser | null = user
          ? { id: user.id, email: user.email }
          : null;

        // If no user from Supabase, try to get from localStorage
        if (!effectiveUser) {
          console.log("No user from Supabase, checking localStorage");

          // Try to get user ID from localStorage
          const userId = localStorage.getItem("currentUserId");
          const userDataStr = localStorage.getItem("userData");
          let userDataId = null;

          if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData?.user?.id) {
                userDataId = userData.user.id;
              }
            } catch (e) {
              console.error("Error parsing userData:", e);
            }
          }

          if (userId || userDataId) {
            effectiveUser = {
              id: userId || userDataId || "",
              email: "user@example.com",
            };
            console.log("Using user ID from localStorage:", effectiveUser.id);

            try {
              const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
              if (refreshError) {
                console.error("Error refreshing session:", refreshError);
                return null;
              }
              if (session?.user) {
                effectiveUser = { id: session.user.id, email: session.user.email };
              }
            } catch (refreshError) {
              console.error("Exception refreshing session:", refreshError);
              return null;
            }
          } else {
            console.log(
              "No user ID found in localStorage, redirecting to sign-in",
            );
            router.push("/sign-in");
            return;
          }
        }

        setUser(effectiveUser);
        console.log("Set user to:", effectiveUser);

        // Get company settings
        const { data: settingsData, error: settingsError } =
          await supabase
            .from("company_settings")
            .select("*")
            .eq("user_id", effectiveUser.id)
            .single();

        if (settingsError) {
          console.error("Error fetching company settings:", settingsError);
        }

        // Set currency from settings or default to USD
        if (settingsData?.default_currency) {
          setCurrency(settingsData.default_currency as CurrencyCode);
        }

        // Fetch budgets from the database
        console.log("Fetching budgets for user ID:", effectiveUser.id);

        const { data: budgetsData, error } = await supabase
          .from("budgets")
          .select("*, category:category_id(id, name, type, color)")
          .eq("user_id", effectiveUser.id)
          .order("created_at", { ascending: false });

        if (error) {
          console.error("Error fetching budgets:", error);
          return;
        }

        console.log(
          `Fetched ${budgetsData?.length || 0} budgets for user ${effectiveUser.id}:`,
          budgetsData,
        );

        if (budgetsData && budgetsData.length > 0) {
          console.log("Setting budgets state with data:", budgetsData);
          setBudgets(budgetsData as unknown as Budget[]);
        } else {
          console.log("No budgets found, setting empty array");
          setBudgets([]);
        }
      } catch (error) {
        console.error("Error in fetchData:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [refreshKey, router]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency]?.locale || "en-US", {
      style: "currency",
      currency,
      minimumFractionDigits:
        CURRENCY_CONFIG[currency]?.minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  // Filter budgets based on search and category
  const filteredBudgets = budgets.filter((budget) => {
    const matchesSearch = budget.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" ||
      budget.budget_categories?.some(
        (cat: BudgetCategory) => cat.category_id === selectedCategory,
      );

    return matchesSearch && matchesCategory;
  });

  // Calculate total budget and spent amounts
  const totalBudget = filteredBudgets.reduce((sum: number, budget: Budget) => {
    return (
      sum +
      (budget.budget_categories?.reduce(
        (catSum: number, cat: BudgetCategory) => catSum + cat.amount,
        0,
      ) || 0)
    );
  }, 0);

  const totalSpent = filteredBudgets.reduce((sum: number, budget: Budget) => {
    const budgetTracking = budget.budget_tracking || [];
    return (
      sum +
      (budgetTracking.reduce(
        (trackSum: number, track: BudgetTracking) => trackSum + track.spent,
        0,
      ) || 0)
    );
  }, 0);

  const totalRemaining = totalBudget - totalSpent;
  const budgetProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div className="flex justify-between items-center">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-32" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-32" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader>
              <Skeleton className="h-4 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-2" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </DashboardWrapper>
    );
  }

  if (budgets.length === 0) {
    return (
      <DashboardWrapper>
        <div className="flex flex-col items-center justify-center h-[60vh] p-4">
          <div className="text-center max-w-md">
            <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-gray-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">No Budgets Set</h2>
            <p className="text-muted-foreground mb-6">
              Start managing your finances by creating your first budget. Set
              spending limits for different categories and track your progress.
            </p>
            <Link href="/dashboard/budget/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Budget
              </Button>
            </Link>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="space-y-4 p-4 md:p-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Budget</h1>
            <p className="text-muted-foreground">
              Track and manage your spending across categories
            </p>
          </div>
          <Link href="/dashboard/budget/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Budget
            </Button>
          </Link>
        </div>

        {/* Budget Overview */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Total Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(totalBudget)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Spent</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(totalSpent)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Remaining</CardTitle>
            </CardHeader>
            <CardContent>
              <p
                className={`text-2xl font-bold ${
                  totalRemaining >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                {formatCurrency(totalRemaining)}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Overall Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Overall Budget Progress</CardTitle>
            <CardDescription>
              {budgetProgress.toFixed(1)}% of total budget spent
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={budgetProgress} className="h-2" />
          </CardContent>
        </Card>

        {/* Filters */}
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 space-y-2">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search budgets..."
                    className="pl-10"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="w-full md:w-48 space-y-2">
                <label className="text-sm font-medium">Category</label>
                <Select
                  value={selectedCategory}
                  onValueChange={setSelectedCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button variant="outline" size="icon" className="h-10 w-10">
                <Filter className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Budget List */}
        <Card>
          <CardHeader>
            <CardTitle>Budget Categories</CardTitle>
            <CardDescription>
              {filteredBudgets.length} budgets found
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {filteredBudgets.map((budget) => {
                const budgetAmount =
                  budget.budget_categories?.reduce(
                    (sum: number, cat: BudgetCategory) => sum + cat.amount,
                    0,
                  ) || 0;
                const budgetTracking = budget.budget_tracking || [];
                const spentAmount =
                  budgetTracking.reduce(
                    (sum: number, track: BudgetTracking) => sum + track.spent,
                    0,
                  ) || 0;
                const progress = budgetAmount > 0 ? spentAmount / budgetAmount : 0;
                const isOverBudget = progress > 1;

                return (
                  <div
                    key={budget.id}
                    className="flex flex-col gap-2 p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-full ${
                            isOverBudget
                              ? "bg-red-100 text-red-600"
                              : "bg-green-100 text-green-600"
                          }`}
                        >
                          <ChevronDown className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-medium">{budget.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {budget.description || "No description"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="font-semibold">
                            {formatCurrency(spentAmount)} /{" "}
                            {formatCurrency(budgetAmount)}
                          </p>
                          <p
                            className={`text-sm ${
                              isOverBudget ? "text-red-600" : "text-green-600"
                            }`}
                          >
                            {isOverBudget
                              ? "Over Budget"
                              : `${(progress * 100).toFixed(1)}% Used`}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            router.push(`/dashboard/budget/edit/${budget.id}`)
                          }
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={Math.min(progress * 100, 100)}
                      className="h-2"
                    />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
