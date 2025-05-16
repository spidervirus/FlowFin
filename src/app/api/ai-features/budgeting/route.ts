import { NextRequest, NextResponse } from "next/server";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { createClient } from "@supabase/supabase-js";
import { CurrencyCode } from "@/lib/utils";

// Company settings interface
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

// Supabase service role client for admin operations
const adminClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json();
    const { userId, transactions = [] } = requestBody;

    console.log("Budget analysis request received");

    // Authenticate user from cookie
    const supabase = createRouteHandlerClient({ cookies });
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      console.error("[Budget API] Session error:", sessionError.message);
      return NextResponse.json(
        {
          success: false,
          error: "Authentication error. Please sign in again.",
        },
        { status: 401 },
      );
    }

    // Determine user ID from auth or request
    const effectiveUserId = session?.user?.id || userId;

    if (!effectiveUserId) {
      console.error("[Budget API] No user ID provided");
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required. Please sign in.",
        },
        { status: 401 },
      );
    }

    console.log("[Budget API] Processing request for user:", effectiveUserId);

    // Get company settings
    let companySettings: CompanySettings | null = null;
    try {
      // Attempt to get settings with admin client for reliability
      const { data: settingsData, error: settingsError } = await adminClient
        .from("company_settings")
        .select("*")
        .eq("user_id", effectiveUserId)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error(
          "[Budget API] Error fetching company settings:",
          settingsError,
        );
      } else if (settingsData) {
        companySettings = settingsData;
        console.log(
          "[Budget API] Found company settings for:",
          settingsData.company_name,
        );
      }
    } catch (err) {
      console.error("[Budget API] Error in company settings query:", err);
    }

    // If no settings found, use defaults
    if (!companySettings) {
      companySettings = {
        id: "default",
        user_id: effectiveUserId,
        company_name: "Your Company",
        address: "",
        country: "US",
        default_currency: "USD",
        fiscal_year_start: "01",
        industry: "other",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }

    // Fetch transactions if not provided
    let effectiveTransactions = transactions;
    if (transactions.length === 0) {
      try {
        const { data: transactionsData, error: transactionsError } =
          await adminClient
            .from("transactions")
            .select(
              `
            *,
            category:categories(id, name, type, color)
          `,
            )
            .eq("user_id", effectiveUserId)
            .order("date", { ascending: false });

        if (transactionsError) {
          console.error(
            "[Budget API] Error fetching transactions:",
            transactionsError,
          );
          return NextResponse.json(
            {
              success: false,
              error: "Failed to fetch transaction data",
            },
            { status: 500 },
          );
        }

        effectiveTransactions = transactionsData || [];
      } catch (err) {
        console.error("[Budget API] Error in transactions query:", err);
        return NextResponse.json(
          {
            success: false,
            error:
              "An unexpected error occurred while fetching transaction data",
          },
          { status: 500 },
        );
      }
    }

    // Filter out any transactions that don't belong to this user (security measure)
    effectiveTransactions = effectiveTransactions.filter(
      (t: any) => t.user_id === effectiveUserId || !t.user_id,
    );

    // Validate we have enough data to generate insights
    if (effectiveTransactions.length === 0) {
      return NextResponse.json({
        success: true,
        data: {
          budgetInsights: [],
          monthlyTrends: {
            months: [],
            income: [],
            expenses: [],
            savings: [],
            categories: [],
          },
          recommendations: [],
        },
        message: "No transaction data available to generate insights",
      });
    }

    console.log(
      `[Budget API] Analyzing ${effectiveTransactions.length} transactions`,
    );

    // Process data to generate budget insights
    // This could be extended with actual ML/AI processing in the future
    const budgetInsights = generateBudgetInsights(
      effectiveTransactions,
      companySettings,
    );
    const monthlyTrends = generateMonthlyTrends(
      effectiveTransactions,
      companySettings,
    );
    const recommendations = generateRecommendations(
      effectiveTransactions,
      companySettings,
    );

    return NextResponse.json({
      success: true,
      data: {
        budgetInsights,
        monthlyTrends,
        recommendations,
      },
    });
  } catch (error) {
    console.error("[Budget API] Unhandled error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "An unexpected error occurred while processing your request",
      },
      { status: 500 },
    );
  }
}

