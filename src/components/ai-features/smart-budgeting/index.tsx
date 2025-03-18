import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle, RefreshCw, CornerDownLeft, LogIn, CalendarDays } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BudgetInsights from './BudgetInsights';
import MonthlyTrends from './MonthlyTrends';
import BudgetRecommendations from './BudgetRecommendations';
import TaxPreparation from './TaxPreparation';
import { useBudgetingData } from '@/hooks/useBudgetingData';
import { createClient } from '@/lib/supabase-browser';
import { toast } from 'sonner';

export default function SmartBudgeting() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authCheckDone, setAuthCheckDone] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [showTaxBanner, setShowTaxBanner] = useState(false);
  const [taxDeadline, setTaxDeadline] = useState('');
  const [daysToDeadline, setDaysToDeadline] = useState(0);
  const [countryName, setCountryName] = useState('');
  
  const { 
    budgetInsights, 
    monthlyTrends, 
    recommendations, 
    loading, 
    error, 
    refreshData,
    settings,
    transactions 
  } = useBudgetingData();

  // Check for authentication on component mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError) {
          console.error("Authentication error:", userError);
          setIsAuthenticated(false);
        } else {
          setIsAuthenticated(!!user);
        }
      } catch (err) {
        console.error("Error checking authentication:", err);
        setIsAuthenticated(false);
      } finally {
        setAuthCheckDone(true);
      }
    };
    
    checkAuth();
  }, []);

  // Check for approaching tax deadline
  useEffect(() => {
    if (!settings || !settings.country) return;
    
    // Tax deadline data by country code
    const TAX_DEADLINES: Record<string, { name: string, deadline: string }> = {
      'US': { name: 'United States', deadline: 'April 15' },
      'UK': { name: 'United Kingdom', deadline: 'January 31' },
      'CA': { name: 'Canada', deadline: 'April 30' },
      'AU': { name: 'Australia', deadline: 'October 31' },
      'DE': { name: 'Germany', deadline: 'July 31' },
      'FR': { name: 'France', deadline: 'May 18' },
      'JP': { name: 'Japan', deadline: 'March 15' },
      'IN': { name: 'India', deadline: 'July 31' },
      'SG': { name: 'Singapore', deadline: 'April 15' }
    };
    
    const countryCode = settings.country;
    const taxInfo = TAX_DEADLINES[countryCode];
    
    if (!taxInfo) return;
    
    // Calculate days until tax deadline
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
    
    // Show banner if less than 30 days to deadline
    if (daysRemaining <= 30 && daysRemaining > 0) {
      setShowTaxBanner(true);
      setTaxDeadline(taxInfo.deadline);
      setDaysToDeadline(daysRemaining);
      setCountryName(taxInfo.name);
    } else {
      setShowTaxBanner(false);
    }
  }, [settings]);

  const handleRefresh = async () => {
    try {
      // Verify user is authenticated before refreshing
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Authentication failed. Please sign in again.");
        setIsAuthenticated(false);
        return;
      }
      
      setIsAuthenticated(true);
      console.log("Refreshing budgeting data with user ID:", user.id);
      
      // Show loading toast
      toast.loading("Updating budgeting data...", { id: "budget-refresh" });
      
      await refreshData();
      
      toast.success("Budgeting data updated successfully", { id: "budget-refresh" });
    } catch (err) {
      console.error("Error refreshing budgeting data:", err);
      toast.error("Failed to update budgeting data", { id: "budget-refresh" });
    }
  };

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!chatQuery.trim()) return;
    
    toast.info("AI budget analysis feature coming soon!");
    setChatQuery('');
  };

  // Show loading state if checking auth or data is loading
  if (!authCheckDone || (isAuthenticated && loading)) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-1/3 mb-2" />
          <Skeleton className="h-4 w-2/3" />
        </CardHeader>
        <CardContent className="space-y-6">
          <Skeleton className="h-[300px] w-full" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Skeleton className="h-[200px] w-full" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show authentication error if not authenticated
  if (authCheckDone && !isAuthenticated) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Budgeting</CardTitle>
          <CardDescription>AI-powered budget analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <LogIn className="h-4 w-4" />
            <AlertTitle>Authentication Required</AlertTitle>
            <AlertDescription>
              Please sign in to access budgeting features.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  // Show error state
  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Budgeting</CardTitle>
          <CardDescription>AI-powered budget analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  // No data available
  if ((!budgetInsights || budgetInsights.length === 0) && 
      (!monthlyTrends || monthlyTrends.months.length === 0) &&
      (!recommendations || recommendations.length === 0)) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Smart Budgeting</CardTitle>
          <CardDescription>AI-powered budget analysis and recommendations</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>No Data Available</AlertTitle>
            <AlertDescription>
              We couldn't find enough transaction data to generate budgeting insights. 
              Please add more transactions to see AI-powered budget analysis.
            </AlertDescription>
          </Alert>
          <Button onClick={handleRefresh} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      {showTaxBanner && (
        <Alert className="mx-6 mt-6 bg-amber-50 border-amber-200">
          <CalendarDays className="h-4 w-4 text-amber-500" />
          <AlertTitle>Tax Deadline Approaching!</AlertTitle>
          <AlertDescription className="flex justify-between items-center">
            <span>
              Your {countryName} tax filing deadline is {taxDeadline} ({daysToDeadline} days remaining).
            </span>
            <Button 
              size="sm" 
              onClick={() => {
                const taxesTab = document.querySelector('[value="taxes"]') as HTMLElement;
                if (taxesTab) taxesTab.click();
              }}
            >
              Tax Preparation
            </Button>
          </AlertDescription>
        </Alert>
      )}
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle>Smart Budgeting</CardTitle>
            <CardDescription>
              AI-powered budget analysis and recommendations
              {settings?.company_name && ` for ${settings.company_name}`}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-4 w-4" /> Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleChatSubmit} className="flex gap-2">
          <Input
            placeholder="Ask anything about your budget..."
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            className="flex-1"
          />
          <Button type="submit">
            <CornerDownLeft className="h-4 w-4" />
          </Button>
        </form>

        <Tabs defaultValue="insights" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
            <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            <TabsTrigger value="taxes">Tax Preparation</TabsTrigger>
          </TabsList>

          <TabsContent value="insights" className="mt-6">
            {budgetInsights && budgetInsights.length > 0 ? (
              <BudgetInsights insights={budgetInsights} settings={settings} />
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Budget Insights</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't generate budget insights from your transaction data.
                  Try adding more transactions with categories.
                </p>
                <Button onClick={handleRefresh} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            {monthlyTrends && monthlyTrends.months && monthlyTrends.months.length > 0 ? (
              <MonthlyTrends data={monthlyTrends} settings={settings} />
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Monthly Trends</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't generate monthly trends from your transaction data.
                  Try adding transactions across multiple months.
                </p>
                <Button onClick={handleRefresh} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="recommendations" className="mt-6">
            {recommendations && recommendations.length > 0 ? (
              <BudgetRecommendations recommendations={recommendations} settings={settings} />
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">No Recommendations</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  We couldn't generate budget recommendations based on your data.
                  Try adding more transactions with categories.
                </p>
                <Button onClick={handleRefresh} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="taxes" className="mt-6">
            {settings ? (
              <TaxPreparation settings={settings} transactions={transactions} />
            ) : (
              <div className="text-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                <h3 className="text-lg font-medium mb-2">Company Settings Required</h3>
                <p className="text-muted-foreground max-w-md mx-auto">
                  Please configure your company settings with country information to 
                  enable tax preparation features.
                </p>
                <Button onClick={handleRefresh} className="mt-4">
                  <RefreshCw className="mr-2 h-4 w-4" /> Refresh
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
} 