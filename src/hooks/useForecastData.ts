import { useState, useEffect, useCallback, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { CurrencyCode } from '@/lib/utils';
import { toast } from 'sonner';
import { Transaction, Category } from '@/types/financial';

interface CompanySettings {
  id: string;
  user_id: string;
  company_name: string;
  address: string;
  country: string;
  default_currency: CurrencyCode;
  fiscal_year_start: string;
  industry: string;
  created_at: string;
  updated_at: string;
}

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  prediction: boolean;
}

export interface CategoryForecast {
  category: string;
  categoryId: string;
  color: string;
  current: number;
  forecast: number;
  change: number;
  trend: "up" | "down" | "stable";
}

export interface UpcomingExpense {
  id: string;
  description: string;
  amount: number;
  date: string;
  category: string;
  categoryColor: string;
  frequency: string;
}

interface ForecastData {
  monthlyData: MonthlyData[];
  categoryForecasts: CategoryForecast[];
  upcomingExpenses: UpcomingExpense[];
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  settings: CompanySettings | null;
}

export function useForecastData(forecastPeriod: "3months" | "6months" | "12months"): ForecastData {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [categoryForecasts, setCategoryForecasts] = useState<CategoryForecast[]>([]);
  const [upcomingExpenses, setUpcomingExpenses] = useState<UpcomingExpense[]>([]);
  const [settings, setSettings] = useState<CompanySettings | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  
  // Use refs to track request state
  const fetchingRef = useRef(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  // Get the user ID on mount
  useEffect(() => {
    const getUserId = async () => {
      if (!mountedRef.current) return;
      
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (!mountedRef.current) return;
        
        if (userError) {
          console.error("Authentication error:", userError);
          setError("Authentication failed. Please sign in again.");
          return null;
        }
        
        if (!user) {
          console.error("No user found");
          setError("Authentication failed. Please sign in again.");
          return null;
        }
        
        console.log("User ID set for forecasting:", user.id);
        setUserId(user.id);
        return user.id;
      } catch (err) {
        if (!mountedRef.current) return;
        console.error("Error fetching user:", err);
        setError("Authentication failed. Please try signing in again.");
        return null;
      }
    };
    
    getUserId();
  }, []);

  const fetchData = useCallback(async (forceUserId?: string) => {
    const effectiveUserId = forceUserId || userId;
    
    if (!effectiveUserId) {
      console.error("No user ID available for forecast request");
      setError("Authentication required. Please sign in.");
      setIsLoading(false);
      return;
    }

    // Prevent concurrent fetches
    if (fetchingRef.current) {
      console.log("Fetch already in progress, skipping");
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    fetchingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      
      // Fetch company settings
      const { data: settingsData, error: settingsError } = await supabase
        .from("company_settings")
        .select("*")
        .eq("user_id", effectiveUserId)
        .single();

      if (!mountedRef.current) return;

      if (settingsError && settingsError.code !== 'PGRST116') {
        console.error("Error fetching company settings:", settingsError);
        toast.error("Failed to load company settings");
      }

      // Use fetched settings or a default
      const effectiveSettings = settingsData || {
        id: 'default',
        user_id: effectiveUserId,
        company_name: 'Your Company',
        address: '',
        country: 'US',
        default_currency: 'USD' as CurrencyCode,
        fiscal_year_start: '01',
        industry: 'other',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (mountedRef.current) {
        setSettings(effectiveSettings);
      }

      // Calculate date range
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 12); // Last 12 months

      // Fetch historical transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select(`
          *,
          category:categories(id, name, type, color)
        `)
        .eq("user_id", effectiveUserId)
        .gte("date", startDate.toISOString().split('T')[0])
        .order("date", { ascending: true });

      if (!mountedRef.current) return;

      if (transactionsError) {
        console.error("Error fetching transactions:", transactionsError);
        toast.error("Failed to load transactions");
        throw new Error("Failed to load transactions");
      }

      // Add user_id to all transactions
      const enrichedTransactions = transactionsData.map(transaction => ({
        ...transaction,
        user_id: effectiveUserId
      }));

      // Fetch recurring transactions
      const { data: recurringData, error: recurringError } = await supabase
        .from("recurring_transactions")
        .select(`
          *,
          category:categories(id, name, type, color)
        `)
        .eq("user_id", effectiveUserId)
        .eq("is_active", true);

      if (!mountedRef.current) return;

      if (recurringError) {
        console.error("Error fetching recurring transactions:", recurringError);
        toast.error("Failed to load recurring transactions");
        throw new Error("Failed to load recurring transactions");
      }

      // Add user_id to recurring transactions
      const enrichedRecurring = (recurringData || []).map(transaction => ({
        ...transaction,
        user_id: effectiveUserId
      }));

      // Process the data for forecasting
      console.log("Making forecast API request with userId:", effectiveUserId);
      
      const requestBody = {
        timeframe: forecastPeriod,
        transactions: enrichedTransactions,
        recurring: enrichedRecurring,
        settings: { ...effectiveSettings, user_id: effectiveUserId },
        userId: effectiveUserId
      };
      
      const response = await fetch('/api/ai-features/forecasting', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: abortControllerRef.current.signal
      });

      if (!mountedRef.current) return;

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API response error:", response.status, errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch (e) {
          errorData = { error: errorText || 'Unknown server error' };
        }
        throw new Error(errorData.error || `Server error: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process forecast data');
      }

      if (mountedRef.current) {
        setMonthlyData(data.data?.monthlyForecasts || []);
        setCategoryForecasts(data.data?.categoryForecasts || []);
        setUpcomingExpenses(data.data?.upcomingExpenses || []);
        setError(null);
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request was aborted');
        return;
      }
      
      console.error('Error in fetchData:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
      setMonthlyData([]);
      setCategoryForecasts([]);
      setUpcomingExpenses([]);
      toast.error(err instanceof Error ? err.message : 'Failed to fetch forecast data');
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
      fetchingRef.current = false;
      abortControllerRef.current = null;
    }
  }, [forecastPeriod, userId]);

  // Fetch data when userId changes or forecastPeriod changes
  useEffect(() => {
    if (userId && !fetchingRef.current) {
      fetchData();
    }
  }, [userId, forecastPeriod, fetchData]);

  const refreshData = useCallback(async () => {
    if (userId && !fetchingRef.current) {
      await fetchData();
    }
  }, [userId, fetchData]);

  return {
    monthlyData,
    categoryForecasts,
    upcomingExpenses,
    isLoading,
    error,
    refreshData,
    settings
  };
} 