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

interface ExtractedData {
  merchant: string;
  date: string;
  total: number;
  items: {
    description: string;
    amount: number;
  }[];
}

export default function ReceiptScanner() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isPdf, setIsPdf] = useState<boolean>(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string>("");
  const [accounts, setAccounts] = useState<{id: string, name: string}[]>([]);
  const [categories, setCategories] = useState<{id: string, name: string}[]>([]);
  const [success, setSuccess] = useState<boolean>(false);
  const [uploadMethod, setUploadMethod] = useState<"camera" | "file">("file");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pdfInputRef = useRef<HTMLInputElement>(null);

  // Fetch accounts and categories when component mounts
  useEffect(() => {
    const fetchData = async () => {
      try {
        // In a real implementation, you would fetch from your API
        // For now, we'll use mock data
        setAccounts([
          { id: "1", name: "Checking Account" },
          { id: "2", name: "Credit Card" },
          { id: "3", name: "Savings Account" }
        ]);
        
        setCategories([
          { id: "1", name: "Groceries" },
          { id: "2", name: "Dining" },
          { id: "3", name: "Shopping" },
          { id: "4", name: "Transportation" },
          { id: "5", name: "Utilities" }
        ]);
      } catch (err) {
        setError("Failed to load accounts and categories");
        console.error(err);
      }
    };
    
    fetchData();
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Reset states
    setError(null);
    setExtractedData(null);
    setSuccess(false);
    
    // Check file type
    const isPdfFile = file.type === 'application/pdf';
    setIsPdf(isPdfFile);
    
    if (!file.type.startsWith('image/') && !isPdfFile) {
      setError("Please upload an image or PDF file");
      return;
    }
    
    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size should be less than 10MB");
      return;
    }
    
    setSelectedFile(file);
    
    // Create preview URL
    if (isPdfFile) {
      setPreviewUrl(null); // We don't show PDF previews directly
    } else {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = () => {
    setUploadMethod("camera");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileUpload = () => {
    setUploadMethod("file");
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handlePdfUpload = () => {
    setUploadMethod("file");
    if (pdfInputRef.current) {
      pdfInputRef.current.click();
    }
  };

  const handleScanReceipt = async () => {
    if (!selectedFile) {
      setError("Please select a receipt image or PDF first");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would send the image to your API for processing
      // For now, we'll simulate a response after a delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock extracted data
      const mockData: ExtractedData = {
        merchant: isPdf ? "Office Supply Store" : "Grocery Store",
        date: new Date().toISOString().split('T')[0],
        total: isPdf ? 124.99 : 78.45,
        items: isPdf ? [
          { description: "Printer Paper", amount: 24.99 },
          { description: "Ink Cartridges", amount: 45.99 },
          { description: "Stapler", amount: 12.99 },
          { description: "Pens (12 pack)", amount: 8.99 },
          { description: "Notebooks", amount: 15.99 },
          { description: "Desk Organizer", amount: 16.04 }
        ] : [
          { description: "Milk", amount: 4.99 },
          { description: "Bread", amount: 3.49 },
          { description: "Eggs", amount: 5.99 },
          { description: "Fruits", amount: 12.99 },
          { description: "Vegetables", amount: 15.99 },
          { description: "Chicken", amount: 18.99 },
          { description: "Snacks", amount: 8.99 },
          { description: "Beverages", amount: 7.02 }
        ]
      };
      
      setExtractedData(mockData);
    } catch (err) {
      setError("Failed to extract data from receipt");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTransaction = async () => {
    if (!extractedData) {
      setError("No data to create transaction");
      return;
    }
    
    if (!selectedAccount) {
      setError("Please select an account");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real implementation, you would send the transaction data to your API
      // For now, we'll simulate a successful response after a delay
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setExtractedData(null);
        setSuccess(false);
      }, 3000);
    } catch (err) {
      setError("Failed to create transaction");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setError(null);
    setSuccess(false);
    setIsPdf(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (pdfInputRef.current) {
      pdfInputRef.current.value = "";
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Receipt Scanner</CardTitle>
            <CardDescription>
              Upload receipt images or PDFs to automatically create transactions
            </CardDescription>
          </div>
          <Button variant="outline" size="icon" onClick={resetForm}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
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
              Transaction created successfully!
            </AlertDescription>
          </Alert>
        )}
        
        <div className="space-y-6">
          {/* Step 1: Upload Receipt */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-blue-100 p-2 rounded-full">
                <Upload className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="text-lg font-medium">Step 1: Upload Receipt</h3>
            </div>
            
            <Tabs defaultValue="image" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="image">Image Upload</TabsTrigger>
                <TabsTrigger value="pdf">PDF Upload</TabsTrigger>
              </TabsList>
              
              <TabsContent value="image" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="mb-4 hidden"
                    />
                    
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={handleFileUpload}
                        className="flex-1"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Image
                      </Button>
                      
                      <Button 
                        variant="outline" 
                        onClick={handleCameraCapture}
                        className="flex-1"
                      >
                        <Camera className="h-4 w-4 mr-2" />
                        Take Photo
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported formats: JPG, PNG, HEIC, WEBP (max 10MB)
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center border rounded-md h-48 bg-gray-50">
                    {previewUrl ? (
                      <img 
                        src={previewUrl} 
                        alt="Receipt preview" 
                        className="max-h-full max-w-full object-contain"
                      />
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <Receipt className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>Receipt preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="pdf" className="space-y-4 pt-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <Input
                      ref={pdfInputRef}
                      type="file"
                      accept="application/pdf"
                      onChange={handleFileChange}
                      className="mb-4 hidden"
                    />
                    
                    <Button 
                      variant="outline" 
                      onClick={handlePdfUpload}
                      className="w-full"
                    >
                      <File className="h-4 w-4 mr-2" />
                      Upload PDF
                    </Button>
                    
                    <p className="text-xs text-muted-foreground mt-2">
                      Supported format: PDF (max 10MB)
                    </p>
                  </div>
                  
                  <div className="flex items-center justify-center border rounded-md h-48 bg-gray-50">
                    {selectedFile && isPdf ? (
                      <div className="text-center">
                        <File className="h-12 w-12 mx-auto mb-2 text-blue-500" />
                        <p className="font-medium">{selectedFile.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    ) : (
                      <div className="text-center text-muted-foreground">
                        <File className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                        <p>PDF preview will appear here</p>
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <Button 
              onClick={handleScanReceipt} 
              disabled={!selectedFile || isLoading}
              className="w-full"
            >
              {isLoading && !extractedData ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Scan className="h-4 w-4 mr-2" />
                  Scan Receipt
                </>
              )}
            </Button>
          </div>
          
          {/* Separator */}
          <Separator />
          
          {/* Step 2: Review Extracted Data */}
          {extractedData && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-2 rounded-full">
                  <FileText className="h-4 w-4 text-green-600" />
                </div>
                <h3 className="text-lg font-medium">Step 2: Review Extracted Data</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="merchant">Merchant</Label>
                    <Input 
                      id="merchant" 
                      value={extractedData.merchant} 
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        merchant: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="date">Date</Label>
                    <Input 
                      id="date" 
                      type="date" 
                      value={extractedData.date} 
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        date: e.target.value
                      })}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="total">Total Amount</Label>
                    <Input 
                      id="total" 
                      type="number" 
                      step="0.01" 
                      value={extractedData.total} 
                      onChange={(e) => setExtractedData({
                        ...extractedData,
                        total: parseFloat(e.target.value)
                      })}
                    />
                  </div>
                  
                  <div>
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
                            {account.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select>
                      <SelectTrigger id="category">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto-categorize</SelectItem>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label>Line Items</Label>
                  <div className="border rounded-md overflow-hidden mt-2">
                    <div className="max-h-64 overflow-y-auto">
                      <table className="w-full">
                        <thead className="bg-gray-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                            <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {extractedData.items.map((item, index) => (
                            <tr key={index}>
                              <td className="px-4 py-2 text-sm">{item.description}</td>
                              <td className="px-4 py-2 text-sm text-right">${item.amount.toFixed(2)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="bg-gray-50 px-4 py-2 border-t flex justify-between">
                      <span className="font-medium">Total</span>
                      <span className="font-medium">${extractedData.total.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <Button 
                onClick={handleCreateTransaction} 
                disabled={isLoading || !selectedAccount}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Creating Transaction...
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Create Transaction
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <p className="text-xs text-muted-foreground">
          This feature uses AI to extract data from receipt images and PDFs. For best results with images, ensure the receipt is well-lit, flat, and all text is clearly visible. For PDFs, make sure the text is selectable and not just an image. The extracted data can be edited before creating the transaction.
        </p>
      </CardFooter>
    </Card>
  );
} 