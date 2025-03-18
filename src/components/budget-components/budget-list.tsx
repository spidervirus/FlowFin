"use client";

import { Budget } from "@/types/financial";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Edit, Trash2 } from "lucide-react";
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
import { useRouter } from "next/navigation";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";

interface BudgetListProps {
  budgets: Budget[];
  currency: CurrencyCode;
}

export default function BudgetList({ budgets, currency }: BudgetListProps) {
  const router = useRouter();
  const [deletingBudgetId, setDeletingBudgetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency].minimumFractionDigits ?? 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const handleDeleteBudget = async () => {
    if (!deletingBudgetId) return;
    
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/budgets?id=${deletingBudgetId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete budget');
      }
      
      // Refresh the page to show updated data
      router.refresh();
    } catch (error) {
      console.error('Error deleting budget:', error);
    } finally {
      setIsDeleting(false);
      setDeletingBudgetId(null);
    }
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
      <CardHeader>
        <CardTitle>Your Budgets</CardTitle>
        <CardDescription>
          Manage your active and upcoming budgets
        </CardDescription>
      </CardHeader>
      <CardContent>
        {budgets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">You don't have any active budgets</p>
            <Link href="/dashboard/budgets/new">
              <Button>Create Your First Budget</Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {budgets.map((budget) => (
              <div 
                key={budget.id} 
                className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg"
              >
                <div className="space-y-2 mb-4 md:mb-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium">{budget.name}</h3>
                    {budget.is_recurring && budget.recurrence_period && (
                      <Badge variant="outline">
                        {budget.recurrence_period.charAt(0).toUpperCase() + budget.recurrence_period.slice(1)}
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(budget.start_date)} - {formatDate(budget.end_date)}
                  </p>
                  {budget.description && (
                    <p className="text-sm">{budget.description}</p>
                  )}
                  <div className="flex flex-wrap gap-2 mt-2">
                    {budget.budget_categories?.map((category) => (
                      <Badge 
                        key={category.id} 
                        variant="secondary"
                        style={{ 
                          backgroundColor: category.category?.color ? `${category.category.color}20` : undefined,
                          color: category.category?.color || undefined
                        }}
                      >
                        {category.category?.name}: {formatCurrency(category.amount)}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Link href={`/dashboard/budgets/${budget.id}`}>
                    <Button variant="outline" size="sm">
                      <Edit className="h-4 w-4 mr-1" /> Edit
                    </Button>
                  </Link>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setDeletingBudgetId(budget.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will permanently delete this budget and all associated data.
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel onClick={() => setDeletingBudgetId(null)}>
                          Cancel
                        </AlertDialogCancel>
                        <AlertDialogAction 
                          onClick={handleDeleteBudget}
                          disabled={isDeleting}
                        >
                          {isDeleting ? 'Deleting...' : 'Delete'}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 