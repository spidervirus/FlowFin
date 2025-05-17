import type { Database } from "@/types/supabase";

type Tables = Database["public"]["Tables"];

// Base types from database
export type PayrollSettings = Tables["payroll_settings"]["Row"] & {
  holiday_pay_rate?: number;
  sick_leave_accrual_rate?: number;
  vacation_leave_accrual_rate?: number;
  enable_holiday_pay?: boolean;
  enable_sick_leave?: boolean;
  enable_vacation_leave?: boolean;
  enable_401k?: boolean;
  default_401k_contribution?: number;
  enable_health_insurance?: boolean;
  default_health_insurance_deduction?: number;
};
export type PayRun = Tables["pay_runs"]["Row"];
export type Employee = Tables["employees"]["Row"];
export type CompanySettings = Tables["company_settings"]["Row"];
export type PayrollPeriod = Tables["payroll_periods"]["Row"];
export type Payslip = Tables["payslips"]["Row"];
export type PayslipItem = Tables["payslip_items"]["Row"];

// Extended types for specific use cases
export interface PayRunSummary {
  total_pay_runs: number;
  total_employees: number;
  total_gross_pay: number;
  total_deductions: number;
  total_net_pay: number;
  average_net_pay: number;
}

export interface NewPayRun {
  period_start: string;
  period_end: string;
  payment_date: string;
}

export interface DeductionDetail {
  id: string;
  type: "tax" | "insurance" | "loan" | "advance" | "other";
  description: string;
  amount: number;
}

export type PayRunEmployee = Tables["pay_run_employees"]["Row"] & {
  employee?: Employee;
  deduction_details: Tables["pay_run_deductions"]["Row"][];
};

// Time tracking types
export type TimeEntry = Tables["timesheet_entries"]["Row"] & {
  employee?: Employee;
};

export type WeeklySummary = {
  total_hours: number;
  overtime_hours: number;
  break_minutes: number;
  days_worked: number;
  average_hours_per_day: number;
};

// Attendance types
export type AttendanceStatus = "present" | "absent" | "late" | "half_day";

export type AttendanceRecord = Tables["attendance"]["Row"] & {
  employee?: Employee;
};

// Leave types
export type LeaveType = "annual" | "sick" | "unpaid" | "other";

export type LeaveRequest = Tables["leave_requests"]["Row"] & {
  employee?: Employee;
};

export type LeaveBalance = {
  annual: number;
  sick: number;
  unpaid: number;
};

// Common types
export type PayRunStatus = "draft" | "processing" | "completed" | "cancelled";
export type PaySchedule = "weekly" | "bi_weekly" | "monthly";

export type Timesheet = {
  id: string;
  user_id: string;
  employee_id: string;
  week_start: string;
  week_end: string;
  status: "draft" | "submitted" | "approved" | "rejected";
  total_hours: number;
  overtime_hours: number;
  regular_hours: number;
  created_at: string;
  updated_at: string;
  employee: Employee;
  entries: TimesheetEntry[];
};

export type TimesheetEntry = {
  id: string;
  timesheet_id: string;
  date: string;
  hours: number;
  overtime_hours: number;
  description: string;
  project: string | null;
  task: string | null;
  created_at: string;
  updated_at: string;
};

export type TimesheetSummary = {
  total_timesheets: number;
  total_hours: number;
  total_overtime: number;
  total_regular: number;
  average_hours_per_week: number;
};