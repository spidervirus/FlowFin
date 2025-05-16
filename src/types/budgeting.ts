import { CurrencyCode } from "@/lib/utils";

export interface BudgetInsight {
  id: string;
  type: "income" | "overspending" | "savings" | "trend";
  title: string;
  description: string;
  amount: number;
  changePercentage: number;
  isPositive: boolean;
  category?: string;
  categoryColor?: string;
}

export interface BudgetRecommendation {
  id: string;
  title: string;
  description: string;
  difficulty: "easy" | "medium" | "hard";
  impact: number;
  category?: string;
  categoryColor?: string;
}

export interface CategoryTrend {
  name: string;
  values: number[];
  color: string;
}

export interface MonthlyTrendsData {
  months: string[];
  income: number[];
  expenses: number[];
  savings: number[];
  categories: CategoryTrend[];
} 