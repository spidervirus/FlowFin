"use client";

import { useState } from "react";
import { Transaction } from "@/types/financial";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowDownLeft, ArrowUpRight, Calendar, Edit, Trash2 } from "lucide-react";
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

interface RecurringTransactionsProps {
  transactions: Array<{
    id: string;
    description: string;
    amount: number;
    type: string;
    recurrence_frequency: string;
    next_occurrence_date: string;
    category: {
      name: string;
      type: string;
    };
  }>;
  currency: CurrencyCode;
}

export default function RecurringTransactions({ transactions, currency }: RecurringTransactionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency].minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case "daily":
        return "Daily";
      case "weekly":
        return "Weekly";
      case "biweekly":
        return "Bi-weekly";
      case "monthly":
        return "Monthly";
      case "quarterly":
        return "Quarterly";
      case "yearly":
        return "Yearly";
      default:
        return frequency;
    }
  };

  const handleDeleteRecurring = async (id: string) => {
    setIsDeleting(true);
    setSelectedTransactionId(id);
    
    try {
      const response = await fetch(`/api/transactions/recurring?id=${id}`, {
        method: "DELETE",
      });
      
      if (!response.ok) {
        throw new Error("Failed to delete recurring transaction");
      }
      
      router.refresh();
    } catch (error) {
      console.error("Error deleting recurring transaction:", error);
    } finally {
      setIsDeleting(false);
      setSelectedTransactionId(null);
    }
  };

  if (transactions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recurring Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <Calendar className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">No recurring transactions found</p>
            <p className="text-sm text-muted-foreground mb-4">
              Set up recurring transactions for bills, subscriptions, or regular income.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recurring Transactions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {transactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full ${
                  transaction.type === "income"
                    ? "bg-green-100 text-green-600"
                    : "bg-red-100 text-red-600"
                }`}>
                  {transaction.type === "income" ? (
                    <ArrowUpRight className="h-5 w-5" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{transaction.description}</p>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Badge variant="outline">
                      {getFrequencyLabel(transaction.recurrence_frequency || "")}
                    </Badge>
                    <span>Next: {formatDate(transaction.next_occurrence_date || "")}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <p className={`font-semibold ${
                  transaction.type === "income" ? "text-green-600" : "text-red-600"
                }`}>
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount)}
                </p>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" onClick={() => router.push(`/dashboard/transactions/edit/${transaction.id}`)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Recurring Transaction</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this recurring transaction? This will stop all future occurrences.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteRecurring(transaction.id)}
                          disabled={isDeleting && selectedTransactionId === transaction.id}
                          className="bg-red-500 hover:bg-red-600"
                        >
                          {isDeleting && selectedTransactionId === transaction.id
                            ? "Deleting..."
                            : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
} 