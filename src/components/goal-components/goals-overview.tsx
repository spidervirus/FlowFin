"use client";

import { FinancialGoal } from "@/types/financial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrency } from "@/utils/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { CalendarClock, CheckCircle, Clock, Target } from "lucide-react";

interface GoalsOverviewProps {
  goals: FinancialGoal[];
}

export default function GoalsOverview({ goals }: GoalsOverviewProps) {
  const [activeTab, setActiveTab] = useState("all");
  
  // Filter goals based on active tab
  const filteredGoals = goals.filter(goal => {
    if (activeTab === "all") return true;
    if (activeTab === "completed") return goal.is_completed;
    if (activeTab === "in-progress") return !goal.is_completed && goal.current_amount > 0;
    if (activeTab === "not-started") return goal.current_amount === 0;
    return true;
  });
  
  // Calculate total stats
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.target_amount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.current_amount, 0);
  const totalPercentage = totalTargetAmount > 0 ? (totalCurrentAmount / totalTargetAmount) * 100 : 0;
  
  // Count goals by status
  const completedGoals = goals.filter(goal => goal.is_completed).length;
  const inProgressGoals = goals.filter(goal => !goal.is_completed && goal.current_amount > 0).length;
  const notStartedGoals = goals.filter(goal => goal.current_amount === 0).length;
  
  // Get upcoming goals (closest target date that's not completed)
  const upcomingGoals = goals
    .filter(goal => !goal.is_completed)
    .sort((a, b) => new Date(a.target_date).getTime() - new Date(b.target_date).getTime())
    .slice(0, 3);
  
  // Format date to readable format
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
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
        <CardTitle>Goals Overview</CardTitle>
        <CardDescription>
          Track your progress towards financial goals
        </CardDescription>
      </CardHeader>
      <CardContent>
        {goals.length === 0 ? (
          <div className="text-center py-6">
            <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-2">You don't have any active goals</p>
            <p className="text-sm text-muted-foreground mb-4">
              Create a goal to start tracking your savings progress
            </p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-blue-700">Total Savings</h3>
                  <Target className="h-4 w-4 text-blue-700" />
                </div>
                <p className="text-2xl font-bold text-blue-800 mb-1">
                  {formatCurrency(totalCurrentAmount)}
                </p>
                <p className="text-xs text-blue-600">
                  of {formatCurrency(totalTargetAmount)} target
                </p>
                <Progress 
                  value={totalPercentage} 
                  className="h-1.5 mt-2 bg-blue-200"
                />
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-green-700">Goals Status</h3>
                  <CheckCircle className="h-4 w-4 text-green-700" />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between">
                    <span className="text-xs text-green-700">Completed</span>
                    <span className="text-xs font-medium text-green-800">{completedGoals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-green-700">In Progress</span>
                    <span className="text-xs font-medium text-green-800">{inProgressGoals}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-green-700">Not Started</span>
                    <span className="text-xs font-medium text-green-800">{notStartedGoals}</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-green-200 mt-1">
                    <span className="text-xs font-medium text-green-700">Total</span>
                    <span className="text-xs font-medium text-green-800">{goals.length}</span>
                  </div>
                </div>
              </div>
              
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-purple-700">Upcoming Deadlines</h3>
                  <CalendarClock className="h-4 w-4 text-purple-700" />
                </div>
                {upcomingGoals.length > 0 ? (
                  <div className="space-y-2">
                    {upcomingGoals.map((goal) => (
                      <div key={goal.id} className="flex justify-between items-center">
                        <span className="text-xs text-purple-700 truncate max-w-[120px]">
                          {goal.name}
                        </span>
                        <span className="text-xs font-medium text-purple-800">
                          {getDaysRemaining(goal.target_date)} days
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-purple-700">No upcoming deadlines</p>
                )}
              </div>
            </div>
            
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="mb-4">
                <TabsTrigger value="all">All Goals</TabsTrigger>
                <TabsTrigger value="in-progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="not-started">Not Started</TabsTrigger>
              </TabsList>
              
              <TabsContent value={activeTab}>
                <div className="space-y-4">
                  {filteredGoals.length === 0 ? (
                    <p className="text-center text-muted-foreground py-4">
                      No goals found in this category
                    </p>
                  ) : (
                    filteredGoals.slice(0, 3).map((goal) => {
                      const percentage = goal.target_amount > 0 
                        ? (goal.current_amount / goal.target_amount) * 100 
                        : 0;
                      const daysRemaining = getDaysRemaining(goal.target_date);
                      
                      return (
                        <div key={goal.id} className="border rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-medium">{goal.name}</h3>
                              <p className="text-sm text-muted-foreground">
                                Target: {formatCurrency(goal.target_amount)}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-medium">
                                {formatCurrency(goal.current_amount)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {percentage.toFixed(0)}% complete
                              </p>
                            </div>
                          </div>
                          
                          <Progress value={percentage} className="h-2 mb-2" />
                          
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>
                              <Clock className="h-3 w-3 inline mr-1" />
                              {daysRemaining} days left
                            </span>
                            <span>
                              Target date: {formatDate(goal.target_date)}
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                  
                  {filteredGoals.length > 3 && (
                    <p className="text-center text-sm text-muted-foreground">
                      Showing 3 of {filteredGoals.length} goals
                    </p>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </>
        )}
      </CardContent>
    </Card>
  );
} 