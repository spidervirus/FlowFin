"use client";

import { useState, useRef, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  Camera, 
  Upload, 
  FileText, 
  Check, 
  AlertCircle, 
  RefreshCw,
  Receipt,
  Scan,
  File
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Transaction } from "@/types/financial";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CurrencyCode, CURRENCY_CONFIG } from "@/lib/utils";

interface ExtractedData {
  merchant: string;
  date: string;
  total: number;
  items: {
    description: string;
    amount: number;
  }[];
}

interface ReceiptScannerProps {
  currency: CurrencyCode;
}

export default function ReceiptScanner({ currency }: ReceiptScannerProps) {
  const [isLoading, setIsLoading] = useState(true);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currency].locale, {
      style: "currency",
      currency,
      minimumFractionDigits: CURRENCY_CONFIG[currency].minimumFractionDigits ?? 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Receipt Scanner</CardTitle>
            <CardDescription>
              Automatically extract data from receipts and create transactions
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <Receipt className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">Coming Soon!</h3>
          <p className="text-sm text-muted-foreground max-w-sm">
            We're working on bringing you an intelligent receipt scanner that will automatically extract transaction data from your receipts. Stay tuned!
          </p>
        </div>
      </CardContent>
    </Card>
  );
} 