function generateBudgetInsights(
  transactions: any[],
  settings: CompanySettings,
) {
  try {
    // Extract and organize categories
    const categoryMap = new Map();
    transactions.forEach((t) => {
      if (t.category) {
        categoryMap.set(t.category.id, {
          name: t.category.name,
          color: t.category.color,
        });
      }
    });

    // Get current month transactions
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const currentMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return (
        date.getMonth() === currentMonth && date.getFullYear() === currentYear
      );
    });

    // Get previous month transactions
    const prevMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const prevYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const prevMonthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date.getMonth() === prevMonth && date.getFullYear() === prevYear;
    });

    // Calculate total income and expenses
    const currentIncome = currentMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const currentExpenses = currentMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const prevIncome = prevMonthTransactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const prevExpenses = prevMonthTransactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    // Generate insights array
    const insights = [];

    // Income insight
    if (currentIncome > 0) {
      const incomeChange =
        prevIncome > 0 ? ((currentIncome - prevIncome) / prevIncome) * 100 : 0;

      insights.push({
        id: "income-overview",
        title: "Monthly Income",
        description: `Your income ${
          Math.abs(incomeChange) > 1
            ? (incomeChange > 0 ? "increased" : "decreased") +
              ` by ${Math.abs(incomeChange).toFixed(1)}%`
            : "remained stable"
        } compared to last month.`,
        amount: currentIncome,
        changePercentage: incomeChange,
        isPositive: incomeChange >= 0,
        type: "income",
      });
    }

    // Expenses insight
    if (currentExpenses > 0) {
      const expenseChange =
        prevExpenses > 0
          ? ((currentExpenses - prevExpenses) / prevExpenses) * 100
          : 0;

      insights.push({
        id: "expense-overview",
        title: "Monthly Expenses",
        description: `Your expenses ${
          Math.abs(expenseChange) > 1
            ? (expenseChange > 0 ? "increased" : "decreased") +
              ` by ${Math.abs(expenseChange).toFixed(1)}%`
            : "remained stable"
        } compared to last month.`,
        amount: currentExpenses,
        changePercentage: expenseChange,
        isPositive: expenseChange <= 0,
        type: "overspending",
      });
    }

    // Savings insight
    const currentSavings = currentIncome - currentExpenses;

    if (currentIncome > 0) {
      const savingsRate = (currentSavings / currentIncome) * 100;

      insights.push({
        id: "savings-rate",
        title: "Savings Rate",
        description: `You're currently saving ${savingsRate.toFixed(1)}% of your income.`,
        amount: currentSavings,
        changePercentage: savingsRate,
        isPositive: savingsRate > 0,
        type: "savings",
      });
    }

    // Top spending category insight
    const categoryExpenses = new Map();

    currentMonthTransactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const categoryId = t.category?.id || t.category_id;
        if (categoryId) {
          const currentAmount = categoryExpenses.get(categoryId) || 0;
          categoryExpenses.set(categoryId, currentAmount + t.amount);
        }
      });

    if (categoryExpenses.size > 0) {
      let topCategoryId = "";
      let topAmount = 0;

      categoryExpenses.forEach((amount, categoryId) => {
        if (amount > topAmount) {
          topAmount = amount;
          topCategoryId = categoryId;
        }
      });

      const categoryInfo = categoryMap.get(topCategoryId);

      if (categoryInfo) {
        insights.push({
          id: "top-category",
          title: "Top Spending Category",
          description: `${categoryInfo.name} is your highest expense category this month.`,
          amount: topAmount,
          changePercentage: (topAmount / currentExpenses) * 100,
          isPositive: false,
          type: "trend",
          category: categoryInfo.name,
          categoryColor: categoryInfo.color,
        });
      }
    }

    return insights;
  } catch (err) {
    console.error("Error generating budget insights:", err);
    return [];
  }
}

