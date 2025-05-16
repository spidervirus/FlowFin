"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Category, FinancialGoal, GoalContribution } from "@/types/financial";
import { useRouter } from "next/navigation";
import { ArrowLeft, PiggyBank, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/utils/utils";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface GoalPageProps {
  params: {
    id: string;
  };
}

export default function GoalPage({ params }: GoalPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<FinancialGoal | null>(null);
  const [contributions, setContributions] = useState<GoalContribution[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState("details");

  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [targetDate, setTargetDate] = useState<Date | undefined>(new Date());
  const [categoryId, setCategoryId] = useState<string>("");
  const [isActive, setIsActive] = useState(true);
  const [icon, setIcon] = useState<string>("");
  const [color, setColor] = useState<string>("#3b82f6");

  // Fetch goal, contributions, and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch goal
        const goalResponse = await fetch(`/api/goals?id=${params.id}`);
        if (!goalResponse.ok) {
          throw new Error("Failed to fetch goal");
        }
        const goalData = await goalResponse.json();
        if (Array.isArray(goalData) && goalData.length > 0) {
          setGoal(goalData[0]);
          initializeFormState(goalData[0]);
        } else {
          setGoal(goalData);
          initializeFormState(goalData);
        }

        // Fetch contributions
        const contributionsResponse = await fetch(
          `/api/goals/contributions?goal_id=${params.id}`,
        );
        if (!contributionsResponse.ok) {
          throw new Error("Failed to fetch contributions");
        }
        const contributionsData = await contributionsResponse.json();
        setContributions(contributionsData);

        // Fetch categories
        const categoriesResponse = await fetch("/api/categories?active=true");
        if (!categoriesResponse.ok) {
          throw new Error("Failed to fetch categories");
        }
        const categoriesData = await categoriesResponse.json();
        setCategories(categoriesData);
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to load data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  const initializeFormState = (goalData: FinancialGoal) => {
    setName(goalData.name);
    setDescription(goalData.description || "");
    setTargetAmount(goalData.target_amount.toString());
    setStartDate(new Date(goalData.start_date));
    setTargetDate(new Date(goalData.target_date));
    setCategoryId(goalData.category?.id || "none");
    setIsActive(goalData.is_active);
    setIcon(goalData.icon || "none");
    setColor(goalData.color || "#3b82f6");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form
    if (!name) {
      setError("Goal name is required");
      return;
    }

    if (
      !targetAmount ||
      isNaN(parseFloat(targetAmount)) ||
      parseFloat(targetAmount) <= 0
    ) {
      setError("Target amount must be a positive number");
      return;
    }

    if (!startDate || !targetDate) {
      setError("Start and target dates are required");
      return;
    }

    if (targetDate <= startDate) {
      setError("Target date must be after start date");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch(`/api/goals?id=${params.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          description,
          target_amount: parseFloat(targetAmount),
          start_date: startDate.toISOString().split("T")[0],
          target_date: targetDate.toISOString().split("T")[0],
          category_id: categoryId === "none" ? null : categoryId || null,
          is_active: isActive,
          icon: icon === "none" ? null : icon,
          color,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update goal");
      }

      const updatedGoal = await response.json();
      setGoal(updatedGoal);
      setIsEditing(false);
      router.refresh();
    } catch (error) {
      console.error("Error updating goal:", error);
      setError(
        error instanceof Error ? error.message : "Failed to update goal",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteGoal = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/goals?id=${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      // Redirect to goals page
      router.push("/dashboard/goals");
      router.refresh();
    } catch (error) {
      console.error("Error deleting goal:", error);
      setError(
        error instanceof Error ? error.message : "Failed to delete goal",
      );
      setIsDeleting(false);
    }
  };

  const handleDeleteContribution = async (contributionId: string) => {
    try {
      const response = await fetch(
        `/api/goals/contributions?id=${contributionId}`,
        {
          method: "DELETE",
        },
      );

      if (!response.ok) {
        throw new Error("Failed to delete contribution");
      }

      // Update contributions list
      setContributions(contributions.filter((c) => c.id !== contributionId));

      // Update goal with new current_amount
      const { goal: updatedGoal } = await response.json();
      if (updatedGoal) {
        setGoal(updatedGoal);
      }

      router.refresh();
    } catch (error) {
      console.error("Error deleting contribution:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Failed to delete contribution",
      );
    }
  };

  // Calculate progress percentage
  const calculateProgress = () => {
    if (!goal) return 0;
    return goal.target_amount > 0
      ? (goal.current_amount / goal.target_amount) * 100
      : 0;
  };

  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Predefined colors for selection
  const colorOptions = [
    { name: "Blue", value: "#3b82f6" },
    { name: "Green", value: "#10b981" },
    { name: "Red", value: "#ef4444" },
    { name: "Purple", value: "#8b5cf6" },
    { name: "Yellow", value: "#f59e0b" },
    { name: "Pink", value: "#ec4899" },
    { name: "Indigo", value: "#6366f1" },
  ];

  // Predefined icons for selection (using emoji as placeholders)
  const iconOptions = [
    { name: "Home", value: "🏠" },
    { name: "Car", value: "🚗" },
    { name: "Education", value: "🎓" },
    { name: "Vacation", value: "✈️" },
    { name: "Retirement", value: "👴" },
    { name: "Emergency", value: "🚨" },
    { name: "Wedding", value: "💍" },
    { name: "Baby", value: "👶" },
    { name: "Business", value: "💼" },
    { name: "Other", value: "🎯" },
  ];

  if (isLoading) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p>Loading...</p>
            </div>
          </div>
        </main>
      </>
    );
  }

  if (!goal) {
    return (
      <>
        <DashboardNavbar />
        <main className="w-full bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 py-8">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">Goal not found</p>
              <Link href="/dashboard/goals">
                <Button>Back to Goals</Button>
              </Link>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link
              href="/dashboard/goals"
              className="flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Goals
            </Link>
          </div>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
            <div className="flex items-center gap-3">
              {goal.icon && <span className="text-2xl">{goal.icon}</span>}
              <div>
                <h1 className="text-3xl font-bold">{goal.name}</h1>
                <div className="flex items-center gap-2 mt-1">
                  {goal.is_completed && (
                    <Badge variant="success">Completed</Badge>
                  )}
                  {!goal.is_active && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {goal.category && (
                    <Badge variant="outline">{goal.category.name}</Badge>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Link href={`/dashboard/goals/${params.id}/contribute`}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Add Contribution
                </Button>
              </Link>
              {!isEditing && (
                <Button variant="outline" onClick={() => setIsEditing(true)}>
                  Edit Goal
                </Button>
              )}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="text-red-500 hover:text-red-700"
                  >
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently delete this goal and all associated
                      contributions. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDeleteGoal}
                      disabled={isDeleting}
                      className="bg-red-500 hover:bg-red-600"
                    >
                      {isDeleting ? "Deleting..." : "Delete"}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader className="pb-2">
                  <Tabs
                    defaultValue="details"
                    value={activeTab}
                    onValueChange={setActiveTab}
                  >
                    <TabsList>
                      <TabsTrigger value="details">Details</TabsTrigger>
                      <TabsTrigger value="contributions">
                        Contributions
                      </TabsTrigger>
                    </TabsList>
                  </Tabs>
                </CardHeader>
                <CardContent>
                  <TabsContent value="details" className="mt-0">
                    {isEditing ? (
                      <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                            {error}
                          </div>
                        )}

                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="name">Goal Name</Label>
                            <Input
                              id="name"
                              value={name}
                              onChange={(e) => setName(e.target.value)}
                              placeholder="e.g., New Car, Emergency Fund, Vacation"
                            />
                          </div>

                          <div>
                            <Label htmlFor="description">
                              Description (Optional)
                            </Label>
                            <Textarea
                              id="description"
                              value={description}
                              onChange={(e) => setDescription(e.target.value)}
                              placeholder="Add details about this goal"
                              rows={3}
                            />
                          </div>

                          <div>
                            <Label htmlFor="target-amount">Target Amount</Label>
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                                $
                              </span>
                              <Input
                                id="target-amount"
                                type="number"
                                min="0.01"
                                step="0.01"
                                value={targetAmount}
                                onChange={(e) =>
                                  setTargetAmount(e.target.value)
                                }
                                placeholder="0.00"
                                className="pl-8"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="start-date">Start Date</Label>
                              <DatePicker
                                id="start-date"
                                date={startDate}
                                onSelect={setStartDate}
                              />
                            </div>

                            <div>
                              <Label htmlFor="target-date">Target Date</Label>
                              <DatePicker
                                id="target-date"
                                date={targetDate}
                                onSelect={setTargetDate}
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="category">
                              Category (Optional)
                            </Label>
                            <Select
                              value={categoryId}
                              onValueChange={setCategoryId}
                            >
                              <SelectTrigger id="category">
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">None</SelectItem>
                                {categories
                                  .filter((cat) => cat.type === "expense")
                                  .map((category) => (
                                    <SelectItem
                                      key={category.id}
                                      value={category.id}
                                    >
                                      {category.name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="icon">Icon (Optional)</Label>
                              <Select value={icon} onValueChange={setIcon}>
                                <SelectTrigger id="icon">
                                  <SelectValue placeholder="Select an icon" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="none">None</SelectItem>
                                  {iconOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      {option.value} {option.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div>
                              <Label htmlFor="color">Color (Optional)</Label>
                              <Select value={color} onValueChange={setColor}>
                                <SelectTrigger id="color">
                                  <SelectValue placeholder="Select a color" />
                                </SelectTrigger>
                                <SelectContent>
                                  {colorOptions.map((option) => (
                                    <SelectItem
                                      key={option.value}
                                      value={option.value}
                                    >
                                      <div className="flex items-center">
                                        <div
                                          className="w-4 h-4 rounded-full mr-2"
                                          style={{
                                            backgroundColor: option.value,
                                          }}
                                        />
                                        {option.name}
                                      </div>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <Switch
                              id="is-active"
                              checked={isActive}
                              onCheckedChange={setIsActive}
                            />
                            <Label htmlFor="is-active">Active</Label>
                          </div>
                        </div>

                        <div className="flex justify-end gap-3">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => {
                              setIsEditing(false);
                              initializeFormState(goal);
                              setError(null);
                            }}
                          >
                            Cancel
                          </Button>
                          <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                          </Button>
                        </div>
                      </form>
                    ) : (
                      <div className="space-y-6">
                        <div className="space-y-4">
                          {goal.description && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Description
                              </h3>
                              <p>{goal.description}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Target Amount
                              </h3>
                              <p className="text-xl font-semibold">
                                {formatCurrency(goal.target_amount)}
                              </p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Current Amount
                              </h3>
                              <p className="text-xl font-semibold">
                                {formatCurrency(goal.current_amount)}
                              </p>
                            </div>
                          </div>

                          <div className="space-y-1">
                            <div className="flex justify-between">
                              <span className="text-sm">Progress</span>
                              <span className="text-sm font-medium">
                                {calculateProgress().toFixed(0)}%
                              </span>
                            </div>
                            <Progress
                              value={calculateProgress()}
                              className="h-2"
                            />
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Start Date
                              </h3>
                              <p>{formatDate(goal.start_date)}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Target Date
                              </h3>
                              <p>{formatDate(goal.target_date)}</p>
                            </div>
                          </div>

                          {goal.category && (
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Category
                              </h3>
                              <p>{goal.category.name}</p>
                            </div>
                          )}

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Created
                              </h3>
                              <p>{formatDate(goal.created_at)}</p>
                            </div>

                            <div>
                              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                                Last Updated
                              </h3>
                              <p>{formatDate(goal.updated_at)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="contributions" className="mt-0">
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h3 className="text-lg font-medium">Contributions</h3>
                        <Link href={`/dashboard/goals/${params.id}/contribute`}>
                          <Button size="sm">
                            <Plus className="h-4 w-4 mr-1" /> Add
                          </Button>
                        </Link>
                      </div>

                      {contributions.length === 0 ? (
                        <div className="text-center py-8">
                          <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                          <p className="text-muted-foreground mb-4">
                            No contributions yet
                          </p>
                          <Link
                            href={`/dashboard/goals/${params.id}/contribute`}
                          >
                            <Button>
                              <Plus className="mr-2 h-4 w-4" /> Add Your First
                              Contribution
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="border rounded-md divide-y">
                          {contributions.map((contribution) => (
                            <div
                              key={contribution.id}
                              className="p-4 flex justify-between items-center"
                            >
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {formatCurrency(contribution.amount)}
                                  </span>
                                  <span className="text-sm text-muted-foreground">
                                    on {formatDate(contribution.date)}
                                  </span>
                                </div>
                                {contribution.notes && (
                                  <p className="text-sm text-muted-foreground mt-1">
                                    {contribution.notes}
                                  </p>
                                )}
                                {contribution.transaction && (
                                  <div className="text-xs text-muted-foreground mt-1">
                                    Linked to transaction:{" "}
                                    {contribution.transaction.description}
                                  </div>
                                )}
                              </div>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-500 hover:text-red-700"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>
                                      Delete Contribution
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete this
                                      contribution of{" "}
                                      {formatCurrency(contribution.amount)}?
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleDeleteContribution(
                                          contribution.id,
                                        )
                                      }
                                      className="bg-red-500 hover:bg-red-600"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </TabsContent>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card>
                <CardHeader>
                  <CardTitle>Goal Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Progress</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(goal.current_amount)} of{" "}
                          {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      <Progress value={calculateProgress()} className="h-2" />
                      <p className="text-xs text-right text-muted-foreground">
                        {calculateProgress().toFixed(0)}% complete
                      </p>
                    </div>

                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Amount Remaining</span>
                        <span className="font-medium">
                          {formatCurrency(
                            goal.target_amount - goal.current_amount,
                          )}
                        </span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Total Contributions</span>
                        <span>{contributions.length}</span>
                      </div>

                      <div className="flex justify-between text-sm">
                        <span>Status</span>
                        <span>
                          {goal.is_completed ? "Completed" : "In Progress"}
                        </span>
                      </div>

                      {!goal.is_completed && (
                        <div className="flex justify-between text-sm">
                          <span>Target Date</span>
                          <span>{formatDate(goal.target_date)}</span>
                        </div>
                      )}
                    </div>

                    {!goal.is_completed && (
                      <div className="pt-4">
                        <Link
                          href={`/dashboard/goals/${params.id}/contribute`}
                          className="w-full"
                        >
                          <Button className="w-full">
                            <Plus className="mr-2 h-4 w-4" /> Add Contribution
                          </Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
