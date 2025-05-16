"use client";

import { useState } from "react";
import { Transaction } from "@/types/financial";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Calendar,
  Edit,
  Trash2,
} from "lucide-react";
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
import { CurrencyCode, CURRENCY_CONFIG, formatCurrency } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";

interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: "income" | "expense";
  recurrence_frequency: string;
  next_occurrence_date: string;
  category: {
    name: string;
    type: string;
  };
}

interface RecurringTransactionsProps {
  transactions: RecurringTransaction[];
  currency: CurrencyCode;
}

export function RecurringTransactions({
  transactions,
  currency,
}: RecurringTransactionsProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedTransactionId, setSelectedTransactionId] = useState<
    string | null
  >(null);

  const formatCurrency = (amount: number, currencyCode: string = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: 2,
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
            <p className="text-muted-foreground mb-4">
              No recurring transactions found
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Set up recurring transactions for bills, subscriptions, or regular
              income.
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
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Description</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Next Date</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.description}</TableCell>
                <TableCell>{transaction.category.name}</TableCell>
                <TableCell
                  className={
                    transaction.type === "income"
                      ? "text-green-600"
                      : "text-red-600"
                  }
                >
                  {transaction.type === "income" ? "+" : "-"}
                  {formatCurrency(transaction.amount, currency)}
                </TableCell>
                <TableCell className="capitalize">
                  {transaction.recurrence_frequency}
                </TableCell>
                <TableCell>
                  {format(
                    new Date(transaction.next_occurrence_date),
                    "MMM dd, yyyy",
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
