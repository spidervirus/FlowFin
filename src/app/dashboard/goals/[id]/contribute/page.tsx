"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { FinancialGoal, Transaction } from "@/types/financial";
import { useRouter } from "next/navigation";
import { ArrowLeft, PiggyBank } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/utils/utils";
import { Progress } from "@/components/ui/progress";

interface ContributeToGoalPageProps {
  params: {
    id: string;
  };
}

export default function ContributeToGoalPage({ params }: ContributeToGoalPageProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [goal, setGoal] = useState<FinancialGoal | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Form state
  const [amount, setAmount] = useState<string>("");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState<string>("");
  
  // Fetch goal and transactions on component mount
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch goal
        const goalResponse = await fetch(`/api/goals?id=${params.id}`);
        if (!goalResponse.ok) {
          throw new Error('Failed to fetch goal');
        }
        const goalData = await goalResponse.json();
        if (Array.isArray(goalData) && goalData.length > 0) {
          setGoal(goalData[0]);
        } else {
          setGoal(goalData);
        }
        
        // Fetch transactions
        const transactionsResponse = await fetch('/api/transactions?type=expense&limit=10');
        if (!transactionsResponse.ok) {
          throw new Error('Failed to fetch transactions');
        }
        const transactionsData = await transactionsResponse.json();
        setTransactions(transactionsData);
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to load data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [params.id]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      setError('Amount must be a positive number');
      return;
    }
    
    if (!date) {
      setError('Date is required');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/goals/contributions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goal_id: params.id,
          amount: parseFloat(amount),
          date: date.toISOString().split('T')[0],
          notes,
          transaction_id: transactionId || undefined,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add contribution');
      }
      
      // Redirect to goal page
      router.push(`/dashboard/goals/${params.id}`);
      router.refresh();
    } catch (error) {
      console.error('Error adding contribution:', error);
      setError(error instanceof Error ? error.message : 'Failed to add contribution');
      setIsSubmitting(false);
    }
  };
  
  // Calculate progress percentage
  const calculateProgress = () => {
    if (!goal) return 0;
    return goal.target_amount > 0 ? (goal.current_amount / goal.target_amount) * 100 : 0;
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
            <Link href={`/dashboard/goals/${params.id}`} className="flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Goal
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle>Add Contribution</CardTitle>
                  <CardDescription>
                    Add a contribution to your "{goal.name}" goal
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                      <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm">
                        {error}
                      </div>
                    )}
                    
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="amount">Contribution Amount</Label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input 
                            id="amount" 
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={amount} 
                            onChange={(e) => setAmount(e.target.value)} 
                            placeholder="0.00"
                            className="pl-8"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="date">Date</Label>
                        <DatePicker 
                          id="date"
                          date={date} 
                          onSelect={setDate} 
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="transaction">Link to Transaction (Optional)</Label>
                        <Select 
                          value={transactionId} 
                          onValueChange={setTransactionId}
                        >
                          <SelectTrigger id="transaction">
                            <SelectValue placeholder="Select a transaction" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">None</SelectItem>
                            {transactions.map((transaction) => (
                              <SelectItem key={transaction.id} value={transaction.id}>
                                {formatDate(transaction.date)} - {transaction.description} ({formatCurrency(transaction.amount)})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-muted-foreground mt-1">
                          Linking a transaction helps you track where your contributions come from
                        </p>
                      </div>
                      
                      <div>
                        <Label htmlFor="notes">Notes (Optional)</Label>
                        <Textarea 
                          id="notes" 
                          value={notes} 
                          onChange={(e) => setNotes(e.target.value)} 
                          placeholder="Add any notes about this contribution"
                          rows={3}
                        />
                      </div>
                    </div>
                    
                    <div className="flex justify-end gap-3">
                      <Link href={`/dashboard/goals/${params.id}`}>
                        <Button type="button" variant="outline">
                          Cancel
                        </Button>
                      </Link>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Adding...' : 'Add Contribution'}
                      </Button>
                    </div>
                  </form>
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
                    <div className="flex items-center gap-3">
                      <PiggyBank className="h-10 w-10 text-blue-500" />
                      <div>
                        <h3 className="font-medium">{goal.name}</h3>
                        {goal.description && (
                          <p className="text-sm text-muted-foreground">{goal.description}</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="space-y-1 pt-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Progress</span>
                        <span className="text-sm font-medium">
                          {formatCurrency(goal.current_amount)} of {formatCurrency(goal.target_amount)}
                        </span>
                      </div>
                      <Progress value={calculateProgress()} className="h-2" />
                      <p className="text-xs text-right text-muted-foreground">
                        {calculateProgress().toFixed(0)}% complete
                      </p>
                    </div>
                    
                    <div className="pt-2 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Target Date</span>
                        <span>{formatDate(goal.target_date)}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span>Amount Remaining</span>
                        <span className="font-medium">{formatCurrency(goal.target_amount - goal.current_amount)}</span>
                      </div>
                      
                      {goal.category && (
                        <div className="flex justify-between text-sm">
                          <span>Category</span>
                          <span>{goal.category.name}</span>
                        </div>
                      )}
                    </div>
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