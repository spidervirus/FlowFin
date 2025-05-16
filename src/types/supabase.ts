import { CurrencyCode } from "@/lib/utils";

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          created_at: string;
          user_id: string;
          company_name: string;
          address: string;
          country: string;
          default_currency: CurrencyCode;
          fiscal_year_start: string;
          industry: string;
          phone_number: string | null;
          company_size: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          company_name: string;
          address: string;
          country: string;
          default_currency: CurrencyCode;
          fiscal_year_start: string;
          industry: string;
          phone_number?: string;
          company_size?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          company_name?: string;
          address?: string;
          country?: string;
          default_currency?: CurrencyCode;
          fiscal_year_start?: string;
          industry?: string;
          phone_number?: string;
          company_size?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      accounts: {
        Row: {
          id: string;
          name: string;
          type:
            | "checking"
            | "savings"
            | "credit"
            | "investment"
            | "cash"
            | "other";
          balance: number;
          currency: string;
          institution: string | null;
          account_number: string | null;
          is_active: boolean;
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          type:
            | "checking"
            | "savings"
            | "credit"
            | "investment"
            | "cash"
            | "other";
          balance?: number;
          currency?: string;
          institution?: string | null;
          account_number?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?:
            | "checking"
            | "savings"
            | "credit"
            | "investment"
            | "cash"
            | "other";
          balance?: number;
          currency?: string;
          institution?: string | null;
          account_number?: string | null;
          is_active?: boolean;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
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
        ];
      };
      transactions: {
        Row: {
          id: string;
          date: string;
          description: string;
          amount: number;
          type: "income" | "expense" | "transfer";
          category_id: string | null;
          account_id: string;
          status: "pending" | "completed" | "reconciled";
          notes: string | null;
          is_recurring: boolean | null;
          recurrence_frequency:
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          next_occurrence_date: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          date: string;
          description: string;
          amount: number;
          type: "income" | "expense" | "transfer";
          category_id?: string | null;
          account_id: string;
          status?: "pending" | "completed" | "reconciled";
          notes?: string | null;
          is_recurring?: boolean | null;
          recurrence_frequency?:
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          next_occurrence_date?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          date?: string;
          description?: string;
          amount?: number;
          type?: "income" | "expense" | "transfer";
          category_id?: string | null;
          account_id?: string;
          status?: "pending" | "completed" | "reconciled";
          notes?: string | null;
          is_recurring?: boolean | null;
          recurrence_frequency?:
            | "daily"
            | "weekly"
            | "monthly"
            | "yearly"
            | null;
          next_occurrence_date?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "transactions_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "transactions_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
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
      reconciliations: {
        Row: {
          id: string;
          account_id: string;
          statement_date: string;
          statement_balance: number;
          is_completed: boolean;
          completed_at: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          account_id: string;
          statement_date: string;
          statement_balance: number;
          is_completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          account_id?: string;
          statement_date?: string;
          statement_balance?: number;
          is_completed?: boolean;
          completed_at?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reconciliations_account_id_fkey";
            columns: ["account_id"];
            referencedRelation: "accounts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reconciliations_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
        ];
      };
      reconciliation_items: {
        Row: {
          id: string;
          reconciliation_id: string;
          transaction_id: string;
          is_reconciled: boolean;
          reconciled_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reconciliation_id: string;
          transaction_id: string;
          is_reconciled?: boolean;
          reconciled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reconciliation_id?: string;
          transaction_id?: string;
          is_reconciled?: boolean;
          reconciled_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reconciliation_items_reconciliation_id_fkey";
            columns: ["reconciliation_id"];
            referencedRelation: "reconciliations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reconciliation_items_transaction_id_fkey";
            columns: ["transaction_id"];
            referencedRelation: "transactions";
            referencedColumns: ["id"];
          },
        ];
      };
      dashboard_settings: {
        Row: {
          id: string;
          user_id: string;
          layout: Json;
          theme: string;
          default_view: string;
          widgets: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          layout?: Json;
          theme?: string;
          default_view?: string;
          widgets?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          layout?: Json;
          theme?: string;
          default_view?: string;
          widgets?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "dashboard_settings_user_id_fkey";
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
          is_recurring: boolean | null;
          recurrence_period: "monthly" | "quarterly" | "yearly" | null;
          is_active: boolean | null;
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
          is_recurring?: boolean | null;
          recurrence_period?: "monthly" | "quarterly" | "yearly" | null;
          is_active?: boolean | null;
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
          is_recurring?: boolean | null;
          recurrence_period?: "monthly" | "quarterly" | "yearly" | null;
          is_active?: boolean | null;
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
      budget_categories: {
        Row: {
          id: string;
          budget_id: string;
          category_id: string | null;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category_id?: string | null;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          category_id?: string | null;
          amount?: number;
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
      budget_tracking: {
        Row: {
          id: string;
          budget_id: string;
          category_id: string | null;
          month: string;
          planned_amount: number;
          actual_amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          budget_id: string;
          category_id?: string | null;
          month: string;
          planned_amount: number;
          actual_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          budget_id?: string;
          category_id?: string | null;
          month?: string;
          planned_amount?: number;
          actual_amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "budget_tracking_budget_id_fkey";
            columns: ["budget_id"];
            referencedRelation: "budgets";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "budget_tracking_category_id_fkey";
            columns: ["category_id"];
            referencedRelation: "categories";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          logo_url: string | null;
          website: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          description?: string | null;
          logo_url?: string | null;
          website?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: 'owner' | 'admin' | 'member';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          user_id?: string;
          role?: 'owner' | 'admin' | 'member';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_members_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      payroll_settings: {
        Row: {
          id: string;
          user_id: string;
          pay_schedule: "weekly" | "bi_weekly" | "monthly";
          pay_day: string;
          overtime_rate: number;
          tax_rate: number;
          enable_overtime: boolean;
          enable_bonuses: boolean;
          enable_deductions: boolean;
          default_work_hours: number;
          holiday_pay_rate: number;
          sick_leave_accrual_rate: number;
          vacation_leave_accrual_rate: number;
          enable_holiday_pay: boolean;
          enable_sick_leave: boolean;
          enable_vacation_leave: boolean;
          enable_401k: boolean;
          default_401k_contribution: number;
          enable_health_insurance: boolean;
          default_health_insurance_deduction: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pay_schedule?: "weekly" | "bi_weekly" | "monthly";
          pay_day?: string;
          overtime_rate?: number;
          tax_rate?: number;
          enable_overtime?: boolean;
          enable_bonuses?: boolean;
          enable_deductions?: boolean;
          default_work_hours?: number;
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
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pay_schedule?: "weekly" | "bi_weekly" | "monthly";
          pay_day?: string;
          overtime_rate?: number;
          tax_rate?: number;
          enable_overtime?: boolean;
          enable_bonuses?: boolean;
          enable_deductions?: boolean;
          default_work_hours?: number;
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
      employees: {
        Row: {
          id: string;
          user_id: string;
          first_name: string;
          last_name: string;
          email: string;
          phone: string | null;
          hire_date: string;
          salary: number;
          status: "active" | "inactive";
          department: string | null;
          position: string | null;
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
          hire_date: string;
          salary: number;
          status?: "active" | "inactive";
          department?: string | null;
          position?: string | null;
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
          hire_date?: string;
          salary?: number;
          status?: "active" | "inactive";
          department?: string | null;
          position?: string | null;
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
          check_in?: string;
          check_out?: string | null;
          status: "present" | "absent" | "late" | "half_day";
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
      manual_journals: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          reference_number: string;
          description: string;
          status: "draft" | "posted" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          reference_number: string;
          description: string;
          status?: "draft" | "posted" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          reference_number?: string;
          description?: string;
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
          }
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
      pay_runs: {
        Row: {
          id: string;
          user_id: string;
          period_start: string;
          period_end: string;
          payment_date: string;
          status: "draft" | "processing" | "completed" | "cancelled";
          total_employees: number;
          total_gross: number;
          total_deductions: number;
          total_net: number;
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
          total_employees?: number;
          total_gross?: number;
          total_deductions?: number;
          total_net?: number;
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
          total_employees?: number;
          total_gross?: number;
          total_deductions?: number;
          total_net?: number;
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
      pay_run_employees: {
        Row: {
          id: string;
          user_id: string;
          pay_run_id: string;
          employee_id: string;
          base_pay: number;
          overtime_pay: number;
          deductions: number;
          net_pay: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pay_run_id: string;
          employee_id: string;
          base_pay: number;
          overtime_pay?: number;
          deductions?: number;
          net_pay?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pay_run_id?: string;
          employee_id?: string;
          base_pay?: number;
          overtime_pay?: number;
          deductions?: number;
          net_pay?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pay_run_employees_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
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
          user_id: string;
          pay_run_employee_id: string;
          type: string;
          description: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          pay_run_employee_id: string;
          type: string;
          description: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          pay_run_employee_id?: string;
          type?: string;
          description?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "pay_run_deductions_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "pay_run_deductions_pay_run_employee_id_fkey";
            columns: ["pay_run_employee_id"];
            referencedRelation: "pay_run_employees";
            referencedColumns: ["id"];
          }
        ];
      };
      chart_of_accounts: {
        Row: {
          id: string;
          user_id: string;
          code: string;
          name: string;
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
          code: string;
          name: string;
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
          code?: string;
          name?: string;
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
      user_preferences: {
        Row: {
          id: string;
          user_id: string;
          theme: string;
          language: string;
          currency: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          theme?: string;
          language?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          theme?: string;
          language?: string;
          currency?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_preferences_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      financial_goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount: number;
          target_date: string;
          category_id: string;
          status: "active" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          target_amount: number;
          current_amount?: number;
          target_date: string;
          category_id: string;
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string;
          category_id?: string;
          status?: "active" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
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
      timesheets: {
        Row: {
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
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          week_start: string;
          week_end: string;
          status?: "draft" | "submitted" | "approved" | "rejected";
          total_hours?: number;
          overtime_hours?: number;
          regular_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          week_start?: string;
          week_end?: string;
          status?: "draft" | "submitted" | "approved" | "rejected";
          total_hours?: number;
          overtime_hours?: number;
          regular_hours?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey";
            columns: ["employee_id"];
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "timesheets_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      timesheet_entries: {
        Row: {
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
        Insert: {
          id?: string;
          timesheet_id: string;
          date: string;
          hours: number;
          overtime_hours: number;
          description: string;
          project?: string | null;
          task?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          timesheet_id?: string;
          date?: string;
          hours?: number;
          overtime_hours?: number;
          description?: string;
          project?: string | null;
          task?: string | null;
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
          reason: string;
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
          reason: string;
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
          reason?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_requests_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      leave_balances: {
        Row: {
          id: string;
          user_id: string;
          employee_id: string;
          annual_leave_balance: number;
          sick_leave_balance: number;
          unpaid_leave_balance: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          annual_leave_balance: number;
          sick_leave_balance: number;
          unpaid_leave_balance: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          annual_leave_balance?: number;
          sick_leave_balance?: number;
          unpaid_leave_balance?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: true;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "leave_balances_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
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
          hours: number;
          overtime_hours: number;
          break_minutes: number;
          notes: string;
          status: "pending" | "approved" | "rejected";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          date: string;
          hours: number;
          overtime_hours: number;
          break_minutes: number;
          notes: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          date?: string;
          hours?: number;
          overtime_hours?: number;
          break_minutes?: number;
          notes?: string;
          status?: "pending" | "approved" | "rejected";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "time_entries_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "employees";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "time_entries_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
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
          status: "draft" | "processing" | "completed" | "cancelled";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          start_date: string;
          end_date: string;
          status?: "draft" | "processing" | "completed" | "cancelled";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          start_date?: string;
          end_date?: string;
          status?: "draft" | "processing" | "completed" | "cancelled";
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
          payroll_period_id: string;
          base_salary: number;
          gross_pay: number;
          deductions: number;
          net_pay: number;
          status: "draft" | "approved" | "paid";
          payment_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          employee_id: string;
          payroll_period_id: string;
          base_salary: number;
          gross_pay: number;
          deductions: number;
          net_pay: number;
          status?: "draft" | "approved" | "paid";
          payment_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          employee_id?: string;
          payroll_period_id?: string;
          base_salary?: number;
          gross_pay?: number;
          deductions?: number;
          net_pay?: number;
          status?: "draft" | "approved" | "paid";
          payment_date?: string | null;
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
            foreignKeyName: "payslips_payroll_period_id_fkey";
            columns: ["payroll_period_id"];
            referencedRelation: "payroll_periods";
            referencedColumns: ["id"];
          }
        ];
      };
      payslip_items: {
        Row: {
          id: string;
          user_id: string;
          payslip_id: string;
          type: "earning" | "deduction";
          description: string;
          amount: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          payslip_id: string;
          type: "earning" | "deduction";
          description: string;
          amount: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          payslip_id?: string;
          type?: "earning" | "deduction";
          description?: string;
          amount?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payslip_items_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payslip_items_payslip_id_fkey";
            columns: ["payslip_id"];
            referencedRelation: "payslips";
            referencedColumns: ["id"];
          }
        ];
      };
      customers: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          email: string | null;
          phone: string | null;
          billing_address_line1: string | null;
          billing_address_line2: string | null;
          billing_city: string | null;
          billing_state_province: string | null;
          billing_postal_code: string | null;
          billing_country: string | null;
          shipping_address_line1: string | null;
          shipping_address_line2: string | null;
          shipping_city: string | null;
          shipping_state_province: string | null;
          shipping_postal_code: string | null;
          shipping_country: string | null;
          tax_id: string | null;
          notes: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          email?: string | null;
          phone?: string | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_state_province?: string | null;
          billing_postal_code?: string | null;
          billing_country?: string | null;
          shipping_address_line1?: string | null;
          shipping_address_line2?: string | null;
          shipping_city?: string | null;
          shipping_state_province?: string | null;
          shipping_postal_code?: string | null;
          shipping_country?: string | null;
          tax_id?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          email?: string | null;
          phone?: string | null;
          billing_address_line1?: string | null;
          billing_address_line2?: string | null;
          billing_city?: string | null;
          billing_state_province?: string | null;
          billing_postal_code?: string | null;
          billing_country?: string | null;
          shipping_address_line1?: string | null;
          shipping_address_line2?: string | null;
          shipping_city?: string | null;
          shipping_state_province?: string | null;
          shipping_postal_code?: string | null;
          shipping_country?: string | null;
          tax_id?: string | null;
          notes?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      items: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          price: number;
          description?: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          price: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          price?: number;
          description?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "items_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      invoices: {
        Row: {
          id: string;
          user_id: string;
          customer_id: string;
          invoice_number: string;
          date: string;
          due_date: string;
          status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          subtotal: number;
          tax_rate: number;
          tax_amount: number;
          total_amount: number;
          notes: string | null;
          delivery_tracking_id: string | null;
          shipping_address: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          customer_id: string;
          invoice_number: string;
          date: string;
          due_date: string;
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          subtotal: number;
          tax_rate: number;
          tax_amount?: number;
          total_amount: number;
          notes?: string | null;
          delivery_tracking_id?: string | null;
          shipping_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          customer_id?: string;
          invoice_number?: string;
          date?: string;
          due_date?: string;
          status?: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
          subtotal?: number;
          tax_rate?: number;
          tax_amount?: number;
          total_amount?: number;
          notes?: string | null;
          delivery_tracking_id?: string | null;
          shipping_address?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoices_customer_id_fkey";
            columns: ["customer_id"];
            referencedRelation: "customers";
            referencedColumns: ["id"];
          }
        ];
      };
      invoice_items: {
        Row: {
          id: string;
          invoice_id: string;
          item_id?: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          invoice_id: string;
          item_id?: string | null;
          description: string;
          quantity: number;
          unit_price: number;
          amount: number;
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          invoice_id?: string;
          item_id?: string | null;
          description?: string;
          quantity?: number;
          unit_price?: number;
          amount?: number;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey";
            columns: ["invoice_id"];
            referencedRelation: "invoices";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "invoice_items_item_id_fkey";
            columns: ["item_id"];
            referencedRelation: "items";
            referencedColumns: ["id"];
          }
        ];
      };
      user_roles: {
        Row: {
          id: string;
          user_id: string;
          role: "administrator" | "finance_manager" | "accountant" | "viewer";
          status: "active" | "invited" | "inactive";
          last_active: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: "administrator" | "finance_manager" | "accountant" | "viewer";
          status?: "active" | "invited" | "inactive";
          last_active?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: "administrator" | "finance_manager" | "accountant" | "viewer";
          status?: "active" | "invited" | "inactive";
          last_active?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      profiles: {
        Row: {
          id: string;
          user_id: string;
          full_name: string;
          title: string | null;
          bio: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          full_name: string;
          title?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          full_name?: string;
          title?: string | null;
          bio?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_invites: {
        Row: {
          id: string;
          organization_id: string;
          email: string;
          invited_by: string;
          status: "pending" | "accepted" | "declined";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          email: string;
          invited_by: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          email?: string;
          invited_by?: string;
          status?: "pending" | "accepted" | "declined";
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey";
            columns: ["organization_id"];
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "organization_invites_invited_by_fkey";
            columns: ["invited_by"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      organization_setup_progress: {
        Row: {
          id: string;
          user_id: string;
          current_step: number;
          step_data: {
            organization?: {
              name: string;
              description?: string;
              website?: string;
            };
            profile?: {
              fullName: string;
              title?: string;
              bio?: string;
            };
            team?: {
              invites: string[];
            };
          };
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          current_step: number;
          step_data: {
            organization?: {
              name: string;
              description?: string;
              website?: string;
            };
            profile?: {
              fullName: string;
              title?: string;
              bio?: string;
            };
            team?: {
              invites: string[];
            };
          };
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          current_step?: number;
          step_data?: {
            organization?: {
              name: string;
              description?: string;
              website?: string;
            };
            profile?: {
              fullName: string;
              title?: string;
              bio?: string;
            };
            team?: {
              invites: string[];
            };
          };
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organization_setup_progress_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      user_roles_with_auth: {
        Row: {
          id: string;
          user_id: string;
          role: "administrator" | "finance_manager" | "accountant" | "viewer";
          status: "active" | "invited" | "inactive";
          last_active: string | null;
          created_at: string;
          updated_at: string;
          email: string;
          user_metadata: {
            full_name?: string;
            avatar_url?: string;
          } | null;
        };
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Functions: {
      invite_user: {
        Args: {
          p_email: string;
          p_role: "administrator" | "finance_manager" | "accountant" | "viewer";
        };
        Returns: {
          success: boolean;
          error?: string;
          data?: {
            user_id: string;
            email: string;
            role: string;
          };
        };
      };
      get_or_create_setup_progress: {
        Args: {
          user_id_param: string;
        };
        Returns: Database["public"]["Tables"]["organization_setup_progress"]["Row"];
      };
      update_setup_progress: {
        Args: {
          user_id_param: string;
          step_param: number;
          step_data_param: Database["public"]["Tables"]["organization_setup_progress"]["Row"]["step_data"];
        };
        Returns: Database["public"]["Tables"]["organization_setup_progress"]["Row"];
      };
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