function generateMonthlyTrends(transactions: any[], settings: CompanySettings) {
  try {
    // Extract and organize categories
    const categoryMap = new Map();
    transactions.forEach((t) => {
      if (t.category) {
        categoryMap.set(t.category.id, {
          name: t.category.name,
          color: t.category.color,
        });
      }
    });

    // Get data for the last 6 months
    const now = new Date();
    const months = [];
    const income = [];
    const expenses = [];
    const savings = [];

    // Create a map of category data
    const categoryData = new Map();
    Array.from(categoryMap.values()).forEach((cat) => {
      categoryData.set(cat.name, {
        name: cat.name,
        color: cat.color,
        values: Array(6).fill(0),
      });
    });

    // Add "Uncategorized" for transactions without categories
    categoryData.set("Uncategorized", {
      name: "Uncategorized",
      color: "#888888",
      values: Array(6).fill(0),
    });

    // Process last 6 months
    for (let i = 0; i < 6; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = date.toLocaleString("default", { month: "short" });
      const year = date.getFullYear();
      months.unshift(`${monthName} ${year}`);

      const monthTransactions = transactions.filter((t) => {
        const tDate = new Date(t.date);
        return (
          tDate.getMonth() === date.getMonth() &&
          tDate.getFullYear() === date.getFullYear()
        );
      });

      const monthIncome = monthTransactions
        .filter((t) => t.type === "income")
        .reduce((sum, t) => sum + t.amount, 0);

      const monthExpenses = monthTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0);

      income.unshift(monthIncome);
      expenses.unshift(monthExpenses);
      savings.unshift(monthIncome - monthExpenses);

      // Process category expenses
      monthTransactions
        .filter((t) => t.type === "expense")
        .forEach((t) => {
          let catName = "Uncategorized";
          const catId = t.category?.id || t.category_id;

          if (catId && categoryMap.has(catId)) {
            catName = categoryMap.get(catId).name;
          }

          if (categoryData.has(catName)) {
            const cat = categoryData.get(catName);
            cat.values[i] += t.amount;
          }
        });
    }

    // Convert category map to array
    const categoryArray = Array.from(categoryData.values())
      .filter((cat) => cat.values.some((v: number) => v > 0)) // Only include categories with data
      .map((cat) => ({
        name: cat.name,
        color: cat.color,
        values: cat.values.reverse(), // Reverse to match months order
      }));

    return {
      months,
      income,
      expenses,
      savings,
      categories: categoryArray,
    };
  } catch (err) {
    console.error("Error generating monthly trends:", err);
    return {
      months: [],
      income: [],
      expenses: [],
      savings: [],
      categories: [],
    };
  }
}

function generateRecommendations(
  transactions: any[],
  settings: CompanySettings,
) {
  try {
    const recs = [];

    // Extract and organize categories
    const categoryMap = new Map();
    transactions.forEach((t) => {
      if (t.category) {
        categoryMap.set(t.category.id, {
          name: t.category.name,
          color: t.category.color,
        });
      }
    });

    // Calculate savings rate
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = transactions
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;

    // Add savings recommendation if rate is low
    if (savingsRate < 20) {
      recs.push({
        id: "increase-savings",
        title: "Increase Your Savings Rate",
        description: `Your current savings rate is ${savingsRate.toFixed(1)}%. Aim to save at least 20% of your income.`,
        impact: 800,
        difficulty: "medium",
      });
    }

    // Find categories with consistent high spending
    const categoryTotals = new Map();

    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const categoryId = t.category?.id || t.category_id;

        if (categoryId) {
          const current = categoryTotals.get(categoryId) || 0;
          categoryTotals.set(categoryId, current + t.amount);
        }
      });

    // Convert to array and sort by amount
    const sortedCategories = Array.from(categoryTotals.entries())
      .map(([id, total]) => ({
        id,
        ...(categoryMap.get(id) || { name: "Uncategorized", color: "#888888" }),
        total,
      }))
      .filter((cat) => cat.name) // Ensure category exists
      .sort((a, b) => b.total - a.total);

    // Add recommendations for top spending categories
    sortedCategories.slice(0, 2).forEach((cat) => {
      recs.push({
        id: `reduce-${cat.id}`,
        title: `Reduce ${cat.name} Expenses`,
        description: `This category represents a significant portion of your spending. Consider ways to reduce costs.`,
        impact: Math.round(cat.total * 0.1), // 10% of total as potential savings
        difficulty: "medium",
        category: cat.name,
        categoryColor: cat.color,
      });
    });

    // Add emergency fund recommendation if income is substantial
    if (income > 5000) {
      recs.push({
        id: "emergency-fund",
        title: "Build Emergency Fund",
        description:
          "Aim to have 3-6 months of expenses saved in an emergency fund.",
        impact: 1000,
        difficulty: "hard",
      });
    }

    // Check for potential debt recommendation
    if (income < expenses) {
      recs.push({
        id: "reduce-debt",
        title: "Address Negative Cash Flow",
        description:
          "Your expenses exceed your income. Consider reducing non-essential expenses or finding additional income sources.",
        impact: expenses - income,
        difficulty: "hard",
      });
    }

    return recs;
  } catch (err) {
    console.error("Error generating recommendations:", err);
    return [];
  }
}
