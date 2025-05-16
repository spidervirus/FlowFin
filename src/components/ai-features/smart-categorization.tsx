"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowDownLeft,
  ArrowUpRight,
  Brain,
  Check,
  Sparkles,
} from "lucide-react";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";

interface SmartCategorizationProps {
  currency: CurrencyCode;
}

export default function SmartCategorization({
  currency,
}: SmartCategorizationProps) {
  const [description, setDescription] = useState("");
  const [suggestions, setSuggestions] = useState<null | {
    category: string;
    confidence: number;
    alternatives: string[];
  }>(null);

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDescription(e.target.value);

    // Clear suggestions if input is empty
    if (!e.target.value.trim()) {
      setSuggestions(null);
      return;
    }

    // Simulate AI categorization based on description
    if (e.target.value.length > 3) {
      const lowerDesc = e.target.value.toLowerCase();

      if (lowerDesc.includes("rent") || lowerDesc.includes("lease")) {
        setSuggestions({
          category: "Rent",
          confidence: 95,
          alternatives: ["Office Space", "Facilities"],
        });
      } else if (
        lowerDesc.includes("software") ||
        lowerDesc.includes("subscription")
      ) {
        setSuggestions({
          category: "Software",
          confidence: 92,
          alternatives: ["IT Expenses", "Subscriptions"],
        });
      } else if (
        lowerDesc.includes("client") ||
        lowerDesc.includes("payment") ||
        lowerDesc.includes("invoice")
      ) {
        setSuggestions({
          category: "Sales",
          confidence: 88,
          alternatives: ["Client Payments", "Revenue"],
        });
      } else if (
        lowerDesc.includes("salary") ||
        lowerDesc.includes("wage") ||
        lowerDesc.includes("employee")
      ) {
        setSuggestions({
          category: "Payroll",
          confidence: 97,
          alternatives: ["Compensation", "Employee Benefits"],
        });
      } else if (
        lowerDesc.includes("ad") ||
        lowerDesc.includes("campaign") ||
        lowerDesc.includes("promotion")
      ) {
        setSuggestions({
          category: "Marketing",
          confidence: 90,
          alternatives: ["Advertising", "Promotions"],
        });
      } else if (
        lowerDesc.includes("electric") ||
        lowerDesc.includes("water") ||
        lowerDesc.includes("bill")
      ) {
        setSuggestions({
          category: "Utilities",
          confidence: 94,
          alternatives: ["Office Expenses", "Overhead"],
        });
      } else {
        setSuggestions({
          category: "Miscellaneous",
          confidence: 70,
          alternatives: ["Office Expenses", "Other"],
        });
      }
    }
  };

  // Sample uncategorized transactions
  const uncategorizedTransactions = [
    {
      id: "1",
      date: "2023-06-18",
      description: "AWS Cloud Services",
      amount: 329.5,
      type: "expense",
      suggestedCategory: "Software",
      confidence: 96,
    },
    {
      id: "2",
      date: "2023-06-17",
      description: "Facebook Ads Campaign",
      amount: 450.0,
      type: "expense",
      suggestedCategory: "Marketing",
      confidence: 94,
    },
    {
      id: "3",
      date: "2023-06-15",
      description: "Client Retainer - Johnson LLC",
      amount: 2500.0,
      type: "income",
      suggestedCategory: "Sales",
      confidence: 92,
    },
    {
      id: "4",
      date: "2023-06-14",
      description: "Zoom Communications Inc",
      amount: 149.9,
      type: "expense",
      suggestedCategory: "Software",
      confidence: 95,
    },
    {
      id: "5",
      date: "2023-06-12",
      description: "Office Cleaning Service",
      amount: 200.0,
      type: "expense",
      suggestedCategory: "Office Maintenance",
      confidence: 88,
    },
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits:
        CURRENCY_CONFIG[currency].minimumFractionDigits ?? 2,
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI Smart Categorization</CardTitle>
        <CardDescription>
          Automatically categorize transactions and learn from your preferences
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="demo" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="demo">
              <Sparkles className="h-4 w-4 mr-2" /> Live Demo
            </TabsTrigger>
            <TabsTrigger value="batch">
              <Brain className="h-4 w-4 mr-2" /> Batch Categorization
            </TabsTrigger>
          </TabsList>

          <TabsContent value="demo" className="space-y-6">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-purple-800 text-sm">
              <p className="font-medium">Smart Categorization Demo</p>
              <p>
                Enter a transaction description below to see AI-powered category
                suggestions in real-time.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="transaction-description">
                  Transaction Description
                </Label>
                <Input
                  id="transaction-description"
                  placeholder="e.g., Monthly Office Rent Payment"
                  value={description}
                  onChange={handleDescriptionChange}
                />
              </div>

              {suggestions && (
                <div className="space-y-4">
                  <div className="bg-purple-50 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-purple-600" />
                        <span className="font-medium text-purple-800">
                          AI Suggested Category
                        </span>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium text-purple-800">
                          {suggestions.confidence}%
                        </span>
                        <span className="text-purple-600"> confidence</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mb-4">
                      <div className="flex-1">
                        <Select defaultValue={suggestions.category}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={suggestions.category}>
                              {suggestions.category}
                            </SelectItem>
                            {suggestions.alternatives.map((alt, i) => (
                              <SelectItem key={i} value={alt}>
                                {alt}
                              </SelectItem>
                            ))}
                            <SelectItem value="other">
                              Other Category...
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <Button size="sm" className="gap-1">
                        <Check className="h-4 w-4" /> Apply
                      </Button>
                    </div>

                    <div className="text-sm text-purple-700">
                      <p>Alternative suggestions:</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {suggestions.alternatives.map((alt, i) => (
                          <div
                            key={i}
                            className="px-2 py-1 bg-purple-100 rounded-full text-xs"
                          >
                            {alt}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="text-sm text-muted-foreground">
                    <p>
                      Our AI learns from your choices to improve future
                      categorization accuracy.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-6">
            <div className="bg-purple-50 border border-purple-100 rounded-lg p-4 text-purple-800 text-sm">
              <p className="font-medium">Batch Categorization</p>
              <p>
                Review and approve AI-suggested categories for your
                uncategorized transactions.
              </p>
            </div>

            <div className="space-y-4">
              {uncategorizedTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center gap-4 border-b pb-4 last:border-0 last:pb-0"
                >
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full ${transaction.type === "income" ? "bg-green-100" : "bg-red-100"}`}
                  >
                    {transaction.type === "income" ? (
                      <ArrowUpRight className="h-5 w-5 text-green-600" />
                    ) : (
                      <ArrowDownLeft className="h-5 w-5 text-red-600" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDate(transaction.date)}
                        </p>
                      </div>
                      <p
                        className={`font-medium ${transaction.type === "income" ? "text-green-600" : "text-red-600"}`}
                      >
                        {transaction.type === "income" ? "+" : "-"}{" "}
                        {formatCurrency(transaction.amount)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 min-w-[240px]">
                    <div className="flex-1">
                      <Select defaultValue={transaction.suggestedCategory}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={transaction.suggestedCategory}>
                            {transaction.suggestedCategory}
                          </SelectItem>
                          <SelectItem value="Sales">Sales</SelectItem>
                          <SelectItem value="Marketing">Marketing</SelectItem>
                          <SelectItem value="Software">Software</SelectItem>
                          <SelectItem value="Office Supplies">
                            Office Supplies
                          </SelectItem>
                          <SelectItem value="Rent">Rent</SelectItem>
                          <SelectItem value="Utilities">Utilities</SelectItem>
                          <SelectItem value="Payroll">Payroll</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <Button size="sm" variant="ghost" className="px-2">
                      <Check className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <Sparkles className="h-4 w-4 inline mr-1" />
                <span>
                  AI confidence:{" "}
                  {Math.round(
                    uncategorizedTransactions.reduce(
                      (sum, t) => sum + t.confidence,
                      0,
                    ) / uncategorizedTransactions.length,
                  )}
                  % average
                </span>
              </div>
              <Button>Apply All Categories</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
