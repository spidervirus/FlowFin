"use client";

import { FinancialGoal } from "@/types/financial";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus, Target } from "lucide-react";

interface GoalsWidgetProps {
  goals: FinancialGoal[];
}

export default function GoalsWidget({ goals }: GoalsWidgetProps) {
  // Sort goals by progress (lowest to highest)
  const sortedGoals = [...goals]
    .filter(goal => !goal.is_completed)
    .sort((a, b) => {
      const progressA = a.target_amount > 0 ? (a.current_amount / a.target_amount) : 0;
      const progressB = b.target_amount > 0 ? (b.current_amount / b.target_amount) : 0;
      return progressA - progressB;
    });
  
  // Get top 3 goals that need attention
  const topGoals = sortedGoals.slice(0, 3);
  
  // Calculate days remaining for a goal
  const getDaysRemaining = (targetDate: string) => {
    const today = new Date();
    const target = new Date(targetDate);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Savings Goals</CardTitle>
        <CardDescription>
          Track your progress towards financial goals
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {goals.length === 0 ? (
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No active goals</p>
            <Link href="/dashboard/goals/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Goal
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {topGoals.map((goal) => {
              const percentage = goal.target_amount > 0 
                ? (goal.current_amount / goal.target_amount) * 100 
                : 0;
              const daysRemaining = getDaysRemaining(goal.target_date);
              
              return (
                <div key={goal.id} className="space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-sm font-medium">{goal.name}</h3>
                      <p className="text-xs text-muted-foreground">
                        Target: {formatCurrency(goal.target_amount)} • {daysRemaining} days left
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium">
                        {formatCurrency(goal.current_amount)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {percentage.toFixed(0)}%
                      </p>
                    </div>
                  </div>
                  <Progress value={percentage} className="h-1.5" />
                </div>
              );
            })}
            
            {goals.length > 3 && (
              <p className="text-xs text-center text-muted-foreground mt-2">
                Showing {topGoals.length} of {goals.length} goals
              </p>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/dashboard/goals" className="w-full">
          <Button variant="ghost" size="sm" className="w-full justify-between">
            View All Goals
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 