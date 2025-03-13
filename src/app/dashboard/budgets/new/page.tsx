"use client";

import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState, useEffect } from "react";
import { Category } from "@/types/financial";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/utils/utils";

export default function NewBudgetPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [endDate, setEndDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() + 1))
  );
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurrencePeriod, setRecurrencePeriod] = useState<string>("monthly");
  const [budgetCategories, setBudgetCategories] = useState<Array<{
    id: string;
    amount: number;
    name?: string;
    type?: string;
  }>>([]);
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories');
        if (!response.ok) {
          throw new Error('Failed to fetch categories');
        }
        const data = await response.json();
        setCategories(data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        setError('Failed to load categories. Please try again.');
      }
    };
    
    fetchCategories();
  }, []);
  
  const handleAddCategory = () => {
    setBudgetCategories([...budgetCategories, { id: '', amount: 0 }]);
  };
  
  const handleRemoveCategory = (index: number) => {
    const newCategories = [...budgetCategories];
    newCategories.splice(index, 1);
    setBudgetCategories(newCategories);
  };
  
  const handleCategoryChange = (index: number, categoryId: string) => {
    const newCategories = [...budgetCategories];
    const selectedCategory = categories.find(cat => cat.id === categoryId);
    
    newCategories[index] = {
      ...newCategories[index],
      id: categoryId,
      name: selectedCategory?.name,
      type: selectedCategory?.type
    };
    
    setBudgetCategories(newCategories);
  };
  
  const handleAmountChange = (index: number, amount: string) => {
    const newCategories = [...budgetCategories];
    newCategories[index] = {
      ...newCategories[index],
      amount: parseFloat(amount) || 0
    };
    
    setBudgetCategories(newCategories);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name) {
      setError('Budget name is required');
      return;
    }
    
    if (!startDate || !endDate) {
      setError('Start and end dates are required');
      return;
    }
    
    if (startDate > endDate) {
      setError('End date must be after start date');
      return;
    }
    
    if (budgetCategories.length === 0) {
      setError('At least one category is required');
      return;
    }
    
    if (budgetCategories.some(cat => !cat.id)) {
      setError('Please select a category for each budget item');
      return;
    }
    
    if (budgetCategories.some(cat => cat.amount <= 0)) {
      setError('Amount must be greater than zero for all categories');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/budgets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          start_date: startDate.toISOString().split('T')[0],
          end_date: endDate.toISOString().split('T')[0],
          is_recurring: isRecurring,
          recurrence_period: isRecurring ? recurrencePeriod : null,
          categories: budgetCategories.map(cat => ({
            id: cat.id,
            amount: cat.amount
          }))
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create budget');
      }
      
      // Redirect to budgets page
      router.push('/dashboard/budgets');
      router.refresh();
    } catch (error) {
      console.error('Error creating budget:', error);
      setError(error instanceof Error ? error.message : 'Failed to create budget');
      setIsSubmitting(false);
    }
  };
  
  // Calculate total budget
  const totalBudget = budgetCategories.reduce((sum, cat) => sum + cat.amount, 0);
  
  // Group categories by type
  const expenseCategories = categories.filter(cat => cat.type === 'expense');
  const incomeCategories = categories.filter(cat => cat.type === 'income');
  
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/dashboard/budgets" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Budgets
            </Link>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Budget</CardTitle>
              <CardDescription>
                Set up a budget to track your spending by category
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
                    <Label htmlFor="name">Budget Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g., Monthly Household Budget"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
                    <Textarea 
                      id="description" 
                      value={description} 
                      onChange={(e) => setDescription(e.target.value)} 
                      placeholder="Add details about this budget"
                      rows={3}
                    />
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
                      <Label htmlFor="end-date">End Date</Label>
                      <DatePicker 
                        id="end-date"
                        date={endDate} 
                        onSelect={setEndDate} 
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch 
                      id="recurring" 
                      checked={isRecurring} 
                      onCheckedChange={setIsRecurring} 
                    />
                    <Label htmlFor="recurring">Recurring Budget</Label>
                  </div>
                  
                  {isRecurring && (
                    <div>
                      <Label htmlFor="recurrence-period">Recurrence Period</Label>
                      <Select 
                        value={recurrencePeriod} 
                        onValueChange={setRecurrencePeriod}
                      >
                        <SelectTrigger id="recurrence-period">
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
                
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-medium">Budget Categories</h3>
                    <Button 
                      type="button" 
                      variant="outline" 
                      size="sm" 
                      onClick={handleAddCategory}
                    >
                      <Plus className="h-4 w-4 mr-1" /> Add Category
                    </Button>
                  </div>
                  
                  {budgetCategories.length === 0 ? (
                    <div className="text-center py-8 border border-dashed rounded-md">
                      <p className="text-muted-foreground mb-4">No categories added yet</p>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleAddCategory}
                      >
                        <Plus className="h-4 w-4 mr-1" /> Add Category
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {budgetCategories.map((category, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 border rounded-md">
                          <div className="flex-1">
                            <Label htmlFor={`category-${index}`} className="mb-1 block">Category</Label>
                            <Select 
                              value={category.id} 
                              onValueChange={(value) => handleCategoryChange(index, value)}
                            >
                              <SelectTrigger id={`category-${index}`}>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="" disabled>Select a category</SelectItem>
                                {expenseCategories.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      Expenses
                                    </div>
                                    {expenseCategories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                                {incomeCategories.length > 0 && (
                                  <>
                                    <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
                                      Income
                                    </div>
                                    {incomeCategories.map((cat) => (
                                      <SelectItem key={cat.id} value={cat.id}>
                                        {cat.name}
                                      </SelectItem>
                                    ))}
                                  </>
                                )}
                              </SelectContent>
                            </Select>
                          </div>
                          
                          <div className="w-32">
                            <Label htmlFor={`amount-${index}`} className="mb-1 block">Amount</Label>
                            <Input 
                              id={`amount-${index}`}
                              type="number" 
                              min="0" 
                              step="0.01" 
                              value={category.amount || ''} 
                              onChange={(e) => handleAmountChange(index, e.target.value)} 
                            />
                          </div>
                          
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            className="mt-6"
                            onClick={() => handleRemoveCategory(index)}
                          >
                            <Trash2 className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </div>
                      ))}
                      
                      <div className="flex justify-between p-3 border rounded-md bg-muted/50">
                        <span className="font-medium">Total Budget:</span>
                        <span className="font-medium">{formatCurrency(totalBudget)}</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="flex justify-end gap-3">
                  <Link href="/dashboard/budgets">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Budget'}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
} 