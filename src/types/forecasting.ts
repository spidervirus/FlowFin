import { CurrencyCode } from "@/lib/utils";

export interface MonthlyData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  isProjected: boolean;
  currency?: CurrencyCode;
}

export interface CategoryForecast {
  category_id: string;
  category_name: string;
  category_color: string;
  current_amount: number;
  forecast_amount: number;
  percentage_change: number;
  trend_direction: "up" | "down" | "stable";
}

export interface UpcomingExpense {
  id: string;
  description: string;
  amount: number;
  due_date: string;
  category_name: string;
  category_color: string;
} 