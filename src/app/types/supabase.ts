import { CurrencyCode } from "@/lib/utils";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
}

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          created_at: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
          user_id: string | null;
          image: string | null;
          credits: string | null;
          token_identifier: string | null;
          subscription: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          user_id?: string | null;
          image?: string | null;
          credits?: string | null;
          token_identifier?: string | null;
          subscription?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
          user_id?: string | null;
          image?: string | null;
          credits?: string | null;
          token_identifier?: string | null;
          subscription?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          job_title: string | null;
          phone: string | null;
          department: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          job_title?: string | null;
          phone?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          job_title?: string | null;
          phone?: string | null;
          department?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey";
            columns: ["id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      user_profiles_backup: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          full_name: string | null;
          token_identifier: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name?: string | null;
          full_name?: string | null;
          token_identifier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          full_name?: string | null;
          token_identifier?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      company_settings: {
        Row: {
          id: string;
          user_id: string;
          company_name: string | null;
          default_currency: string;
          fiscal_year_start: string;
          tax_year_start: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          company_name?: string | null;
          default_currency?: string;
          fiscal_year_start: string;
          tax_year_start?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          company_name?: string | null;
          default_currency?: string;
          fiscal_year_start?: string;
          tax_year_start?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "user_profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: "income" | "expense";
          color: string | null;
          parent_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
          is_default: boolean;
        };
        Insert: {
          id?: string;
          name: string;
          type: "income" | "expense";
          color?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id: string;
          is_default?: boolean;
        };
        Update: {
          id?: string;
          name?: string;
          type?: "income" | "expense";
          color?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
          is_default?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "categories_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          date: string;
          description: string;
          amount: number;
          type: "income" | "expense" | "transfer";
          category_id: string;
          status: "pending" | "completed" | "cancelled";
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          date: string;
          description: string;
          amount: number;
          type: "income" | "expense" | "transfer";
          category_id: string;
          status?: "pending" | "completed" | "cancelled";
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          date?: string;
          description?: string;
          amount?: number;
          type?: "income" | "expense" | "transfer";
          category_id?: string;
          status?: "pending" | "completed" | "cancelled";
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      recurring_transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          description: string;
          amount: number;
          type: "income" | "expense" | "transfer";
          category_id: string;
          frequency: "daily" | "weekly" | "monthly" | "yearly";
          start_date: string;
          end_date: string | null;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          description: string;
          amount: number;
          type: "income" | "expense" | "transfer";
          category_id: string;
          frequency: "daily" | "weekly" | "monthly" | "yearly";
          start_date: string;
          end_date?: string | null;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          description?: string;
          amount?: number;
          type?: "income" | "expense" | "transfer";
          category_id?: string;
          frequency?: "daily" | "weekly" | "monthly" | "yearly";
          start_date?: string;
          end_date?: string | null;
          is_active?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: "recurring_transactions_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recurring_transactions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          size: string | null;
          address: string | null;
          phone: string | null;
          website: string | null;
          tax_id: string | null;
          fiscal_year_start: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          size?: string | null;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          tax_id?: string | null;
          fiscal_year_start?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string | null;
          size?: string | null;
          address?: string | null;
          phone?: string | null;
          website?: string | null;
          tax_id?: string | null;
          fiscal_year_start?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_users: {
        Row: {
          organization_id: string;
          user_id: string;
          role_id: string | null;
          status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          organization_id: string;
          user_id: string;
          role_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          organization_id?: string;
          user_id?: string;
          role_id?: string | null;
          status?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_users_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_users_role_id_fkey";
            columns: ["role_id"];
            referencedRelation: "roles";
            referencedColumns: ["id"];
          },
        ];
      };
      roles: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          organization_id: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          organization_id: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          organization_id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      employees: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          position: string;
          department: string;
          hire_date: string;
          salary: number;
          status: "active" | "inactive" | "terminated";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone?: string | null;
          position: string;
          department: string;
          hire_date: string;
          salary: number;
          status?: "active" | "inactive" | "terminated";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          first_name?: string;
          last_name?: string;
          email?: string;
          phone?: string | null;
          position?: string;
          department?: string;
          hire_date?: string;
          salary?: number;
          status?: "active" | "inactive" | "terminated";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "employees_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      attendance: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          date: string;
          check_in: string;
          check_out: string | null;
          status: "present" | "absent" | "late" | "half_day";
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          date: string;
          check_in: string;
          check_out?: string | null;
          status?: "present" | "absent" | "late" | "half_day";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          date?: string;
          check_in?: string;
          check_out?: string | null;
          status?: "present" | "absent" | "late" | "half_day";
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attendance_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          }
        ];
      };
      payroll_settings: {
        Row: {
          id: string;
          user_id: string;
          pay_schedule: "weekly" | "bi_weekly" | "monthly";
          pay_day: number;
          tax_rate: number;
          overtime_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pay_schedule: "weekly" | "bi_weekly" | "monthly";
          pay_day: number;
          tax_rate: number;
          overtime_rate: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pay_schedule?: "weekly" | "bi_weekly" | "monthly";
          pay_day?: number;
          tax_rate?: number;
          overtime_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      pay_runs: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          payment_date: string;
          status: "draft" | "processing" | "completed" | "cancelled";
          total_gross_pay: number;
          total_deductions: number;
          total_net_pay: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          period_start: string;
          period_end: string;
          payment_date: string;
          status?: "draft" | "processing" | "completed" | "cancelled";
          total_gross_pay?: number;
          total_deductions?: number;
          total_net_pay?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          period_start?: string;
          period_end?: string;
          payment_date?: string;
          status?: "draft" | "processing" | "completed" | "cancelled";
          total_gross_pay?: number;
          total_deductions?: number;
          total_net_pay?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pay_runs_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payroll_periods: {
        Row: {
          id: string;
          user_id: string;
          start_date: string;
          end_date: string;
          status: "open" | "closed" | "processing";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          status?: "open" | "closed" | "processing";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          end_date?: string;
          status?: "open" | "closed" | "processing";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payroll_periods_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payslips: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          period_id: string;
          gross_pay: number;
          deductions: number;
          net_pay: number;
          status: "draft" | "approved" | "paid";
          payment_date: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          period_id: string;
          gross_pay: number;
          deductions: number;
          net_pay: number;
          status?: "draft" | "approved" | "paid";
          payment_date: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          period_id?: string;
          gross_pay?: number;
          deductions?: number;
          net_pay?: number;
          status?: "draft" | "approved" | "paid";
          payment_date?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payslips_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payslips_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payslips_period_id_fkey";
            columns: ["period_id"];
            referencedRelation: "payroll_periods";
            referencedColumns: ["id"];
          }
        ];
      };
      payslip_items: {
        Row: {
          id: string;
          payslip_id: string;
          type: "earnings" | "deductions";
          description: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          payslip_id: string;
          type: "earnings" | "deductions";
          description: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          payslip_id?: string;
          type?: "earnings" | "deductions";
          description?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payslip_items_payslip_id_fkey";
            columns: ["payslip_id"];
            referencedRelation: "payslips";
            referencedColumns: ["id"];
          }
        ];
      };
      pay_run_employees: {
        Row: {
          id: string;
          pay_run_id: string;
          employee_id: string;
          gross_pay: number;
          deductions: number;
          net_pay: number;
          status: "pending" | "approved" | "paid";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pay_run_id: string;
          employee_id: string;
          gross_pay: number;
          deductions: number;
          net_pay: number;
          status?: "pending" | "approved" | "paid";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pay_run_id?: string;
          employee_id?: string;
          gross_pay?: number;
          deductions?: number;
          net_pay?: number;
          status?: "pending" | "approved" | "paid";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pay_run_employees_pay_run_id_fkey";
            columns: ["pay_run_id"];
            referencedRelation: "pay_runs";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pay_run_employees_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          }
        ];
      };
      pay_run_deductions: {
        Row: {
          id: string;
          pay_run_employee_id: string;
          type: "tax" | "insurance" | "loan" | "advance" | "other";
          description: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          pay_run_employee_id: string;
          type: "tax" | "insurance" | "loan" | "advance" | "other";
          description: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          pay_run_employee_id?: string;
          type?: "tax" | "insurance" | "loan" | "advance" | "other";
          description?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pay_run_deductions_pay_run_employee_id_fkey";
            columns: ["pay_run_employee_id"];
            referencedRelation: "pay_run_employees";
            referencedColumns: ["id"];
          }
        ];
      };
      time_entries: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          date: string;
          start_time: string;
          end_time: string | null;
          break_minutes: number;
          notes: string | null;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          date: string;
          start_time: string;
          end_time?: string | null;
          break_minutes?: number;
          notes?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          date?: string;
          start_time?: string;
          end_time?: string | null;
          break_minutes?: number;
          notes?: string | null;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_entries_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          }
        ];
      };
      timesheets: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          period_start: string;
          period_end: string;
          status: "draft" | "submitted" | "approved" | "rejected";
          total_hours: number;
          overtime_hours: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          period_start: string;
          period_end: string;
          status?: "draft" | "submitted" | "approved" | "rejected";
          total_hours?: number;
          overtime_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          period_start?: string;
          period_end?: string;
          status?: "draft" | "submitted" | "approved" | "rejected";
          total_hours?: number;
          overtime_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timesheets_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          }
        ];
      };
      timesheet_entries: {
        Row: {
          id: string;
          timesheet_id: string;
          date: string;
          hours_worked: number;
          overtime_hours: number;
          break_minutes: number;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          timesheet_id: string;
          date: string;
          hours_worked: number;
          overtime_hours?: number;
          break_minutes?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          timesheet_id?: string;
          date?: string;
          hours_worked?: number;
          overtime_hours?: number;
          break_minutes?: number;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_timesheet_id_fkey";
            columns: ["timesheet_id"];
            referencedRelation: "timesheets";
            referencedColumns: ["id"];
          }
        ];
      };
      leave_requests: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          type: "annual" | "sick" | "unpaid" | "other";
          start_date: string;
          end_date: string;
          status: "pending" | "approved" | "rejected";
          reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          type: "annual" | "sick" | "unpaid" | "other";
          start_date: string;
          end_date: string;
          status?: "pending" | "approved" | "rejected";
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          type?: "annual" | "sick" | "unpaid" | "other";
          start_date?: string;
          end_date?: string;
          status?: "pending" | "approved" | "rejected";
          reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          }
        ];
      };
      accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: "savings" | "checking" | "credit" | "investment" | "cash";
          balance: number;
          previous_balance: number;
          currency: CurrencyCode;
          is_active: boolean;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: "savings" | "checking" | "credit" | "investment" | "cash";
          balance: number;
          previous_balance?: number;
          currency: CurrencyCode;
          is_active?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          type?: "savings" | "checking" | "credit" | "investment" | "cash";
          balance?: number;
          previous_balance?: number;
          currency?: CurrencyCode;
          is_active?: boolean;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "accounts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          job_title: string | null;
          phone: string | null;
          department: string | null;
          role: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          job_title?: string | null;
          phone?: string | null;
          department?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          job_title?: string | null;
          phone?: string | null;
          department?: string | null;
          role?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      budgets: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          start_date: string;
          end_date: string;
          is_recurring: boolean;
          recurrence_period: "daily" | "weekly" | "monthly" | "yearly";
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          start_date: string;
          end_date: string;
          is_recurring?: boolean;
          recurrence_period?: "daily" | "weekly" | "monthly" | "yearly";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          start_date?: string;
          end_date?: string;
          is_recurring?: boolean;
          recurrence_period?: "daily" | "weekly" | "monthly" | "yearly";
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budgets_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      budget_tracking: {
        Row: {
          id: string;
          user_id: string;
          budget_id: string;
          amount: number;
          spent: number;
          remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          budget_id: string;
          amount: number;
          spent: number;
          remaining: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          budget_id?: string;
          amount?: number;
          spent?: number;
          remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_tracking_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_tracking_budget_id_fkey";
            columns: ["budget_id"];
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
        ];
      };
      financial_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          description: string | null;
          target_amount: number;
          current_amount: number;
          start_date: string;
          target_date: string;
          is_completed: boolean;
          is_active: boolean;
          created_at: string;
          updated_at: string;
          category_id: string | null;
          icon: string | null;
          color: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          description?: string | null;
          target_amount: number;
          current_amount?: number;
          start_date: string;
          target_date: string;
          is_completed?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          category_id?: string | null;
          icon?: string | null;
          color?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          description?: string | null;
          target_amount?: number;
          current_amount?: number;
          start_date?: string;
          target_date?: string;
          is_completed?: boolean;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
          category_id?: string | null;
          icon?: string | null;
          color?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "financial_goals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "financial_goals_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          }
        ];
      };
      budget_categories: {
        Row: {
          id: string;
          budget_id: string;
          category_id: string;
          amount: number;
          spent: number;
          remaining: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category_id: string;
          amount: number;
          spent?: number;
          remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          category_id?: string;
          amount?: number;
          spent?: number;
          remaining?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey";
            columns: ["budget_id"];
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      chart_of_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          code: string;
          type: "asset" | "liability" | "equity" | "revenue" | "expense";
          description: string | null;
          parent_id: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          code: string;
          type: "asset" | "liability" | "equity" | "revenue" | "expense";
          description?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          code?: string;
          type?: "asset" | "liability" | "equity" | "revenue" | "expense";
          description?: string | null;
          parent_id?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey";
            columns: ["parent_id"];
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      goal_contributions: {
        Row: {
          id: string;
          goal_id: string;
          amount: number;
          date: string;
          notes: string | null;
          transaction_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          goal_id: string;
          amount: number;
          date: string;
          notes?: string | null;
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          goal_id?: string;
          amount?: number;
          date?: string;
          notes?: string | null;
          transaction_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey";
            columns: ["goal_id"];
            referencedRelation: "financial_goals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "goal_contributions_transaction_id_fkey";
            columns: ["transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      manual_journals: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          description: string;
          reference_number: string;
          status: "draft" | "posted" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          description: string;
          reference_number: string;
          status?: "draft" | "posted" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          description?: string;
          reference_number?: string;
          status?: "draft" | "posted" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manual_journals_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      manual_journal_entries: {
        Row: {
          id: string;
          journal_id: string;
          account_id: string;
          description: string | null;
          debit_amount: number;
          credit_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          journal_id: string;
          account_id: string;
          description?: string | null;
          debit_amount: number;
          credit_amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          journal_id?: string;
          account_id?: string;
          description?: string | null;
          debit_amount?: number;
          credit_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "manual_journal_entries_journal_id_fkey";
            columns: ["journal_id"];
            referencedRelation: "manual_journals";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "manual_journal_entries_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "chart_of_accounts";
            referencedColumns: ["id"];
          }
        ];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          invoice_number: string;
          date: string;
          due_date: string;
          client_name: string;
          client_email: string;
          client_address: string;
          items: InvoiceItem[];
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          status: "draft" | "sent" | "paid" | "overdue" | "cancelled";
          payment_date: string | null;
          notes: string | null;
          payment_terms: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          invoice_number: string;
          date: string;
          due_date: string;
          client_name: string;
          client_email: string;
          client_address: string;
          items: InvoiceItem[];
          subtotal: number;
          tax_amount: number;
          discount_amount: number;
          total_amount: number;
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
          payment_date?: string | null;
          notes?: string | null;
          payment_terms?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          invoice_number?: string;
          date?: string;
          due_date?: string;
          client_name?: string;
          client_email?: string;
          client_address?: string;
          items?: InvoiceItem[];
          subtotal?: number;
          tax_amount?: number;
          discount_amount?: number;
          total_amount?: number;
          status?: "draft" | "sent" | "paid" | "overdue" | "cancelled";
          payment_date?: string | null;
          notes?: string | null;
          payment_terms?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

type PublicSchema = Database[Extract<keyof Database, "public">];

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;
