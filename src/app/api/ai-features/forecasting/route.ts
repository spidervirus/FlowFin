import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { AppError, errorHandler } from '@/lib/logger';
import { strictRateLimit } from '@/lib/rate-limit';
import { Transaction, Category } from '@/types/financial';
import { CurrencyCode } from '@/lib/utils';
import { createAdminClient } from '@/lib/supabase-admin';
import { Database } from '@/types/supabase';

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

export async function POST(request: NextRequest) {
  try {
    // Check rate limit
    const rateLimitResponse = await strictRateLimit.check(request);
    if (rateLimitResponse) return rateLimitResponse;

    try {
      // Initialize Supabase admin client
      const supabase = createAdminClient();
      
      // Validate request body
      const body = await request.json().catch(error => {
        logger.error('Failed to parse request body:', error);
        throw new AppError('Invalid request body', 400, 'INVALID_REQUEST');
      });

      console.log('Forecast request body:', JSON.stringify(body, null, 2).substring(0, 500) + '...');

      const { 
        timeframe = '3months',
        transactions: providedTransactions,
        recurring: recurringTransactions,
        settings: companySettings,
        userId  // Get userId directly from request body
      } = body;

      if (!['3months', '6months', '12months'].includes(timeframe)) {
        return NextResponse.json(
          { 
            success: false,
            error: 'Invalid timeframe specified' 
          },
          { status: 400 }
        );
      }

      // Check for user ID in various ways
      let effectiveUserId = userId;
      
      if (!effectiveUserId) {
        console.log('No user ID provided directly in request body, attempting to find in provided data');
        
        // Attempt to extract from provided data as fallback
        if (companySettings?.user_id) {
          console.log('Using user ID from company settings:', companySettings.user_id);
          effectiveUserId = companySettings.user_id;
        } else if (providedTransactions && providedTransactions.length > 0) {
          // Look through all transactions to find valid user_id
          for (const transaction of providedTransactions) {
            if (transaction.user_id) {
              console.log('Using user ID from transaction:', transaction.user_id);
              effectiveUserId = transaction.user_id;
              break;
            }
          }
        }
        
        // If still no user ID, return error
        if (!effectiveUserId) {
          console.log('Could not determine user ID from any source');
          return NextResponse.json(
            { 
              success: false,
              error: 'User ID is required and could not be determined from the provided data' 
            },
            { status: 400 }
          );
        }
      }

      console.log('Processing forecasting request for user:', effectiveUserId);

      // Use provided transactions or fetch from database
      let transactions = providedTransactions;
      let recurring = recurringTransactions;
      let settings = companySettings;

      if (!transactions || !recurring || !settings) {
        // Fetch company settings if not provided
        if (!settings) {
          // Log the lookup
          console.log(`Checking for company settings with user ID: ${effectiveUserId}`);
          const { data: settingsData, error: settingsError } = await supabase
            .from('company_settings')
            .select('*')
            .eq('user_id', effectiveUserId)
            .single();

          // Log the query result
          console.log(`Company settings query result:`, settingsData ? 'Found' : 'Not found', settingsError ? `Error: ${settingsError.message}` : 'No error');

          if (settingsError && settingsError.code !== 'PGRST116') { // Ignore "not found" errors
            logger.error('Error fetching company settings:', settingsError);
            return NextResponse.json(
              { 
                success: false,
                error: 'Failed to fetch company settings: ' + settingsError.message 
              },
              { status: 500 }
            );
          }
          
          if (!settingsData) {
            // Instead of returning 404, use default settings
            console.log('Company settings not found, using defaults');
            settings = {
              id: 'default',
              user_id: effectiveUserId,
              company_name: 'Your Company',
              address: '',
              country: 'US',
              default_currency: 'USD',
              fiscal_year_start: '01',
              industry: 'other',
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            };
          } else {
            settings = settingsData;
          }
        }

        // Calculate date range based on fiscal year
        const fiscalYearStart = settings?.fiscal_year_start || '01';
        const today = new Date();
        const startDate = new Date(today.getFullYear() - 1, parseInt(fiscalYearStart) - 1, 1);
        const endDate = new Date();

        // Fetch transactions if not provided
        if (!transactions) {
          console.log(`Fetching transactions for user ${effectiveUserId} from ${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`);
          
          try {
            const { data: fetchedTransactions, error: transactionsError } = await supabase
              .from('transactions')
              .select(`
                *,
                category:categories(id, name, type, color)
              `)
              .eq('user_id', effectiveUserId)
              .gte('date', startDate.toISOString().split('T')[0])
              .lte('date', endDate.toISOString().split('T')[0])
              .order('date', { ascending: true });

            if (transactionsError) {
              console.error('Error fetching transactions:', transactionsError);
              return NextResponse.json(
                { 
                  success: false,
                  error: 'Failed to fetch transactions: ' + transactionsError.message 
                },
                { status: 500 }
              );
            }
            
            console.log(`Fetched ${fetchedTransactions?.length || 0} transactions for user ${effectiveUserId}`);
            transactions = fetchedTransactions || [];
          } catch (error) {
            console.error('Exception fetching transactions:', error);
            return NextResponse.json(
              { 
                success: false,
                error: 'Error fetching transactions: ' + (error instanceof Error ? error.message : String(error))
              },
              { status: 500 }
            );
          }
        }

        // Fetch recurring transactions if not provided
        if (!recurring) {
          console.log(`Fetching recurring transactions for user ${effectiveUserId}`);
          
          try {
            const { data: fetchedRecurring, error: recurringError } = await supabase
              .from('recurring_transactions')
              .select(`
                *,
                category:categories(id, name, type, color)
              `)
              .eq('user_id', effectiveUserId)
              .eq('is_active', true);

            if (recurringError) {
              console.error('Error fetching recurring transactions:', recurringError);
              return NextResponse.json(
                { 
                  success: false,
                  error: 'Failed to fetch recurring transactions: ' + recurringError.message 
                },
                { status: 500 }
              );
            }
            
            console.log(`Fetched ${fetchedRecurring?.length || 0} recurring transactions for user ${effectiveUserId}`);
            recurring = fetchedRecurring || [];
          } catch (error) {
            console.error('Exception fetching recurring transactions:', error);
            return NextResponse.json(
              { 
                success: false,
                error: 'Error fetching recurring transactions: ' + (error instanceof Error ? error.message : String(error))
              },
              { status: 500 }
            );
          }
        }
      }

      // Check transactions
      if (!transactions || transactions.length === 0) {
        console.log(`No transactions available for user ${effectiveUserId}`);
        return NextResponse.json({
          success: true,
          data: {
            monthlyForecasts: [],
            categoryForecasts: [],
            upcomingExpenses: [],
            message: 'No historical data available for forecasting'
          }
        });
      }

      console.log(`Processing ${transactions.length} transactions for forecasting`);
      
      try {
        // Process transactions
        const monthlyData = generateMonthlyData(transactions, settings);
        const categoryForecasts = generateCategoryForecasts(transactions, timeframe, settings);
        const upcomingExpenses = generateUpcomingExpenses(recurring || [], timeframe, settings);

        logger.info('Forecasting completed', {
          userId: effectiveUserId,
          transactionsProcessed: transactions.length,
          monthlyDataPoints: monthlyData.length,
          categoryForecasts: categoryForecasts.length,
          upcomingExpenses: upcomingExpenses?.length || 0
        });

        // Return data in the format expected by the client
        return NextResponse.json({
          success: true,
          data: {
            monthlyForecasts: monthlyData,
            categoryForecasts: categoryForecasts,
            upcomingExpenses: upcomingExpenses || [],
            message: 'Forecasting completed successfully'
          }
        });
      } catch (processingError) {
        console.error('Error processing forecast data:', processingError);
        return NextResponse.json({
          success: false,
          error: 'Error processing forecast data: ' + (processingError instanceof Error ? processingError.message : 'Unknown error')
        }, { status: 500 });
      }
    } catch (error) {
      console.error('Error in forecasting:', error);
      logger.error('Error in forecasting:', error instanceof Error ? error : new Error('Unknown error'));
      return NextResponse.json(
        { 
          success: false,
          error: error instanceof Error ? error.message : 'Failed to process forecasting request'
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in forecasting outer try/catch:', error);
    logger.error('Error in forecasting:', error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to process forecasting request'
      },
      { status: 500 }
    );
  }
}

function generateMonthlyData(transactions: Transaction[], settings: CompanySettings) {
  try {
    console.log(`Processing ${transactions.length} transactions for monthly data`);
    console.log('Using currency from settings:', settings.default_currency);
    
    // Validate and normalize transactions
    const validTransactions = transactions
      .filter(t => t.date && !isNaN(Number(t.amount)))
      .map(t => ({
        ...t,
        amount: Number(t.amount),
        date: t.date.substring(0, 7) // YYYY-MM format
      }));
    
    console.log(`Found ${validTransactions.length} valid transactions out of ${transactions.length}`);
    
    if (validTransactions.length === 0) {
      console.log('No valid transactions for monthly data generation');
      return [];
    }
    
    // Group transactions by month
    const monthlyData = validTransactions.reduce((acc, transaction) => {
      const month = transaction.date;
      if (!acc[month]) {
        acc[month] = { income: 0, expenses: 0 };
      }
      
      if (transaction.type === 'income') {
        acc[month].income += transaction.amount;
      } else if (transaction.type === 'expense') {
        acc[month].expenses += transaction.amount;
      }
      
      return acc;
    }, {} as Record<string, { income: number; expenses: number }>);

    // Sort months chronologically
    const months = Object.keys(monthlyData).sort();
    console.log('Months with data:', months);
    
    if (months.length === 0) {
      console.log('No valid months after processing');
      return [];
    }
    
    // Calculate trends using the last 6 months (or all if less than 6)
    const recentMonths = months.slice(-Math.min(6, months.length));
    let avgIncomeChange = 0;
    let avgExpenseChange = 0;
    
    if (recentMonths.length > 1) {
      const changes = recentMonths.slice(1).map((month, index) => {
        const prevMonth = recentMonths[index];
        const prev = monthlyData[prevMonth];
        const curr = monthlyData[month];
        
        return {
          income: prev.income > 0 ? (curr.income - prev.income) / prev.income : 0,
          expenses: prev.expenses > 0 ? (curr.expenses - prev.expenses) / prev.expenses : 0
        };
      });
      
      const validChanges = changes.filter(c => !isNaN(c.income) && !isNaN(c.expenses));
      if (validChanges.length > 0) {
        avgIncomeChange = validChanges.reduce((sum, c) => sum + c.income, 0) / validChanges.length;
        avgExpenseChange = validChanges.reduce((sum, c) => sum + c.expenses, 0) / validChanges.length;
        
        // Cap extreme values at 30%
        avgIncomeChange = Math.max(-0.3, Math.min(0.3, avgIncomeChange));
        avgExpenseChange = Math.max(-0.3, Math.min(0.3, avgExpenseChange));
      }
    }
    
    console.log(`Average monthly changes: income ${(avgIncomeChange * 100).toFixed(2)}%, expenses ${(avgExpenseChange * 100).toFixed(2)}%`);

    // Generate result array with historical data
    const result = months.map(month => {
      const { income, expenses } = monthlyData[month];
      const [year, monthNum] = month.split('-');
      const date = new Date(parseInt(year), parseInt(monthNum) - 1);
      const formattedMonth = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
      
      return {
        month: formattedMonth,
        income: Math.round(income * 100) / 100,
        expenses: Math.round(expenses * 100) / 100,
        savings: Math.round((income - expenses) * 100) / 100,
        prediction: false,
        currency: settings.default_currency
      };
    });
    
    // Add forecast data
    if (months.length > 0) {
      const lastMonth = months[months.length - 1];
      const [lastYear, lastMonthNum] = lastMonth.split('-').map(Number);
      let lastIncome = monthlyData[lastMonth].income;
      let lastExpenses = monthlyData[lastMonth].expenses;
      
      for (let i = 1; i <= 3; i++) {
        let nextMonth = lastMonthNum + i;
        let nextYear = lastYear;
        
        if (nextMonth > 12) {
          nextMonth = nextMonth - 12;
          nextYear++;
        }
        
        const date = new Date(nextYear, nextMonth - 1);
        const formattedMonth = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        
        lastIncome = Math.round(lastIncome * (1 + avgIncomeChange));
        lastExpenses = Math.round(lastExpenses * (1 + avgExpenseChange));
        
        result.push({
          month: formattedMonth,
          income: lastIncome,
          expenses: lastExpenses,
          savings: lastIncome - lastExpenses,
          prediction: true,
          currency: settings.default_currency
        });
      }
    }
    
    console.log(`Generated monthly data: ${result.length} months (${months.length} historical, ${result.length - months.length} forecast)`);
    return result;
  } catch (error) {
    logger.error('Error generating monthly data', error instanceof Error ? error : new Error('Unknown error'));
    console.error('Error generating monthly data:', error);
    throw new AppError('Failed to generate monthly forecasts', 500, 'FORECAST_ERROR');
  }
}

function generateCategoryForecasts(transactions: Transaction[], timeframe: string, settings: CompanySettings) {
  try {
    // Add logging
    console.log(`Processing ${transactions.length} transactions for category forecasts`);
    console.log('Using currency from settings:', settings.default_currency);
    
    // First normalize and validate all transactions to ensure categories are properly formed
    const validTransactions = transactions.map(transaction => {
      // Skip non-expense transactions
      if (transaction.type !== 'expense') {
        return null;
      }
      
      // Ensure transaction has a valid category
      let category: { id: string, name: string, type: string, color: string };
      
      if (!transaction.category) {
        // Create default category if missing
        category = {
          id: 'uncategorized',
          name: 'Uncategorized',
          type: 'expense',
          color: '#888888'
        };
      } else if (typeof transaction.category === 'string') {
        // Handle string category (just ID)
        category = {
          id: transaction.category,
          name: 'Category ' + transaction.category.substring(0, 4),
          type: 'expense',
          color: '#888888'
        };
      } else if (typeof transaction.category === 'object') {
        // Ensure object has all required properties
        category = {
          id: transaction.category.id || 'uncategorized',
          name: transaction.category.name || 'Uncategorized',
          type: transaction.category.type || 'expense',
          color: transaction.category.color || '#888888'
        };
      } else {
        // Invalid category type, use default
        console.log(`Transaction ${transaction.id} has invalid category type: ${typeof transaction.category}`);
        category = {
          id: 'uncategorized',
          name: 'Uncategorized',
          type: 'expense',
          color: '#888888'
        };
      }
      
      // Return normalized transaction with amount as number
      return {
        ...transaction,
        category,
        amount: Number(transaction.amount)
      };
    }).filter(Boolean) as Transaction[];
    
    console.log(`After validation: ${validTransactions.length} valid expense transactions with categories`);
    
    // Group by category
    const categoryData: Record<string, {
      transactions: Transaction[];
      total: number;
      average: number;
      trend: number;
      name: string;
      color: string;
    }> = {};

    let processedCount = 0;
    let skippedCount = 0;

    // Process validated transactions
    validTransactions.forEach(transaction => {
      // Extract category information (now guaranteed to be an object)
      const category = transaction.category as { id: string; name: string; type: string; color: string };
      const categoryId = category.id;
      const categoryName = category.name;
      const categoryColor = category.color;

      // Initialize category data if not exists
      if (!categoryData[categoryId]) {
        categoryData[categoryId] = {
          transactions: [],
          total: 0,
          average: 0,
          trend: 0,
          name: categoryName,
          color: categoryColor
        };
      }

      // Add transaction to category data
      categoryData[categoryId].transactions.push(transaction);
      categoryData[categoryId].total += transaction.amount;
      processedCount++;
    });

    console.log(`Category data collected for ${Object.keys(categoryData).length} categories`);

    // Calculate forecasts for each category
    const forecasts = Object.entries(categoryData)
      .filter(([_, data]) => data.transactions.length > 0) // Only process categories with transactions
      .map(([categoryId, data]) => {
        try {
          const average = data.total / data.transactions.length;
          const sortedTransactions = data.transactions.sort((a, b) => 
            new Date(a.date).getTime() - new Date(b.date).getTime()
          );

          // Calculate trend
          let trend = 0;
          if (sortedTransactions.length > 1) {
            const firstHalf = sortedTransactions.slice(0, Math.floor(sortedTransactions.length / 2));
            const secondHalf = sortedTransactions.slice(Math.floor(sortedTransactions.length / 2));
            
            const firstHalfAvg = firstHalf.reduce((sum, t) => sum + t.amount, 0) / firstHalf.length;
            const secondHalfAvg = secondHalf.reduce((sum, t) => sum + t.amount, 0) / secondHalf.length;
            
            // Guard against division by zero
            trend = firstHalfAvg === 0 ? 0 : ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100;
          }

          // Format trend direction
          let trendDirection: "up" | "down" | "stable" = "stable";
          if (trend > 5) trendDirection = "up";
          if (trend < -5) trendDirection = "down";

          return {
            categoryId,
            category: data.name,
            color: data.color,
            current: Math.round(average * 100) / 100,
            forecast: Math.round((average * (1 + trend/100)) * 100) / 100,
            change: Math.round(trend),
            trend: trendDirection,
            confidence: calculateConfidence(data.transactions.length),
            currency: settings.default_currency
          };
        } catch (err) {
          console.error(`Error processing forecast for category ${categoryId}:`, err);
          return null;
        }
      })
      .filter(Boolean);

    console.log(`Category forecasts: processed ${processedCount} transactions, skipped ${skippedCount}`);
    console.log(`Generated ${forecasts.length} category forecasts`);

    return forecasts;
  } catch (error) {
    console.error('Error in generateCategoryForecasts:', error);
    logger.error('Error generating category forecasts', error instanceof Error ? error : new Error('Unknown error'));
    // Return empty array instead of throwing to avoid breaking the entire response
    return [];
  }
}

function calculateConfidence(sampleSize: number): number {
  // Enhanced confidence calculation based on sample size and data quality
  if (sampleSize < 3) return 0.3;
  if (sampleSize < 6) return 0.5;
  if (sampleSize < 12) return 0.7;
  if (sampleSize < 24) return 0.8;
  return 0.9;
}

function sanitizeTransactions(transactions: Transaction[]): Transaction[] {
  if (!transactions || !Array.isArray(transactions)) {
    console.log('No valid transactions array provided');
    return [];
  }
  
  // First pass: normalize the transactions to ensure consistent structure
  const normalizedTransactions = transactions.map(transaction => {
    if (!transaction) return null;
    
    // Ensure amount is a number
    const amount = typeof transaction.amount === 'string' 
      ? parseFloat(transaction.amount) 
      : (typeof transaction.amount === 'number' ? transaction.amount : 0);
    
    // Handle date format if needed
    const date = transaction.date && typeof transaction.date === 'string' 
      ? transaction.date 
      : null;
    
    // Normalize type
    const type = transaction.type && typeof transaction.type === 'string' 
      ? transaction.type.toLowerCase() 
      : 'expense';
    
    // Normalize category
    let category = transaction.category;
    
    // If category is missing or invalid, create a default one
    if (!category) {
      category = {
        id: 'uncategorized',
        name: 'Uncategorized',
        type: 'expense',
        color: '#888888'
      };
    } else if (typeof category === 'string') {
      // If category is a string (just ID), create a proper category object
      category = {
        id: category,
        name: 'Category ' + category.substring(0, 4),
        type: 'expense',
        color: '#888888'
      };
    } else if (typeof category === 'object') {
      // Ensure category object has all required fields
      if (!category.id) {
        category.id = 'uncategorized';
      }
      if (!category.name) {
        category.name = 'Uncategorized';
      }
      if (!category.type) {
        category.type = 'expense';
      }
      if (!category.color) {
        category.color = '#888888';
      }
    }
    
    return {
      ...transaction,
      amount,
      date,
      type,
      category
    };
  }).filter(Boolean) as Transaction[]; // Remove null entries
  
  // Second pass: validate the normalized transactions
  return normalizedTransactions.filter(transaction => {
    const isValid = validateTransaction(transaction);
    console.log(`Transaction ${transaction.id}: ${isValid ? 'valid' : 'invalid'}, amount: ${transaction.amount}, date: ${transaction.date}, type: ${transaction.type}, category: ${typeof transaction.category === 'object' ? transaction.category.id : 'invalid'}`);
    return isValid;
  });
}

function validateTransaction(transaction: Transaction): boolean {
  // Check basic transaction validity
  if (!transaction) {
    console.log('Skipping null transaction');
    return false;
  }
  
  // Validate transaction amount
  if (transaction.amount === undefined || transaction.amount === null || isNaN(Number(transaction.amount))) {
    console.log(`Skipping transaction ${transaction.id} with invalid amount: ${transaction.amount}`);
    return false;
  }

  // Validate transaction date
  if (!transaction.date || !transaction.date.match(/^\d{4}-\d{2}-\d{2}/)) {
    console.log(`Skipping transaction ${transaction.id} with invalid date: ${transaction.date}`);
    return false;
  }

  // Validate transaction type
  if (!transaction.type || !['income', 'expense'].includes(transaction.type)) {
    console.log(`Skipping transaction ${transaction.id} with invalid type: ${transaction.type}`);
    return false;
  }

  // Always return true since categories are already normalized in sanitizeTransactions
  return true;
}

function generateUpcomingExpenses(recurringTransactions: any[], timeframe: string, settings: CompanySettings) {
  try {
    if (!recurringTransactions || recurringTransactions.length === 0) {
      return [];
    }

    console.log('Using currency from settings:', settings.default_currency);

    const today = new Date();
    const endDate = new Date();
    const months = timeframe === '3months' ? 3 : timeframe === '6months' ? 6 : 12;
    endDate.setMonth(endDate.getMonth() + months);

    const upcomingExpenses: any[] = [];

    recurringTransactions.forEach(recurring => {
      const frequency = recurring.frequency || 'monthly';
      const startDate = new Date(recurring.start_date);
      let nextDate = new Date(startDate);

      // Adjust nextDate to the next occurrence after today
      while (nextDate < today) {
        if (frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      }

      // Add all occurrences until endDate
      while (nextDate <= endDate) {
        upcomingExpenses.push({
          id: `${recurring.id}-${nextDate.toISOString()}`,
          description: recurring.description,
          amount: Number(recurring.amount),
          date: nextDate.toISOString().split('T')[0],
          category: recurring.category?.name || 'Uncategorized',
          categoryColor: recurring.category?.color || '#888888',
          frequency,
          currency: settings.default_currency
        });

        if (frequency === 'weekly') {
          nextDate.setDate(nextDate.getDate() + 7);
        } else if (frequency === 'monthly') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else if (frequency === 'yearly') {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
      }
    });

    return upcomingExpenses.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  } catch (error) {
    logger.error('Error generating upcoming expenses', error instanceof Error ? error : new Error('Unknown error'));
    throw new AppError('Failed to generate upcoming expenses', 500, 'FORECAST_ERROR');
  }
}