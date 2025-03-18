"use client";

import { Budget, BudgetTracking } from "@/types/financial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";
import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface BudgetOverviewProps {
  budgets: Budget[];
  tracking: BudgetTracking[];
  currency: CurrencyCode;
}

export default function BudgetOverview({ budgets, tracking, currency }: BudgetOverviewProps) {
  const [activeTab, setActiveTab] = useState("overview");

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency].minimumFractionDigits ?? 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Calculate total budget and spending
  const totalBudget = tracking.reduce((sum, item) => sum + item.planned_amount, 0);
  const totalSpent = tracking.reduce((sum, item) => sum + item.actual_amount, 0);
  const percentSpent = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;
  
  // Group tracking by category type
  const expenseTracking = tracking.filter(item => item.category?.type === 'expense');
  const incomeTracking = tracking.filter(item => item.category?.type === 'income');
  
  // Calculate totals by type
  const totalExpenseBudget = expenseTracking.reduce((sum, item) => sum + item.planned_amount, 0);
  const totalExpenseSpent = expenseTracking.reduce((sum, item) => sum + item.actual_amount, 0);
  const percentExpenseSpent = totalExpenseBudget > 0 ? (totalExpenseSpent / totalExpenseBudget) * 100 : 0;
  
  const totalIncomeBudget = incomeTracking.reduce((sum, item) => sum + item.planned_amount, 0);
  const totalIncomeReceived = incomeTracking.reduce((sum, item) => sum + item.actual_amount, 0);
  const percentIncomeReceived = totalIncomeBudget > 0 ? (totalIncomeReceived / totalIncomeBudget) * 100 : 0;

  // Get current month name
  const currentDate = new Date();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview - {monthName}</CardTitle>
        <CardDescription>
          Track your spending against your budget
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
            <TabsTrigger value="income">Income</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview">
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
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Expenses</h3>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Spent</span>
                    <span className="text-xs font-medium">{formatCurrency(totalExpenseSpent)} / {formatCurrency(totalExpenseBudget)}</span>
                  </div>
                  <Progress value={percentExpenseSpent} className="h-1.5" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium">Income</h3>
                  <div className="flex justify-between">
                    <span className="text-xs text-muted-foreground">Received</span>
                    <span className="text-xs font-medium">{formatCurrency(totalIncomeReceived)} / {formatCurrency(totalIncomeBudget)}</span>
                  </div>
                  <Progress value={percentIncomeReceived} className="h-1.5" />
                </div>
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="expenses">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Expenses</span>
                  <span className="text-sm font-medium">{formatCurrency(totalExpenseSpent)} / {formatCurrency(totalExpenseBudget)}</span>
                </div>
                <Progress value={percentExpenseSpent} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentExpenseSpent.toFixed(0)}% spent</span>
                  <span>{formatCurrency(totalExpenseBudget - totalExpenseSpent)} remaining</span>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-medium">By Category</h3>
                {expenseTracking.map((item) => {
                  const percent = item.planned_amount > 0 ? (item.actual_amount / item.planned_amount) * 100 : 0;
                  const isOverBudget = percent > 100;
                  
                  return (
                    <div key={item.id} className="space-y-2">
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
                      {isOverBudget && (
                        <div className="text-xs text-red-500">
                          Over budget by {formatCurrency(item.actual_amount - item.planned_amount)}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
          
          <TabsContent value="income">
            <div className="space-y-4">
              <div className="flex flex-col space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">Total Income</span>
                  <span className="text-sm font-medium">{formatCurrency(totalIncomeReceived)} / {formatCurrency(totalIncomeBudget)}</span>
                </div>
                <Progress value={percentIncomeReceived} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{percentIncomeReceived.toFixed(0)}% received</span>
                  <span>{formatCurrency(totalIncomeBudget - totalIncomeReceived)} pending</span>
                </div>
              </div>
              
              <div className="space-y-4 mt-4">
                <h3 className="text-sm font-medium">By Category</h3>
                {incomeTracking.map((item) => {
                  const percent = item.planned_amount > 0 ? (item.actual_amount / item.planned_amount) * 100 : 0;
                  
                  return (
                    <div key={item.id} className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs font-medium">{item.category?.name}</span>
                        <span className="text-xs font-medium">
                          {formatCurrency(item.actual_amount)} / {formatCurrency(item.planned_amount)}
                        </span>
                      </div>
                      <Progress value={percent} className="h-1.5" />
                    </div>
                  );
                })}
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 