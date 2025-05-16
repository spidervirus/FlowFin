"use client";

import { FinancialGoal } from "@/types/financial";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Plus, Trash2, PiggyBank } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
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
import { Progress } from "@/components/ui/progress";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface GoalsListProps {
  goals: FinancialGoal[];
  currency: CurrencyCode;
}

export default function GoalsList({ goals = [], currency }: GoalsListProps) {
  const router = useRouter();
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits:
        CURRENCY_CONFIG[currency].minimumFractionDigits ?? 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoalId) return;

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/goals?id=${deletingGoalId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete goal");
      }

      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error("Error deleting goal:", error);
    } finally {
      setIsDeleting(false);
      setDeletingGoalId(null);
    }
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

  // Calculate days remaining for a goal
  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Goals</CardTitle>
        <CardDescription>
          Manage your financial goals and track your progress
        </CardDescription>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-8">
            <PiggyBank className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              You don&apos;t have any active goals
            </p>
            <Link href="/dashboard/goals/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" /> Create Your First Goal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((goal) => {
              const percentage =
                goal.target_amount > 0
                  ? (goal.current_amount / goal.target_amount) * 100
                  : 0;
              const daysRemaining = getDaysRemaining(goal.target_date);

              return (
                <div
                  key={goal.id}
                  className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2 mb-4 md:mb-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{goal.name}</h3>
                      {goal.is_completed && (
                        <Badge variant="success">Completed</Badge>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 text-sm text-muted-foreground">
                      <span>Target: {formatCurrency(goal.target_amount)}</span>
                      <span className="hidden sm:inline">•</span>
                      <span>
                        {formatDate(goal.start_date)} -{" "}
                        {formatDate(goal.target_date)}
                      </span>
                      {goal.category && (
                        <>
                          <span className="hidden sm:inline">•</span>
                          <span>Category: {goal.category.name}</span>
                        </>
                      )}
                    </div>

                    {goal.description && (
                      <p className="text-sm">{goal.description}</p>
                    )}

                    <div className="flex flex-col space-y-1 mt-2">
                      <div className="flex justify-between text-xs">
                        <span>Progress</span>
                        <span>
                          {formatCurrency(goal.current_amount)} of{" "}
                          {formatCurrency(goal.target_amount)} (
                          {percentage.toFixed(0)}%)
                        </span>
                      </div>
                      <Progress value={percentage} className="h-2" />

                      {!goal.is_completed && (
                        <div className="flex justify-between text-xs text-muted-foreground mt-1">
                          <span>{daysRemaining} days remaining</span>
                          <span>
                            {formatCurrency(
                              goal.target_amount - goal.current_amount,
                            )}{" "}
                            to go
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Link href={`/dashboard/goals/${goal.id}`}>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" /> Edit
                      </Button>
                    </Link>
                    <Link href={`/dashboard/goals/${goal.id}/contribute`}>
                      <Button variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-1" /> Contribute
                      </Button>
                    </Link>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setDeletingGoalId(goal.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" /> Delete
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will permanently delete this goal and all
                            associated contributions. This action cannot be
                            undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel
                            onClick={() => setDeletingGoalId(null)}
                          >
                            Cancel
                          </AlertDialogCancel>
                          <AlertDialogAction
                            onClick={handleDeleteGoal}
                            disabled={isDeleting}
                          >
                            {isDeleting ? "Deleting..." : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
