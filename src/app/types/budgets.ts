export type RecurrencePeriod = "daily" | "weekly" | "monthly" | "yearly";

export interface Budget {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  start_date: string;
  end_date: string;
  is_recurring: boolean;
  recurrence_period: RecurrencePeriod;
  is_active: boolean;
  amount: number;
  created_at: string;
  updated_at: string;
}
