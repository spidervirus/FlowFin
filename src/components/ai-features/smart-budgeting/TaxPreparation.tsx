import { useState, useEffect } from 'react';
import { CompanySettings } from '@/hooks/useBudgetingData';
import { Card, CardContent } from '@/components/ui/card';
import { CURRENCY_CONFIG } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { 
  AlertCircle, 
  Calculator, 
  CalendarDays, 
  ClipboardList, 
  FileText,
  HelpCircle,
  Download,
  PieChart,
  X
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface Transaction {
  id: string;
  user_id: string;
  date: string;
  description: string;
  amount: number;
  type: 'income' | 'expense';
  category_id?: string;
  category?: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
  created_at: string;
  updated_at: string;
}

interface TaxPreparationProps {
  settings: CompanySettings | null;
  transactions?: Transaction[];
}

interface QuarterlyData {
  quarter: string;
  income: number;
  expenses: number;
  deductible: number;
  taxable: number;
}

// Tax deadline data by country code
const TAX_DEADLINES: Record<string, { name: string, deadline: string, fiscalYear: string }> = {
  'US': { 
    name: 'United States', 
    deadline: 'April 15', 
    fiscalYear: 'January 1 - December 31'
  },
  'UK': { 
    name: 'United Kingdom', 
    deadline: 'January 31', 
    fiscalYear: 'April 6 - April 5'
  },
  'CA': { 
    name: 'Canada', 
    deadline: 'April 30', 
    fiscalYear: 'January 1 - December 31'
  },
  'AU': { 
    name: 'Australia', 
    deadline: 'October 31', 
    fiscalYear: 'July 1 - June 30'
  },
  'DE': { 
    name: 'Germany', 
    deadline: 'July 31', 
    fiscalYear: 'January 1 - December 31'
  },
  'FR': { 
    name: 'France', 
    deadline: 'May 18', 
    fiscalYear: 'January 1 - December 31'
  },
  'JP': { 
    name: 'Japan', 
    deadline: 'March 15', 
    fiscalYear: 'January 1 - December 31'
  },
  'IN': { 
    name: 'India', 
    deadline: 'July 31', 
    fiscalYear: 'April 1 - March 31'
  },
  'SG': { 
    name: 'Singapore', 
    deadline: 'April 15', 
    fiscalYear: 'January 1 - December 31'
  }
};

// Default tax data if country is not found
const DEFAULT_TAX_DATA = {
  name: 'International',
  deadline: 'Varies by country',
  fiscalYear: 'Typically January 1 - December 31'
};

// Get tax deductible categories by country
const getTaxDeductibleCategories = (countryCode: string) => {
  const commonCategories = [
    'Office Supplies', 
    'Software', 
    'Equipment', 
    'Professional Services', 
    'Insurance',
    'Training'
  ];
  
  const countrySpecific: Record<string, string[]> = {
    'US': [...commonCategories, 'Home Office', '401k Contributions', 'Health Insurance'],
    'UK': [...commonCategories, 'Vehicle Expenses', 'Working From Home Allowance'],
    'CA': [...commonCategories, 'RRSP Contributions', 'Home Office'],
    'AU': [...commonCategories, 'Superannuation', 'Work-Related Travel'],
    'DE': [...commonCategories, 'Commuting Expenses', 'Health Insurance'],
    'FR': [...commonCategories, 'Vehicle Expenses', 'Social Security Contributions'],
    'JP': [...commonCategories, 'Social Insurance Premiums', 'Life Insurance Premiums'],
    'IN': [...commonCategories, 'HRA', 'LTA', 'Section 80C Investments'],
    'SG': [...commonCategories, 'CPF Contributions', 'Donations to IPCs']
  };
  
  return countrySpecific[countryCode] || commonCategories;
};

// Tax rate data by country and income bracket
const TAX_RATES: Record<string, Array<{bracket: number, rate: number}>> = {
  'US': [
    { bracket: 0, rate: 0.10 },
    { bracket: 10275, rate: 0.12 },
    { bracket: 41775, rate: 0.22 },
    { bracket: 89075, rate: 0.24 },
    { bracket: 170050, rate: 0.32 },
    { bracket: 215950, rate: 0.35 },
    { bracket: 539900, rate: 0.37 }
  ],
  'UK': [
    { bracket: 0, rate: 0.0 },
    { bracket: 12570, rate: 0.20 },
    { bracket: 50270, rate: 0.40 },
    { bracket: 150000, rate: 0.45 }
  ],
  'CA': [
    { bracket: 0, rate: 0.15 },
    { bracket: 49020, rate: 0.205 },
    { bracket: 98040, rate: 0.26 },
    { bracket: 151978, rate: 0.29 },
    { bracket: 216511, rate: 0.33 }
  ],
  // Add more countries as needed
};

// Default tax rate if country not found
const DEFAULT_TAX_RATE = [
  { bracket: 0, rate: 0.15 },
  { bracket: 50000, rate: 0.25 },
  { bracket: 100000, rate: 0.35 }
];

export default function TaxPreparation({ settings, transactions = [] }: TaxPreparationProps) {
  const [taxDeductibleAmount, setTaxDeductibleAmount] = useState(0);
  const [nonDeductibleAmount, setNonDeductibleAmount] = useState(0);
  const [incomeAmount, setIncomeAmount] = useState(0);
  const [taxableIncome, setTaxableIncome] = useState(0);
  const [taxDeductibleTransactions, setTaxDeductibleTransactions] = useState<Transaction[]>([]);
  const [quarterlyData, setQuarterlyData] = useState<QuarterlyData[]>([]);
  const [missingCategories, setMissingCategories] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [taxRateAdjustment, setTaxRateAdjustment] = useState(0);
  const [estimatedTaxAmount, setEstimatedTaxAmount] = useState(0);
  const [effectiveTaxRate, setEffectiveTaxRate] = useState(0);
  
  // Get country from settings or default to 'US'
  const countryCode = settings?.country || 'US';
  const currencyCode = settings?.default_currency || 'USD';
  
  // Get tax deadline info for this country
  const taxInfo = TAX_DEADLINES[countryCode] || DEFAULT_TAX_DATA;
  
  // Calculate days until tax deadline
  const getTaxDeadlineInfo = () => {
    const now = new Date();
    const currentYear = now.getFullYear();
    const [month, day] = taxInfo.deadline.split(' ');
    
    const monthIndex = [
      'January', 'February', 'March', 'April', 
      'May', 'June', 'July', 'August', 
      'September', 'October', 'November', 'December'
    ].indexOf(month);
    
    const deadlineDate = new Date(currentYear, monthIndex, parseInt(day));
    
    // If the deadline has passed for this year, use next year's date
    if (now > deadlineDate) {
      deadlineDate.setFullYear(currentYear + 1);
    }
    
    const timeDiff = deadlineDate.getTime() - now.getTime();
    const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    return {
      deadlineDate,
      daysRemaining,
      isPastDeadline: daysRemaining < 0,
      isCloseToDeadline: daysRemaining <= 30 && daysRemaining >= 0,
      progress: Math.min(100, Math.max(0, 100 - (daysRemaining / 3.65)))
    };
  };
  
  const deadlineInfo = getTaxDeadlineInfo();
  
  // Format currency based on settings
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(CURRENCY_CONFIG[currencyCode].locale, {
      style: 'currency',
      currency: currencyCode,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };
  
  // Calculate tax metrics based on transactions
  useEffect(() => {
    if (!transactions || transactions.length === 0) {
      return;
    }
    
    const deductibleCategories = getTaxDeductibleCategories(countryCode);
    
    let deductibleAmount = 0;
    let nonDeductible = 0;
    let income = 0;
    let uncategorized = 0;
    const deductibleTxs: Transaction[] = [];
    
    // Initialize quarterly data
    const quarters: Record<string, QuarterlyData> = {
      'Q1': { quarter: 'Q1', income: 0, expenses: 0, deductible: 0, taxable: 0 },
      'Q2': { quarter: 'Q2', income: 0, expenses: 0, deductible: 0, taxable: 0 },
      'Q3': { quarter: 'Q3', income: 0, expenses: 0, deductible: 0, taxable: 0 },
      'Q4': { quarter: 'Q4', income: 0, expenses: 0, deductible: 0, taxable: 0 }
    };
    
    transactions.forEach(tx => {
      // Determine quarter
      const txDate = new Date(tx.date);
      const month = txDate.getMonth();
      let quarter = 'Q1';
      
      if (month >= 0 && month <= 2) quarter = 'Q1';
      else if (month >= 3 && month <= 5) quarter = 'Q2';
      else if (month >= 6 && month <= 8) quarter = 'Q3';
      else quarter = 'Q4';
      
      if (tx.type === 'income') {
        income += tx.amount;
        quarters[quarter].income += tx.amount;
      } else if (tx.type === 'expense') {
        quarters[quarter].expenses += tx.amount;
        
        // Check if the transaction has a category
        if (!tx.category?.name) {
          uncategorized++;
        }
        
        const categoryName = tx.category?.name || '';
        if (deductibleCategories.includes(categoryName)) {
          deductibleAmount += tx.amount;
          quarters[quarter].deductible += tx.amount;
          deductibleTxs.push(tx);
        } else {
          nonDeductible += tx.amount;
        }
      }
    });
    
    // Calculate taxable income for each quarter
    Object.keys(quarters).forEach(q => {
      quarters[q].taxable = quarters[q].income - quarters[q].deductible;
    });
    
    setTaxDeductibleAmount(deductibleAmount);
    setNonDeductibleAmount(nonDeductible);
    setIncomeAmount(income);
    setTaxableIncome(income - deductibleAmount);
    setTaxDeductibleTransactions(deductibleTxs);
    setMissingCategories(uncategorized);
    setQuarterlyData(Object.values(quarters));
  }, [transactions, countryCode]);

  // Calculate estimated tax based on taxable income and country tax brackets
  const calculateEstimatedTax = (adjustment = 0) => {
    const taxRates = TAX_RATES[countryCode] || DEFAULT_TAX_RATE;
    let income = taxableIncome;
    let tax = 0;
    
    // Sort tax brackets in ascending order
    const sortedRates = [...taxRates].sort((a, b) => a.bracket - b.bracket);
    
    // Calculate tax progressively through brackets
    for (let i = 0; i < sortedRates.length; i++) {
      const currentBracket = sortedRates[i];
      const nextBracket = sortedRates[i+1];
      
      if (nextBracket) {
        // If there's a next bracket, tax the income portion in the current bracket
        if (income > nextBracket.bracket) {
          const taxableInThisBracket = nextBracket.bracket - currentBracket.bracket;
          tax += taxableInThisBracket * currentBracket.rate;
        } else {
          // If income is less than next bracket, tax remaining income at current rate
          const taxableInThisBracket = income - currentBracket.bracket;
          tax += taxableInThisBracket * currentBracket.rate;
          break;
        }
      } else {
        // For the highest bracket, tax all remaining income
        const taxableInThisBracket = income - currentBracket.bracket;
        if (taxableInThisBracket > 0) {
          tax += taxableInThisBracket * currentBracket.rate;
        }
      }
    }
    
    // Apply adjustment (percentage points)
    if (adjustment !== 0) {
      const adjustmentDecimal = adjustment / 100;
      tax = tax * (1 + adjustmentDecimal);
    }
    
    // Calculate effective tax rate
    const effectiveRate = tax / (taxableIncome || 1);
    
    setEstimatedTaxAmount(tax);
    setEffectiveTaxRate(effectiveRate * 100);
    return { tax, effectiveRate: effectiveRate * 100 };
  };
  
  // Handle the tax calculation
  const handleTaxCalculation = () => {
    calculateEstimatedTax(taxRateAdjustment);
    setShowTaxCalculator(true);
  };

  // Export tax report as CSV
  const exportTaxReport = () => {
    try {
      setIsExporting(true);
      
      // Create tax summary data
      const summary = [
        ['Tax Report Summary'],
        [`Generated for ${settings?.company_name || 'Your Company'} - ${new Date().toLocaleDateString()}`],
        ['Country', taxInfo.name],
        ['Tax Deadline', taxInfo.deadline],
        ['Fiscal Year', taxInfo.fiscalYear],
        [''],
        ['Income', formatCurrency(incomeAmount)],
        ['Tax Deductible Expenses', formatCurrency(taxDeductibleAmount)],
        ['Non-Deductible Expenses', formatCurrency(nonDeductibleAmount)],
        ['Taxable Income', formatCurrency(taxableIncome)],
        [''],
        ['Quarterly Breakdown'],
        ['Quarter', 'Income', 'Expenses', 'Deductions', 'Taxable Income']
      ];
      
      // Add quarterly data
      quarterlyData.forEach(q => {
        summary.push([
          q.quarter,
          formatCurrency(q.income),
          formatCurrency(q.expenses),
          formatCurrency(q.deductible),
          formatCurrency(q.taxable)
        ]);
      });
      
      // Add transaction details
      summary.push(
        [''],
        ['Tax Deductible Transactions'],
        ['Date', 'Description', 'Category', 'Amount']
      );
      
      taxDeductibleTransactions.forEach(tx => {
        summary.push([
          new Date(tx.date).toLocaleDateString(),
          tx.description,
          tx.category?.name || 'Uncategorized',
          formatCurrency(tx.amount)
        ]);
      });
      
      // Convert to CSV
      const csvContent = summary.map(row => row.join(',')).join('\n');
      
      // Create a blob and download
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `tax_report_${new Date().getFullYear()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("Tax report downloaded successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export tax report");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 border border-blue-100 rounded-lg p-4 mb-4">
        <div className="flex items-start gap-3">
          <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-medium text-blue-800 mb-1">Tax Preparation for {taxInfo.name}</h3>
            <p className="text-sm text-blue-700">
              File your taxes by <strong>{taxInfo.deadline}</strong> for the fiscal year {taxInfo.fiscalYear}.
            </p>
          </div>
        </div>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5 text-indigo-600" />
              <h3 className="text-lg font-medium">Tax Deadline Countdown</h3>
            </div>
            {deadlineInfo.isCloseToDeadline && (
              <Badge className="bg-amber-500">Due Soon</Badge>
            )}
          </div>
          
          <div className="mb-4">
            <Progress value={deadlineInfo.progress} className="h-2" />
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Filing Deadline: {taxInfo.deadline}</span>
            <span className="font-medium">
              {deadlineInfo.daysRemaining} days remaining
            </span>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          <TabsTrigger value="deductions">Deductions</TabsTrigger>
          <TabsTrigger value="checklist">Checklist</TabsTrigger>
        </TabsList>
        
        <TabsContent value="summary" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-green-50 rounded-lg p-4">
                  <div className="text-sm text-green-600 mb-1">Total Income</div>
                  <div className="text-2xl font-bold">{formatCurrency(incomeAmount)}</div>
                </div>
                
                <div className="bg-blue-50 rounded-lg p-4">
                  <div className="text-sm text-blue-600 mb-1">Tax Deductions</div>
                  <div className="text-2xl font-bold">{formatCurrency(taxDeductibleAmount)}</div>
                </div>
                
                <div className="bg-red-50 rounded-lg p-4">
                  <div className="text-sm text-red-600 mb-1">Taxable Income</div>
                  <div className="text-2xl font-bold">{formatCurrency(taxableIncome)}</div>
                </div>
              </div>
              
              {missingCategories > 0 && (
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertCircle className="h-4 w-4 text-yellow-500" />
                  <AlertTitle>Uncategorized Expenses Detected</AlertTitle>
                  <AlertDescription>
                    You have {missingCategories} expense transactions without categories. 
                    Categorizing these may help identify additional tax deductions.
                  </AlertDescription>
                </Alert>
              )}
              
              <Alert className="bg-amber-50 border-amber-200">
                <HelpCircle className="h-4 w-4 text-amber-500" />
                <AlertTitle>Important Tax Information</AlertTitle>
                <AlertDescription>
                  This is an estimate based on your transaction data. Consult with a tax professional for 
                  accurate tax calculations and filing advice for {taxInfo.name}.
                </AlertDescription>
              </Alert>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex items-center gap-2"
                  onClick={exportTaxReport}
                  disabled={isExporting || transactions.length === 0}
                >
                  {isExporting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Exporting...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      Export Tax Report
                    </>
                  )}
                </Button>
                
                <Button 
                  className="flex items-center gap-2"
                  onClick={handleTaxCalculation}
                  disabled={transactions.length === 0}
                >
                  <Calculator className="h-4 w-4" />
                  Calculate Estimated Tax
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="quarterly" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PieChart className="h-5 w-5 text-indigo-600" />
                <h3 className="text-lg font-medium">Quarterly Breakdown</h3>
              </div>
              
              {quarterlyData.length > 0 ? (
                <div>
                  <div className="grid grid-cols-5 bg-gray-100 p-3 text-sm font-medium rounded-t-lg">
                    <div className="col-span-1">Quarter</div>
                    <div className="col-span-1 text-right">Income</div>
                    <div className="col-span-1 text-right">Expenses</div>
                    <div className="col-span-1 text-right">Deductions</div>
                    <div className="col-span-1 text-right">Taxable</div>
                  </div>
                  
                  <div className="border-x border-b rounded-b-lg divide-y">
                    {quarterlyData.map((quarter) => (
                      <div key={quarter.quarter} className="grid grid-cols-5 p-3 text-sm hover:bg-gray-50">
                        <div className="col-span-1 font-medium">{quarter.quarter}</div>
                        <div className="col-span-1 text-right">{formatCurrency(quarter.income)}</div>
                        <div className="col-span-1 text-right">{formatCurrency(quarter.expenses)}</div>
                        <div className="col-span-1 text-right text-green-600">{formatCurrency(quarter.deductible)}</div>
                        <div className="col-span-1 text-right font-medium">{formatCurrency(quarter.taxable)}</div>
                      </div>
                    ))}
                    
                    <div className="grid grid-cols-5 p-3 bg-gray-50 font-medium">
                      <div className="col-span-1">Total</div>
                      <div className="col-span-1 text-right">{formatCurrency(incomeAmount)}</div>
                      <div className="col-span-1 text-right">{formatCurrency(taxDeductibleAmount + nonDeductibleAmount)}</div>
                      <div className="col-span-1 text-right text-green-600">{formatCurrency(taxDeductibleAmount)}</div>
                      <div className="col-span-1 text-right">{formatCurrency(taxableIncome)}</div>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <Alert className="bg-blue-50 border-blue-200">
                      <HelpCircle className="h-4 w-4 text-blue-500" />
                      <AlertTitle>Quarterly Tax Tips</AlertTitle>
                      <AlertDescription>
                        {countryCode === 'US' ? (
                          <p>Consider making quarterly estimated tax payments to avoid penalties. For self-employed individuals, 
                          quarterly tax payments are typically due on April 15, June 15, September 15, and January 15.</p>
                        ) : (
                          <p>Check if {taxInfo.name} requires periodic tax payments throughout the year 
                          to avoid end-of-year penalties and large lump sum payments.</p>
                        )}
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Transaction Data Available</AlertTitle>
                  <AlertDescription>
                    We couldn't find any transactions to analyze for quarterly tax breakdown.
                    Add transactions to see your quarterly tax information.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="deductions" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4">Potential Tax Deductions</h3>
              
              {taxDeductibleTransactions.length > 0 ? (
                <div className="space-y-4">
                  <div className="bg-green-50 rounded-lg p-4 mb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm text-green-600 mb-1">Total Deductible Expenses</div>
                        <div className="text-xl font-bold">{formatCurrency(taxDeductibleAmount)}</div>
                      </div>
                      <Badge className="bg-green-600">
                        {((taxDeductibleAmount / (incomeAmount || 1)) * 100).toFixed(1)}% of Income
                      </Badge>
                    </div>
                  </div>
                
                  <div className="border rounded-lg overflow-hidden">
                    <div className="grid grid-cols-12 bg-gray-100 p-3 text-sm font-medium">
                      <div className="col-span-4">Description</div>
                      <div className="col-span-3">Category</div>
                      <div className="col-span-3">Date</div>
                      <div className="col-span-2 text-right">Amount</div>
                    </div>
                    
                    <div className="divide-y max-h-80 overflow-y-auto">
                      {taxDeductibleTransactions.map(tx => (
                        <div key={tx.id} className="grid grid-cols-12 p-3 text-sm hover:bg-gray-50">
                          <div className="col-span-4">{tx.description}</div>
                          <div className="col-span-3">
                            <div className="flex items-center">
                              <div 
                                className="w-2 h-2 rounded-full mr-2" 
                                style={{ backgroundColor: tx.category?.color || '#888' }}
                              />
                              {tx.category?.name || 'Uncategorized'}
                            </div>
                          </div>
                          <div className="col-span-3">
                            {new Date(tx.date).toLocaleDateString()}
                          </div>
                          <div className="col-span-2 text-right font-medium">
                            {formatCurrency(tx.amount)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>No Deductible Expenses Found</AlertTitle>
                  <AlertDescription>
                    We couldn't find any potentially tax-deductible expenses in your transactions.
                    Try categorizing your expenses properly to identify potential deductions.
                  </AlertDescription>
                </Alert>
              )}
              
              <div className="mt-6">
                <h4 className="font-medium mb-2">Deductible Categories for {taxInfo.name}</h4>
                <div className="flex flex-wrap gap-2">
                  {getTaxDeductibleCategories(countryCode).map(category => (
                    <Badge key={category} variant="outline" className="bg-blue-50">
                      {category}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="checklist" className="mt-4 space-y-4">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-4 flex items-center gap-2">
                <ClipboardList className="h-5 w-5 text-indigo-600" />
                Tax Preparation Checklist for {taxInfo.name}
              </h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-start gap-4 p-3 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm">1</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Gather Your Income Documents</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Collect all income-related documents including W-2s, 1099s, or equivalent forms for your country.
                      {countryCode === 'US' && ' This includes salary, freelance, investments, and other income sources.'}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm">2</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Organize Your Expense Receipts</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Sort and categorize all business expense receipts, especially those in tax-deductible categories.
                      Keep both digital and physical copies organized.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm">3</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Review Tax Deduction Eligibility</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Verify which expenses qualify as tax deductions in {taxInfo.name}.
                      Review specific rules for home office, equipment, and business travel.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm">4</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Check for Tax Credits</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Research available tax credits in {taxInfo.name} that you might qualify for.
                      These can significantly reduce your tax liability.
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4 p-3 rounded-lg border border-gray-200">
                  <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <span className="text-green-600 text-sm">5</span>
                  </div>
                  <div>
                    <h4 className="font-medium">Schedule a Consultation</h4>
                    <p className="text-sm text-gray-500 mt-1">
                      Consider speaking with a tax professional familiar with {taxInfo.name} tax laws.
                      A professional can help maximize deductions and ensure compliance.
                    </p>
                  </div>
                </div>
              </div>
              
              <Alert className="bg-blue-50 border-blue-200">
                <FileText className="h-4 w-4 text-blue-500" />
                <AlertTitle>Download Tax Resources</AlertTitle>
                <AlertDescription className="flex flex-col gap-2">
                  <p>
                    Access country-specific tax forms and guides for {taxInfo.name}.
                  </p>
                  <Button variant="outline" size="sm" className="mt-2 w-fit">
                    Download Resources
                  </Button>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Tax Calculator Dialog */}
      <Dialog open={showTaxCalculator} onOpenChange={setShowTaxCalculator}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Estimated Tax Calculator
            </DialogTitle>
            <DialogDescription>
              Based on your taxable income of {formatCurrency(taxableIncome)} in {taxInfo.name}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid items-center gap-2">
              <Label htmlFor="tax-adjustment">
                Tax Rate Adjustment (%)
                <span className="text-xs text-gray-500 ml-2">
                  For additional deductions or credits
                </span>
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id="tax-adjustment"
                  type="number"
                  value={taxRateAdjustment}
                  onChange={(e) => setTaxRateAdjustment(Number(e.target.value))}
                  min="-100"
                  max="100"
                  step="1"
                  className="w-24"
                />
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => {
                    calculateEstimatedTax(taxRateAdjustment);
                  }}
                >
                  Recalculate
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-4 mt-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-sm text-blue-600 mb-1">Estimated Tax Amount</div>
                <div className="text-2xl font-bold">{formatCurrency(estimatedTaxAmount)}</div>
              </div>
              
              <div className="bg-amber-50 p-4 rounded-lg">
                <div className="text-sm text-amber-600 mb-1">Effective Tax Rate</div>
                <div className="text-2xl font-bold">{effectiveTaxRate.toFixed(1)}%</div>
              </div>
              
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-sm text-green-600 mb-1">After-Tax Income</div>
                <div className="text-2xl font-bold">{formatCurrency(taxableIncome - estimatedTaxAmount)}</div>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Alert className="bg-gray-50 border-gray-200 text-xs">
              <AlertCircle className="h-3 w-3" />
              <AlertDescription>
                This is an estimate only. Please consult a tax professional for accurate tax calculations.
              </AlertDescription>
            </Alert>
            <Button onClick={() => setShowTaxCalculator(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 