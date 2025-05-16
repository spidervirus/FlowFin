"use client";

import { Transaction, Category, TransactionStatus } from "@/types/financial";
import { formatCurrency, CURRENCY_CONFIG, CurrencyCode } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface TransactionTableProps {
  transactions: Transaction[];
  currency: CurrencyCode;
}

export function TransactionTable({
  transactions,
  currency,
}: TransactionTableProps) {
  const getStatusVariant = (
    status: TransactionStatus,
  ): "default" | "secondary" | "destructive" | "outline" => {
    switch (status.toLowerCase()) {
      case "completed":
        return "secondary";
      case "pending":
        return "outline";
      case "cancelled":
        return "destructive";
      default:
        return "default";
    }
  };

  const getCategoryName = (category: Category | undefined) => {
    if (!category) return "Uncategorized";
    return category.name;
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Amount</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {transactions.map((transaction) => (
          <TableRow key={transaction.id}>
            <TableCell>
              {new Date(transaction.date).toLocaleDateString()}
            </TableCell>
            <TableCell>{transaction.description}</TableCell>
            <TableCell>{getCategoryName(transaction.category)}</TableCell>
            <TableCell
              className={
                transaction.type === "expense"
                  ? "text-red-500"
                  : "text-green-500"
              }
            >
              {formatCurrency(transaction.amount, currency)}
            </TableCell>
            <TableCell>
              <Badge
                variant={getStatusVariant(transaction.status || "pending")}
              >
                {transaction.status || "pending"}
              </Badge>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
