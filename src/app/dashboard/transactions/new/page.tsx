"use client";

import { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, Save, Plus } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseClient } from "@/lib/supabase-client";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DashboardWrapper from "../../dashboard-wrapper";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

// Define types for accounts and categories
interface Account {
  id: string;
  name: string;
}

interface Category {
  id: string;
  name: string;
  type: string;
}

export default function NewTransactionPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const accountParam = searchParams.get('account');
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  
  // New category modal state
  const [isNewCategoryModalOpen, setIsNewCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCategoryType, setNewCategoryType] = useState("expense");
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [categoryError, setCategoryError] = useState<string | null>(null);

  // Function to fetch categories
  const fetchCategories = async (effectiveUserId: string) => {
    const supabaseClient = createSupabaseClient();
    const { data: categoriesData, error: categoriesError } = await supabaseClient
      .from("categories")
      .select("id, name, type")
      .order("name");
    
    if (categoriesError) {
      console.error("Error fetching categories:", categoriesError);
    } else {
      // If no categories found or empty array, create default categories
      if (!categoriesData || categoriesData.length === 0) {
        console.log("No categories found, using default categories");
        
        // Try to create default categories via API to bypass RLS
        try {
          console.log("Attempting to create default categories via API");
          const response = await fetch('/api/categories/default', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
              userId: effectiveUserId 
            }),
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log("Created default categories via API:", data);
            
            // If successful, refresh categories
            const { data: refreshedCategories, error: refreshError } = await supabaseClient
              .from("categories")
              .select("id, name, type")
              .order("name");
              
            if (refreshError) {
              console.error("Error refreshing categories:", refreshError);
              // Use empty categories array, will use "uncategorized" option
              setCategories([]);
            } else if (refreshedCategories && refreshedCategories.length > 0) {
              console.log("Successfully fetched refreshed categories:", refreshedCategories);
              setCategories(refreshedCategories.map(category => ({
                id: String(category.id),
                name: String(category.name),
                type: String(category.type)
              })));
            } else {
              console.log("No categories found after refresh, using empty array");
              setCategories([]);
            }
          } else {
            console.error("Failed to create default categories via API");
            setCategories([]);
          }
        } catch (err) {
          console.error("Exception creating default categories via API:", err);
          setCategories([]);
        }
      } else {
        // Cast the data to the correct type
        setCategories(categoriesData.map(category => ({
          id: String(category.id),
          name: String(category.name),
          type: String(category.type)
        })));
      }
    }
  };

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      
      try {
        // Check if user is authenticated
        const supabaseClient = createSupabaseClient();
        const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
        
        let effectiveUserId: string | null = user ? user.id : null;
        
        // If no user from Supabase, try to get from localStorage
        if (!effectiveUserId) {
          console.log("No user from Supabase, checking localStorage");
          
          // Try to get user ID from localStorage
          const localUserId = localStorage.getItem("currentUserId");
          const userDataStr = localStorage.getItem("userData");
          
          if (localUserId) {
            effectiveUserId = localUserId;
          } else if (userDataStr) {
            try {
              const userData = JSON.parse(userDataStr);
              if (userData?.user?.id) {
                effectiveUserId = userData.user.id;
              }
            } catch (e) {
              console.error("Error parsing userData:", e);
            }
          }
          
          if (!effectiveUserId) {
            console.log("No user ID found in localStorage, redirecting to sign-in");
            router.push('/sign-in');
            return;
          }
        }
        
        setUserId(effectiveUserId);
        
        // Fetch accounts for the dropdown
        const { data: accountsData, error: accountsError } = await supabaseClient
          .from("accounts")
          .select("id, name")
          .order("name");
        
        if (accountsError) {
          console.error("Error fetching accounts:", accountsError);
        } else {
          // Cast the data to the correct type
          setAccounts(accountsData ? accountsData.map(account => ({
            id: String(account.id),
            name: String(account.name)
          })) : []);
        }
        
        // Fetch categories
        await fetchCategories(effectiveUserId);
        
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchData();
  }, [router]);

  // Function to handle adding a new category
  const handleAddCategory = async () => {
    // Validate input
    if (!newCategoryName.trim()) {
      setCategoryError("Category name is required");
      return;
    }
    
    setIsAddingCategory(true);
    setCategoryError(null);
    
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newCategoryName.trim(),
          type: newCategoryType,
        }),
      });
      
      if (response.ok) {
        const newCategory = await response.json();
        console.log("Created new category:", newCategory);
        
        // Add the new category to the list
        setCategories(prev => [
          ...prev, 
          {
            id: String(newCategory.id),
            name: String(newCategory.name),
            type: String(newCategory.type)
          }
        ]);
        
        // Reset form and close modal
        setNewCategoryName("");
        setNewCategoryType("expense");
        setIsNewCategoryModalOpen(false);
      } else {
        const errorData = await response.json();
        setCategoryError(errorData.error || "Failed to create category");
      }
    } catch (error) {
      console.error("Error creating category:", error);
      setCategoryError("An error occurred while creating the category");
    } finally {
      setIsAddingCategory(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Ensure we have the user ID
    if (userId && !formData.get('user_id')) {
      formData.append('user_id', userId);
    }
    
    // Handle category - if uncategorized, remove the field entirely
    const categoryId = formData.get('category_id');
    if (categoryId === 'uncategorized') {
      formData.delete('category_id');
    }
    
    // Validate required fields
    const date = formData.get('date');
    const description = formData.get('description');
    const amount = formData.get('amount');
    const type = formData.get('type');
    const account_id = formData.get('account_id');
    
    if (!date || !description || !amount || !type || !account_id) {
      alert('Please fill in all required fields');
      setSubmitting(false);
      return;
    }
    
    // Handle recurring transaction data
    const is_recurring = formData.get('is_recurring') === 'on';
    if (is_recurring) {
      const frequency = formData.get('recurrence_frequency');
      if (!frequency) {
        alert('Please select a frequency for recurring transactions');
        setSubmitting(false);
        return;
      }
      
      // Ensure recurrence dates are properly formatted
      const recurrence_start_date = formData.get('recurrence_start_date');
      if (!recurrence_start_date) {
        formData.set('recurrence_start_date', date as string);
      }
    } else {
      // If not recurring, remove recurring fields to avoid validation errors
      formData.delete('recurrence_frequency');
      formData.delete('recurrence_start_date');
      formData.delete('recurrence_end_date');
    }
    
    try {
      console.log('Submitting transaction with data:', Object.fromEntries(formData));
      
      const response = await fetch('/api/transactions', {
        method: 'POST',
        body: formData,
      });
      
      if (response.ok) {
        console.log('Transaction created successfully');
        
        // Set a flag to refresh transactions on the transactions page
        localStorage.setItem("transactionsNeedRefresh", "true");
        
        // Use a direct approach to navigate to the transactions page
        try {
          // First try router.push with refresh
          router.refresh();
          
          // Add a small delay to ensure the refresh completes
          setTimeout(() => {
            // Then navigate to the transactions page
            router.push('/dashboard/transactions');
          }, 500);
        } catch (navError) {
          console.error('Navigation error:', navError);
          // Fallback to direct navigation
          window.location.href = '/dashboard/transactions';
        }
      } else {
        // Handle error
        const errorText = await response.text();
        let errorMessage = 'Failed to create transaction';
        
        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch (e) {
          console.error('Error parsing error response:', e);
          console.error('Raw error text:', errorText);
        }
        
        console.error('Server error response:', errorText);
        alert(errorMessage);
        setSubmitting(false);
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('An error occurred while creating the transaction');
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <DashboardWrapper>
        <div className="flex justify-center items-center h-[60vh]">
          <p className="text-lg">Loading...</p>
        </div>
      </DashboardWrapper>
    );
  }

  return (
    <DashboardWrapper>
      <div className="flex flex-col gap-8">
        {/* Header Section */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2">
            <Link href="/dashboard/transactions">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">New Transaction</h1>
              <p className="text-muted-foreground">
                Add a new financial transaction
              </p>
            </div>
          </div>
        </header>

        {/* Transaction Form */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
            <CardDescription>
              Enter the details of your transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={handleSubmit}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    defaultValue={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Transaction Type</Label>
                  <Select name="type" required>
                    <SelectTrigger id="type">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income">Income</SelectItem>
                      <SelectItem value="expense">Expense</SelectItem>
                      <SelectItem value="transfer">Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Input
                    id="description"
                    name="description"
                    placeholder="e.g., Office Supplies"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="amount">Amount</Label>
                  <Input
                    id="amount"
                    name="amount"
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="account_id">Account</Label>
                  <Select
                    name="account_id"
                    defaultValue={accountParam || undefined}
                    required
                  >
                    <SelectTrigger id="account_id">
                      <SelectValue placeholder="Select account" />
                    </SelectTrigger>
                    <SelectContent>
                      {accounts.map((account: Account) => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category_id">Category</Label>
                  <Select name="category_id" defaultValue="uncategorized">
                    <SelectTrigger id="category_id">
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="uncategorized">
                        Uncategorized
                      </SelectItem>
                      {categories.length > 0 && categories.map((category: Category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                      <Dialog open={isNewCategoryModalOpen} onOpenChange={setIsNewCategoryModalOpen}>
                        <DialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start text-left font-normal mt-2 border-t pt-2"
                            onClick={(e) => {
                              e.preventDefault();
                              setIsNewCategoryModalOpen(true);
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add New Category
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Add New Category</DialogTitle>
                            <DialogDescription>
                              Create a new category for your transactions.
                            </DialogDescription>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div className="space-y-2">
                              <Label htmlFor="new-category-name">Category Name</Label>
                              <Input
                                id="new-category-name"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder="e.g., Groceries"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="new-category-type">Category Type</Label>
                              <RadioGroup 
                                value={newCategoryType} 
                                onValueChange={setNewCategoryType}
                                className="flex space-x-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="expense" id="expense" />
                                  <Label htmlFor="expense">Expense</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="income" id="income" />
                                  <Label htmlFor="income">Income</Label>
                                </div>
                              </RadioGroup>
                            </div>
                            {categoryError && (
                              <div className="text-red-500 text-sm">{categoryError}</div>
                            )}
                          </div>
                          <DialogFooter>
                            <Button 
                              variant="outline" 
                              onClick={() => setIsNewCategoryModalOpen(false)}
                            >
                              Cancel
                            </Button>
                            <Button 
                              onClick={handleAddCategory}
                              disabled={isAddingCategory}
                            >
                              {isAddingCategory ? 'Adding...' : 'Add Category'}
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="notes">Notes (Optional)</Label>
                  <Textarea
                    id="notes"
                    name="notes"
                    placeholder="Add any additional notes or details"
                    rows={3}
                  />
                </div>
              </div>

              {/* Recurring Transaction Section */}
              <div className="pt-4">
                <div className="flex items-center space-x-2 mb-4">
                  <Switch id="is_recurring" name="is_recurring" />
                  <Label htmlFor="is_recurring">Make this a recurring transaction</Label>
                </div>
                
                <div className="pl-8 space-y-6 border-l-2 border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="recurrence_frequency">Frequency</Label>
                      <Select name="recurrence_frequency">
                        <SelectTrigger id="recurrence_frequency">
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="biweekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurrence_start_date">Start Date</Label>
                      <Input
                        id="recurrence_start_date"
                        name="recurrence_start_date"
                        type="date"
                        defaultValue={new Date().toISOString().split("T")[0]}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="recurrence_end_date">End Date (Optional)</Label>
                      <Input
                        id="recurrence_end_date"
                        name="recurrence_end_date"
                        type="date"
                      />
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>Recurring transactions will be automatically created based on the frequency you select.</p>
                    <p>You can edit or cancel this recurring schedule at any time.</p>
                  </div>
                </div>
              </div>

              {/* Add a hidden input for user_id */}
              {userId && <input type="hidden" name="user_id" value={userId} />}

              <div className="flex justify-end gap-3">
                <Link href="/dashboard/transactions">
                  <Button variant="outline" type="button">
                    Cancel
                  </Button>
                </Link>
                <Button type="submit" disabled={submitting}>
                  <Save className="mr-2 h-4 w-4" /> {submitting ? 'Saving...' : 'Save Transaction'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </DashboardWrapper>
  );
}
