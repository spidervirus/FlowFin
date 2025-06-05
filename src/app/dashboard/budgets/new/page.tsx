"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Category } from "@/types/financial";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency, CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import DashboardWrapper from "@/app/dashboard/dashboard-wrapper";
import { createClient } from "@/lib/supabase/client";
import { Database } from "@/types/supabase";

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"];

interface BudgetCategory {
  id: string;
  amount: number;
}

export default function NewBudgetPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<
    "monthly" | "quarterly" | "yearly"
  >("monthly");
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>(
    [],
  );
  const [expenseCategories, setExpenseCategories] = useState<Category[]>([]);
  const [currency, setCurrency] = useState<CurrencyCode>("USD");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const supabase = createClient();

        // Get company settings
        const { data: settings } = await supabase
          .from("company_settings")
          .select("*")
          .single();

        // Set currency from company settings
        if (settings?.default_currency) {
          setCurrency(settings.default_currency as CurrencyCode);
        }

        // Fetch expense categories
        const { data: categories, error: categoriesError } = await supabase
          .from("categories")
          .select("*")
          .eq("type", "expense")
          .order("name");

        if (categoriesError) {
          throw categoriesError;
        }

        // Map the categories data to match the Category interface
        const typedCategories = ((categories || []) as any[]).map(
          (cat: any) => ({
            id: cat.id,
            name: cat.name,
            type: cat.type as "income" | "expense",
            color: cat.color,
            user_id: cat.user_id,
            created_at: cat.created_at,
            updated_at: cat.updated_at,
            parent_id: cat.parent_id,
            is_active: cat.is_active,
            is_default: cat.is_default
          }),
        ).filter((cat: any) => cat.type === "expense" || cat.type === "income");

        setExpenseCategories(typedCategories);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load categories");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleAddCategory = () => {
    setBudgetCategories([...budgetCategories, { id: "", amount: 0 }]);
  };

  const handleRemoveCategory = (index: number) => {
    setBudgetCategories(budgetCategories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index: number, categoryId: string) => {
    const newCategories = [...budgetCategories];
    newCategories[index] = { ...newCategories[index], id: categoryId };
    setBudgetCategories(newCategories);
  };

  const handleAmountChange = (index: number, amount: string) => {
    const newCategories = [...budgetCategories];
    newCategories[index] = {
      ...newCategories[index],
      amount: parseFloat(amount) || 0,
    };
    setBudgetCategories(newCategories);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits:
        CURRENCY_CONFIG[currency].minimumFractionDigits ?? 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setError("Budget name is required");
      return;
    }

    if (budgetCategories.length === 0) {
      setError("At least one category is required");
      return;
    }

    if (budgetCategories.some((cat) => !cat.id)) {
      setError("Please select a category for each budget item");
      return;
    }

    if (budgetCategories.some((cat) => cat.amount <= 0)) {
      setError("Amount must be greater than zero for all categories");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          start_date: startDate.toISOString().split("T")[0],
          end_date: endDate.toISOString().split("T")[0],
          is_recurring: isRecurring,
          recurrence_period: isRecurring ? recurrencePeriod : null,
          categories: budgetCategories.map((cat) => ({
            id: cat.id,
            amount: cat.amount,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to create budget");
      }

      router.push("/dashboard/budgets");
    } catch (error) {
      console.error("Error creating budget:", error);
      setError(
        error instanceof Error ? error.message : "Failed to create budget",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardWrapper needsSetup={false}>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Loading...</p>
          </div>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper needsSetup={false}>
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Create New Budget</h1>
          <p className="text-muted-foreground mt-2">
            Set up a new budget to track your spending
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Budget Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Monthly Operating Budget"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of this budget"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={startDate.toISOString().split("T")[0]}
                  onChange={(e) => setStartDate(new Date(e.target.value))}
                />
              </div>

              <div>
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={endDate.toISOString().split("T")[0]}
                  onChange={(e) => setEndDate(new Date(e.target.value))}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="isRecurring"
                checked={isRecurring}
                onCheckedChange={setIsRecurring}
              />
              <Label htmlFor="isRecurring">Recurring Budget</Label>
            </div>

            {isRecurring && (
              <div>
                <Label htmlFor="recurrencePeriod">Recurrence Period</Label>
                <Select
                  value={recurrencePeriod}
                  onValueChange={(value: "monthly" | "quarterly" | "yearly") =>
                    setRecurrencePeriod(value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select period" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">Monthly</SelectItem>
                    <SelectItem value="quarterly">Quarterly</SelectItem>
                    <SelectItem value="yearly">Yearly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Budget Categories</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddCategory}
              >
                <Plus className="mr-2 h-4 w-4" /> Add Category
              </Button>
            </div>

            {budgetCategories.map((category, index) => (
              <div
                key={index}
                className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start"
              >
                <div>
                  <Label>Category</Label>
                  <Select
                    value={category.id}
                    onValueChange={(value) =>
                      handleCategoryChange(index, value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {expenseCategories.map((cat) => (
                        <SelectItem key={cat.id} value={cat.id}>
                          {cat.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <div className="flex-1">
                    <Label>Amount</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={category.amount}
                      onChange={(e) =>
                        handleAmountChange(index, e.target.value)
                      }
                      placeholder="0.00"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    className="mt-6"
                    onClick={() => handleRemoveCategory(index)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {budgetCategories.length > 0 && (
              <div className="mt-4 p-4 bg-gray-50 rounded-md">
                <div className="flex justify-between items-center">
                  <span className="font-medium">Total Budget</span>
                  <span className="font-medium">
                    {formatCurrency(
                      budgetCategories.reduce(
                        (sum, cat) => sum + cat.amount,
                        0,
                      ),
                    )}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/budgets")}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create Budget"}
            </Button>
          </div>
        </form>
      </div>
    </DashboardWrapper>
  );
}
