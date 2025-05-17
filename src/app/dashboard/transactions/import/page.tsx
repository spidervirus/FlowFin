"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardNavbar from "@/components/dashboard-navbar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, FileUp, Upload, Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Transaction, Category, Account } from "@/types/financial";
import { suggestCategory } from "@/lib/transaction-categorization";
import { CurrencyCode } from "@/lib/utils";
import type { Database } from "@/types/supabase";

type DbAccount = Database['public']['Tables']['accounts']['Row'];
type DbTransaction = Database['public']['Tables']['transactions']['Row'];
type DbCategory = Database['public']['Tables']['categories']['Row'];

interface MappedTransaction {
  date: string;
  description: string;
  amount: number;
  type: "income" | "expense" | "transfer";
  category?: string;
  account_id: string;
  status: "pending" | "completed" | "reconciled";
}

export default function ImportTransactionsPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [csvData, setCsvData] = useState<Record<string, string>[]>([]);
  const [mappedData, setMappedData] = useState<MappedTransaction[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [columnMapping, setColumnMapping] = useState({
    date: "",
    description: "",
    amount: "",
    type: "",
  });
  const [useAutoCategorization, setUseAutoCategorization] = useState(true);
  const [step, setStep] = useState(1);
  const [existingTransactions, setExistingTransactions] = useState<
    Transaction[]
  >([]);

  // Fetch accounts and categories on component mount
  useEffect(() => {
    const fetchData = async () => {
      const supabase = createClient();

      // Fetch accounts
      const { data: accountsData, error: accountsError } = await supabase
        .from("accounts")
        .select("*")
        .eq("is_active", true);

      if (accountsError) {
        setError("Failed to load accounts");
        return;
      }

      // Transform accounts data to match Account type
      const transformedAccounts: Account[] = (accountsData || []).map((account: DbAccount) => ({
        ...account,
        type: account.type as Account["type"],
        currency: account.currency as CurrencyCode
      }));

      setAccounts(transformedAccounts);

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from("categories")
        .select("*")
        .eq("is_active", true);

      if (categoriesError) {
        setError("Failed to load categories");
        return;
      }

      // Transform categories data to match Category type
      const transformedCategories: Category[] = (categoriesData || []).map((category: DbCategory) => ({
        ...category,
        type: category.type as Category["type"],
      }));
      setCategories(transformedCategories);

      // Fetch existing transactions for auto-categorization
      const { data: transactionsData } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false })
        .limit(500);

      if (transactionsData) {
        // Transform transactions data to match Transaction type
        const transformedTransactions: Transaction[] = transactionsData.map((transaction: DbTransaction) => ({
          id: transaction.id,
          date: transaction.date,
          description: transaction.description,
          amount: transaction.amount,
          type: transaction.type as Transaction["type"],
          category_id: transaction.category_id || '',
          account_id: transaction.account_id,
          status: transaction.status === 'reconciled' ? 'completed' : transaction.status as Transaction["status"],
          notes: transaction.notes || '',
          is_recurring: transaction.is_recurring || false,
          recurrence_frequency: (transaction as any).recurrence_frequency || undefined,
          next_occurrence_date: (transaction as any).next_occurrence_date || undefined,
          created_at: transaction.created_at,
          updated_at: transaction.updated_at,
          user_id: transaction.user_id
        }));

        setExistingTransactions(transformedTransactions);
      }
    };

    fetchData();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("Please upload a CSV file");
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const csvContent = event.target?.result as string;
        const lines = csvContent.split("\n");

        // Extract headers
        const headers = lines[0].split(",").map((header) => header.trim());

        // Parse data
        const data: Record<string, string>[] = [];
        for (let i = 1; i < lines.length; i++) {
          if (lines[i].trim() === "") continue;

          const values = lines[i].split(",").map((value) => value.trim());
          const row: Record<string, string> = {};

          headers.forEach((header, index) => {
            row[header] = values[index] || "";
          });

          data.push(row);
        }

        setCsvData(data);
        setColumnMapping({
          date: headers.find((h) => /date|time/i.test(h)) || "",
          description:
            headers.find((h) => /desc|memo|narration/i.test(h)) || "",
          amount: headers.find((h) => /amount|sum|value/i.test(h)) || "",
          type: headers.find((h) => /type|transaction type/i.test(h)) || "",
        });

        setStep(2);
      } catch (err) {
        setError("Failed to parse CSV file. Please check the format.");
      }
    };

    reader.onerror = () => {
      setError("Failed to read the file");
    };

    reader.readAsText(file);
  };

  const handleColumnMappingChange = (field: string, value: string) => {
    setColumnMapping({
      ...columnMapping,
      [field]: value,
    });
  };

  const processData = () => {
    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }

    if (
      !columnMapping.date ||
      !columnMapping.description ||
      !columnMapping.amount
    ) {
      setError("Please map all required columns");
      return;
    }

    try {
      const processed: MappedTransaction[] = csvData.map((row) => {
        // Extract values based on mapping
        const dateValue = row[columnMapping.date];
        const descriptionValue = row[columnMapping.description];
        let amountValue = parseFloat(
          row[columnMapping.amount].replace(/[^0-9.-]+/g, ""),
        );

        // Determine transaction type
        let type: "income" | "expense" = "expense";

        if (columnMapping.type && row[columnMapping.type]) {
          // If type column is mapped, use its value
          const typeValue = row[columnMapping.type].toLowerCase();
          if (
            typeValue.includes("income") ||
            typeValue.includes("credit") ||
            typeValue.includes("deposit")
          ) {
            type = "income";
          }
        } else {
          // Otherwise infer from amount (positive = income, negative = expense)
          if (amountValue < 0) {
            amountValue = Math.abs(amountValue);
            type = "expense";
          } else {
            type = "income";
          }
        }

        // Auto-categorize if enabled
        let category: string | undefined = undefined;
        if (useAutoCategorization) {
          const suggestedCategory = suggestCategory(
            descriptionValue,
            amountValue,
            type,
            existingTransactions,
            categories,
          );

          if (suggestedCategory) {
            category = suggestedCategory;
          }
        }

        return {
          date: dateValue,
          description: descriptionValue,
          amount: amountValue,
          type,
          category,
          account_id: selectedAccount,
          status: "completed" as const,
        };
      });

      setMappedData(processed);
      setStep(3);
    } catch (err) {
      setError("Failed to process data. Please check your column mapping.");
    }
  };

  const handleImport = async () => {
    if (mappedData.length === 0) {
      setError("No transactions to import");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Use the API endpoint instead of direct Supabase calls
      const response = await fetch("/api/transactions/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactions: mappedData,
          account_id: selectedAccount,
          auto_categorize: useAutoCategorization,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to import transactions");
      }

      if (result.failed === 0) {
        setSuccess(`Successfully imported ${result.imported} transactions`);
        setTimeout(() => {
          router.push("/dashboard/transactions");
          router.refresh();
        }, 2000);
      } else {
        setSuccess(
          `Imported ${result.imported} transactions with ${result.failed} errors`,
        );
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to import transactions",
      );
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <DashboardNavbar />
      <main className="w-full bg-gray-50 min-h-screen">
        <div className="container mx-auto px-4 py-8">
          <Card className="max-w-4xl mx-auto">
            <CardHeader>
              <CardTitle>Import Transactions</CardTitle>
              <CardDescription>
                Upload a CSV file to import multiple transactions at once
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <Alert variant="destructive" className="mb-6">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="mb-6 bg-green-50 border-green-200">
                  <Check className="h-4 w-4 text-green-600" />
                  <AlertTitle className="text-green-800">Success</AlertTitle>
                  <AlertDescription className="text-green-700">
                    {success}
                  </AlertDescription>
                </Alert>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                    <FileUp className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                      Upload CSV File
                    </h3>
                    <p className="text-sm text-gray-500 mb-4">
                      Drag and drop your CSV file here, or click to browse
                    </p>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                    <Button onClick={() => fileInputRef.current?.click()}>
                      <Upload className="mr-2 h-4 w-4" /> Select File
                    </Button>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2">
                      CSV Format Guidelines
                    </h4>
                    <ul className="text-sm text-blue-700 list-disc pl-5 space-y-1">
                      <li>File should be in CSV format</li>
                      <li>First row should contain column headers</li>
                      <li>Required data: date, description, and amount</li>
                      <li>Dates should be in YYYY-MM-DD format</li>
                      <li>
                        Amounts can be positive (income) or negative (expense)
                      </li>
                    </ul>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Map CSV Columns</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Select which columns in your CSV file correspond to
                    transaction data
                  </p>

                  <div className="grid gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="account">Account</Label>
                        <Select
                          value={selectedAccount}
                          onValueChange={setSelectedAccount}
                        >
                          <SelectTrigger id="account">
                            <SelectValue placeholder="Select account" />
                          </SelectTrigger>
                          <SelectContent>
                            {accounts.map((account) => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name} ({account.type})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="auto-categorize">
                          Auto-categorization
                        </Label>
                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="auto-categorize"
                            checked={useAutoCategorization}
                            onCheckedChange={(checked) =>
                              setUseAutoCategorization(checked === true)
                            }
                          />
                          <label
                            htmlFor="auto-categorize"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Enable ML-based auto-categorization
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="date-column">Date Column</Label>
                      <Select
                        value={columnMapping.date}
                        onValueChange={(value) =>
                          handleColumnMappingChange("date", value)
                        }
                      >
                        <SelectTrigger id="date-column">
                          <SelectValue placeholder="Select date column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvData.length > 0 &&
                            Object.keys(csvData[0]).map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description-column">
                        Description Column
                      </Label>
                      <Select
                        value={columnMapping.description}
                        onValueChange={(value) =>
                          handleColumnMappingChange("description", value)
                        }
                      >
                        <SelectTrigger id="description-column">
                          <SelectValue placeholder="Select description column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvData.length > 0 &&
                            Object.keys(csvData[0]).map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="amount-column">Amount Column</Label>
                      <Select
                        value={columnMapping.amount}
                        onValueChange={(value) =>
                          handleColumnMappingChange("amount", value)
                        }
                      >
                        <SelectTrigger id="amount-column">
                          <SelectValue placeholder="Select amount column" />
                        </SelectTrigger>
                        <SelectContent>
                          {csvData.length > 0 &&
                            Object.keys(csvData[0]).map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="type-column">
                        Type Column (Optional)
                      </Label>
                      <Select
                        value={columnMapping.type}
                        onValueChange={(value) =>
                          handleColumnMappingChange("type", value)
                        }
                      >
                        <SelectTrigger id="type-column">
                          <SelectValue placeholder="Select type column (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">
                            None (infer from amount)
                          </SelectItem>
                          {csvData.length > 0 &&
                            Object.keys(csvData[0]).map((column) => (
                              <SelectItem key={column} value={column}>
                                {column}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-medium text-amber-800 mb-2">Preview</h4>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs">
                        <thead>
                          <tr className="bg-amber-100">
                            {csvData.length > 0 &&
                              Object.keys(csvData[0]).map((column) => (
                                <th
                                  key={column}
                                  className="px-2 py-1 text-left"
                                >
                                  {column}
                                </th>
                              ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvData.slice(0, 3).map((row, index) => (
                            <tr
                              key={index}
                              className="border-b border-amber-100"
                            >
                              {Object.entries(row).map(([key, value], i) => (
                                <td key={i} className="px-2 py-1">
                                  {value}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium">Review Transactions</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Review the mapped transactions before importing
                  </p>

                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead>
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Description
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Category
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {mappedData.slice(0, 10).map((transaction, index) => {
                          const category = categories.find(
                            (c) => c.id === transaction.category,
                          );

                          return (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm">
                                {transaction.date}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {transaction.description}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                ${transaction.amount.toFixed(2)}
                              </td>
                              <td className="px-4 py-2 text-sm">
                                <span
                                  className={`inline-block px-2 py-1 text-xs rounded-full ${
                                    transaction.type === "income"
                                      ? "bg-green-100 text-green-800"
                                      : "bg-red-100 text-red-800"
                                  }`}
                                >
                                  {transaction.type}
                                </span>
                              </td>
                              <td className="px-4 py-2 text-sm">
                                {category ? category.name : "Uncategorized"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {mappedData.length > 10 && (
                    <p className="text-sm text-gray-500 italic">
                      Showing 10 of {mappedData.length} transactions
                    </p>
                  )}

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2">Summary</h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      <li>Total transactions: {mappedData.length}</li>
                      <li>
                        Income transactions:{" "}
                        {mappedData.filter((t) => t.type === "income").length}
                        ($
                        {mappedData
                          .filter((t) => t.type === "income")
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                        )
                      </li>
                      <li>
                        Expense transactions:{" "}
                        {mappedData.filter((t) => t.type === "expense").length}
                        ($
                        {mappedData
                          .filter((t) => t.type === "expense")
                          .reduce((sum, t) => sum + t.amount, 0)
                          .toFixed(2)}
                        )
                      </li>
                      <li>
                        Auto-categorized:{" "}
                        {mappedData.filter((t) => t.category).length} of{" "}
                        {mappedData.length}
                      </li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)}>
                  Back
                </Button>
              )}

              {step === 1 && (
                <Button
                  variant="outline"
                  onClick={() => router.push("/dashboard/transactions")}
                >
                  Cancel
                </Button>
              )}

              {step === 2 && <Button onClick={processData}>Continue</Button>}

              {step === 3 && (
                <Button onClick={handleImport} disabled={isLoading}>
                  {isLoading ? "Importing..." : "Import Transactions"}
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      </main>
    </>
  );
}
