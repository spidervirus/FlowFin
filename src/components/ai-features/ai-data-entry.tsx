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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Image, Receipt, Scan, Upload } from "lucide-react";

export default function AIDataEntry() {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<null | {
    date: string;
    vendor: string;
    amount: string;
    category: string;
    description: string;
  }>(null);

  const handleUpload = () => {
    setUploading(false);
    setProcessing(true);

    // Simulate AI processing
    setTimeout(() => {
      setProcessing(false);
      setResults({
        date: new Date().toISOString().split("T")[0],
        vendor: "Office Supply Co.",
        amount: "$124.99",
        category: "Office Supplies",
        description:
          "Monthly office supplies including paper, pens, and notebooks",
      });
    }, 2000);
  };

  const resetForm = () => {
    setResults(null);
    setUploading(false);
    setProcessing(false);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>AI-Powered Data Entry</CardTitle>
        <CardDescription>
          Upload receipts, invoices, or bank statements to automatically extract
          transaction data
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="receipt" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="receipt">
              <Receipt className="h-4 w-4 mr-2" /> Receipt
            </TabsTrigger>
            <TabsTrigger value="invoice">
              <FileUp className="h-4 w-4 mr-2" /> Invoice
            </TabsTrigger>
            <TabsTrigger value="statement">
              <Scan className="h-4 w-4 mr-2" /> Bank Statement
            </TabsTrigger>
          </TabsList>

          <TabsContent value="receipt" className="space-y-4">
            {!results ? (
              <div className="space-y-4">
                {!uploading ? (
                  <div
                    className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setUploading(true)}
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Image className="h-10 w-10 text-muted-foreground mb-2" />
                      <h3 className="font-medium">Upload Receipt Image</h3>
                      <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                        Drag and drop or click to upload a receipt image (JPG,
                        PNG, PDF)
                      </p>
                    </div>
                  </div>
                ) : processing ? (
                  <div className="text-center py-12">
                    <div className="animate-pulse flex flex-col items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
                        <Scan className="h-6 w-6 text-blue-600" />
                      </div>
                      <h3 className="font-medium">Processing Receipt</h3>
                      <p className="text-sm text-muted-foreground">
                        Our AI is extracting data from your receipt...
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="h-16 w-16 rounded-lg bg-blue-100 flex items-center justify-center">
                        <Upload className="h-8 w-8 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium">receipt-image.jpg</h3>
                        <p className="text-sm text-muted-foreground">1.2 MB</p>
                      </div>
                    </div>
                    <div className="flex justify-end gap-3">
                      <Button variant="outline" onClick={resetForm}>
                        Cancel
                      </Button>
                      <Button onClick={handleUpload}>Process Receipt</Button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                <div className="bg-green-50 border border-green-100 rounded-lg p-4 text-green-800 text-sm">
                  <p className="font-medium">Receipt processed successfully!</p>
                  <p>
                    Our AI has extracted the following information. Please
                    verify and make any necessary corrections.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="ai-date">Date</Label>
                    <Input id="ai-date" defaultValue={results.date} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-vendor">Vendor/Payee</Label>
                    <Input id="ai-vendor" defaultValue={results.vendor} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-amount">Amount</Label>
                    <Input id="ai-amount" defaultValue={results.amount} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ai-category">Category</Label>
                    <Input id="ai-category" defaultValue={results.category} />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="ai-description">Description</Label>
                    <Input
                      id="ai-description"
                      defaultValue={results.description}
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={resetForm}>
                    Cancel
                  </Button>
                  <Button>Save Transaction</Button>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="invoice">
            <div className="text-center py-12">
              <FileUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Upload Invoice</h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Upload an invoice PDF or image to automatically extract vendor,
                amount, and line items.
              </p>
              <Button>Upload Invoice</Button>
            </div>
          </TabsContent>

          <TabsContent value="statement">
            <div className="text-center py-12">
              <Scan className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">
                Upload Bank Statement
              </h3>
              <p className="text-muted-foreground max-w-md mx-auto mb-6">
                Upload a bank statement PDF to automatically import and
                categorize all transactions.
              </p>
              <Button>Upload Statement</Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
