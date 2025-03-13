"use client";

import { Budget, BudgetTracking } from "@/types/financial";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/utils";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowRight, Plus } from "lucide-react";

interface BudgetWidgetProps {
  budgets: Budget[];
  tracking: BudgetTracking[];
}

export default function BudgetWidget({ budgets, tracking }: BudgetWidgetProps) {
  // Calculate total budget and spending
  const totalBudget = tracking.reduce((sum, item) => sum + item.planned_amount, 0);
  const totalSpent = tracking.reduce((sum, item) => sum + item.actual_amount, 0);
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Get top expense categories by spending
  const expenseTracking = tracking.filter(item => item.category?.type === 'expense');
  const sortedExpenses = [...expenseTracking].sort((a, b) => b.actual_amount - a.actual_amount);
  const topExpenses = sortedExpenses.slice(0, 3);
  
  // Get current month name
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium">Budget Overview</CardTitle>
        <CardDescription>
          Your spending for {monthName}
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-2">
        {budgets.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-muted-foreground mb-4">No active budgets</p>
            <Link href="/dashboard/budgets/new">
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-1" /> Create Budget
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex flex-col space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Total Budget</span>
                <span className="text-sm font-medium">{formatCurrency(totalSpent)} / {formatCurrency(totalBudget)}</span>
              </div>
              <Progress value={percentSpent} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{percentSpent.toFixed(0)}% spent</span>
                <span>{formatCurrency(totalBudget - totalSpent)} remaining</span>
              </div>
            </div>
            
            {topExpenses.length > 0 && (
              <div className="space-y-3 mt-4">
                <h4 className="text-sm font-medium">Top Expenses</h4>
                {topExpenses.map((item) => {
                  const percent = item.planned_amount > 0 ? (item.actual_amount / item.planned_amount) * 100 : 0;
                  const isOverBudget = percent > 100;
                  
                  return (
                    <div key={item.id} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">{item.category?.name}</span>
                        <span className="text-xs font-medium">
                          {formatCurrency(item.actual_amount)} / {formatCurrency(item.planned_amount)}
                        </span>
                      </div>
                      <Progress 
                        value={Math.min(percent, 100)} 
                        className={isOverBudget ? 'bg-red-100 h-1.5' : 'h-1.5'}
                      />
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Link href="/dashboard/budgets" className="w-full">
          <Button variant="ghost" size="sm" className="w-full justify-between">
            View All Budgets
            <ArrowRight className="h-4 w-4" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
} 