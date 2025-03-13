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
import { Category } from "@/types/financial";
import { useRouter } from "next/navigation";
import { ArrowLeft, Target } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/utils/utils";

export default function NewGoalPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [targetAmount, setTargetAmount] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [targetDate, setTargetDate] = useState<Date | undefined>(
    new Date(new Date().setMonth(new Date().getMonth() + 3))
  );
  const [categoryId, setCategoryId] = useState<string>("");
  const [icon, setIcon] = useState<string>("");
  const [color, setColor] = useState<string>("#3b82f6"); // Default blue color
  
  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetch('/api/categories?active=true');
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!name) {
      setError('Goal name is required');
      return;
    }
    
    if (!targetAmount || isNaN(parseFloat(targetAmount)) || parseFloat(targetAmount) <= 0) {
      setError('Target amount must be a positive number');
      return;
    }
    
    if (!startDate || !targetDate) {
      setError('Start and target dates are required');
      return;
    }
    
    if (targetDate <= startDate) {
      setError('Target date must be after start date');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch('/api/goals', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          target_amount: parseFloat(targetAmount),
          start_date: startDate.toISOString().split('T')[0],
          target_date: targetDate.toISOString().split('T')[0],
          category_id: categoryId || null,
          icon,
          color,
        }),
      });
      
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create goal');
      }
      
      // Redirect to goals page
      router.push('/dashboard/goals');
      router.refresh();
    } catch (error) {
      console.error('Error creating goal:', error);
      setError(error instanceof Error ? error.message : 'Failed to create goal');
      setIsSubmitting(false);
    }
  };
  
  // Predefined colors for selection
  const colorOptions = [
    { name: 'Blue', value: '#3b82f6' },
    { name: 'Green', value: '#10b981' },
    { name: 'Red', value: '#ef4444' },
    { name: 'Purple', value: '#8b5cf6' },
    { name: 'Yellow', value: '#f59e0b' },
    { name: 'Pink', value: '#ec4899' },
    { name: 'Indigo', value: '#6366f1' },
  ];
  
  // Predefined icons for selection (using emoji as placeholders)
  const iconOptions = [
    { name: 'Home', value: '🏠' },
    { name: 'Car', value: '🚗' },
    { name: 'Education', value: '🎓' },
    { name: 'Vacation', value: '✈️' },
    { name: 'Retirement', value: '👴' },
    { name: 'Emergency', value: '🚨' },
    { name: 'Wedding', value: '💍' },
    { name: 'Baby', value: '👶' },
    { name: 'Business', value: '💼' },
    { name: 'Other', value: '🎯' },
  ];
  
  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-6">
            <Link href="/dashboard/goals" className="flex items-center text-sm text-muted-foreground hover:text-foreground">
              <ArrowLeft className="mr-1 h-4 w-4" /> Back to Goals
            </Link>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Create New Goal</CardTitle>
              <CardDescription>
                Set up a savings goal to track your progress
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
                    <Label htmlFor="name">Goal Name</Label>
                    <Input 
                      id="name" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)} 
                      placeholder="e.g., New Car, Emergency Fund, Vacation"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="description">Description (Optional)</Label>
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
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                      <Input 
                        id="target-amount" 
                        type="number"
                        min="0.01"
                        step="0.01"
                        value={targetAmount} 
                        onChange={(e) => setTargetAmount(e.target.value)} 
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
                    <Label htmlFor="category">Category (Optional)</Label>
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
                          .filter(cat => cat.type === 'expense')
                          .map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              {category.name}
                            </SelectItem>
                          ))
                        }
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="icon">Icon (Optional)</Label>
                      <Select 
                        value={icon} 
                        onValueChange={setIcon}
                      >
                        <SelectTrigger id="icon">
                          <SelectValue placeholder="Select an icon" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          {iconOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.value} {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="color">Color (Optional)</Label>
                      <Select 
                        value={color} 
                        onValueChange={setColor}
                      >
                        <SelectTrigger id="color">
                          <SelectValue placeholder="Select a color" />
                        </SelectTrigger>
                        <SelectContent>
                          {colorOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center">
                                <div 
                                  className="w-4 h-4 rounded-full mr-2" 
                                  style={{ backgroundColor: option.value }}
                                />
                                {option.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end gap-3">
                  <Link href="/dashboard/goals">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Creating...' : 'Create Goal'}
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