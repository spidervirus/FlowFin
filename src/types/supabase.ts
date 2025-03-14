export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      accounts: {
        Row: {
          account_number: string | null
          balance: number
          created_at: string | null
          currency: string
          id: string
          institution: string | null
          is_active: boolean
          name: string
          notes: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          institution?: string | null
          is_active?: boolean
          name: string
          notes?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number
          created_at?: string | null
          currency?: string
          id?: string
          institution?: string | null
          is_active?: boolean
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      budget_categories: {
        Row: {
          amount: number
          budget_id: string
          category_id: string | null
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          amount: number
          budget_id: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          amount?: number
          budget_id?: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_categories_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_categories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_tracking: {
        Row: {
          actual_amount: number | null
          budget_id: string
          category_id: string | null
          created_at: string | null
          id: string
          month: string
          planned_amount: number
          updated_at: string | null
        }
        Insert: {
          actual_amount?: number | null
          budget_id: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          month: string
          planned_amount: number
          updated_at?: string | null
        }
        Update: {
          actual_amount?: number | null
          budget_id?: string
          category_id?: string | null
          created_at?: string | null
          id?: string
          month?: string
          planned_amount?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "budget_tracking_budget_id_fkey"
            columns: ["budget_id"]
            isOneToOne: false
            referencedRelation: "budgets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "budget_tracking_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      budgets: {
        Row: {
          created_at: string | null
          description: string | null
          end_date: string
          id: string
          is_active: boolean | null
          is_recurring: boolean | null
          name: string
          recurrence_period: string | null
          start_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          end_date: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name: string
          recurrence_period?: string | null
          start_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          end_date?: string
          id?: string
          is_active?: boolean | null
          is_recurring?: boolean | null
          name?: string
          recurrence_period?: string | null
          start_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          company_name: string
          country: string
          created_at: string | null
          default_currency: string
          fiscal_year_start: string
          id: string
          industry: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          address?: string | null
          company_name: string
          country: string
          created_at?: string | null
          default_currency: string
          fiscal_year_start: string
          id?: string
          industry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          address?: string | null
          company_name?: string
          country?: string
          created_at?: string | null
          default_currency?: string
          fiscal_year_start?: string
          id?: string
          industry?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      dashboard_settings: {
        Row: {
          created_at: string | null
          default_view: string | null
          id: string
          layout: Json | null
          theme: string | null
          updated_at: string | null
          user_id: string
          widgets: Json | null
        }
        Insert: {
          created_at?: string | null
          default_view?: string | null
          id?: string
          layout?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id: string
          widgets?: Json | null
        }
        Update: {
          created_at?: string | null
          default_view?: string | null
          id?: string
          layout?: Json | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string
          widgets?: Json | null
        }
        Relationships: []
      }
      dashboard_widgets: {
        Row: {
          created_at: string | null
          dashboard_id: string
          id: string
          position: number
          settings: Json | null
          updated_at: string | null
          visible: boolean
          widget_type: string
        }
        Insert: {
          created_at?: string | null
          dashboard_id: string
          id?: string
          position: number
          settings?: Json | null
          updated_at?: string | null
          visible?: boolean
          widget_type: string
        }
        Update: {
          created_at?: string | null
          dashboard_id?: string
          id?: string
          position?: number
          settings?: Json | null
          updated_at?: string | null
          visible?: boolean
          widget_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "dashboard_widgets_dashboard_id_fkey"
            columns: ["dashboard_id"]
            isOneToOne: false
            referencedRelation: "dashboard_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_goals: {
        Row: {
          category_id: string | null
          color: string | null
          created_at: string | null
          current_amount: number | null
          description: string | null
          icon: string | null
          id: string
          is_active: boolean | null
          is_completed: boolean | null
          name: string
          start_date: string
          target_amount: number
          target_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          name: string
          start_date: string
          target_amount: number
          target_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          category_id?: string | null
          color?: string | null
          created_at?: string | null
          current_amount?: number | null
          description?: string | null
          icon?: string | null
          id?: string
          is_active?: boolean | null
          is_completed?: boolean | null
          name?: string
          start_date?: string
          target_amount?: number
          target_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_goals_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_contributions: {
        Row: {
          amount: number
          created_at: string | null
          date: string
          goal_id: string
          id: string
          notes: string | null
          transaction_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          date: string
          goal_id: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          date?: string
          goal_id?: string
          id?: string
          notes?: string | null
          transaction_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goal_contributions_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "financial_goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goal_contributions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          invoice_id: string
          quantity: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity?: number
          unit_price: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_payments: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          invoice_id: string
          notes: string | null
          payment_date: string
          payment_method: string
          transaction_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          payment_date: string
          payment_method: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          payment_date?: string
          payment_method?: string
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          account_id: string
          client_address: string
          client_email: string
          client_name: string
          created_at: string | null
          date: string
          discount_amount: number | null
          due_date: string
          id: string
          invoice_number: string
          items: Json
          notes: string | null
          payment_date: string | null
          payment_terms: string | null
          status: string
          subtotal: number
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          client_address: string
          client_email: string
          client_name: string
          created_at?: string | null
          date: string
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_number: string
          items: Json
          notes?: string | null
          payment_date?: string | null
          payment_terms?: string | null
          status: string
          subtotal: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          client_address?: string
          client_email?: string
          client_name?: string
          created_at?: string | null
          date?: string
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_number?: string
          items?: Json
          notes?: string | null
          payment_date?: string | null
          payment_terms?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_user_registry: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          password_hash: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          password_hash: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          password_hash?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_users: {
        Row: {
          created_at: string | null
          organization_id: string
          role_id: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          organization_id: string
          role_id?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          organization_id?: string
          role_id?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_users_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_users_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          fiscal_year_start: string | null
          id: string
          industry: string | null
          logo_url: string | null
          name: string
          phone: string | null
          size: string | null
          tax_id: string | null
          updated_at: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          fiscal_year_start?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          size?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          fiscal_year_start?: string | null
          id?: string
          industry?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          size?: string | null
          tax_id?: string | null
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          transaction_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          transaction_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          transaction_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliation_items: {
        Row: {
          created_at: string | null
          id: string
          is_reconciled: boolean
          reconciled_at: string | null
          reconciliation_id: string
          transaction_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_reconciled?: boolean
          reconciled_at?: string | null
          reconciliation_id: string
          transaction_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_reconciled?: boolean
          reconciled_at?: string | null
          reconciliation_id?: string
          transaction_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reconciliation_items_reconciliation_id_fkey"
            columns: ["reconciliation_id"]
            isOneToOne: false
            referencedRelation: "reconciliations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reconciliation_items_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      reconciliations: {
        Row: {
          account_id: string
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean
          notes: string | null
          statement_balance: number
          statement_date: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          statement_balance: number
          statement_date: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean
          notes?: string | null
          statement_balance?: number
          statement_date?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reconciliations_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      report_configurations: {
        Row: {
          created_at: string | null
          filters: Json | null
          id: string
          is_favorite: boolean
          name: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_favorite?: boolean
          name: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          filters?: Json | null
          id?: string
          is_favorite?: boolean
          name?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          created_at: string | null
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          organization_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          organization_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      session_events: {
        Row: {
          created_at: string | null
          details: Json | null
          event_type: string
          id: string
          ip_address: string | null
          session_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: string | null
          session_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: string | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          browser: string | null
          created_at: string | null
          device_name: string | null
          device_type: string | null
          expires_at: string
          id: string
          ip_address: string | null
          is_active: boolean | null
          last_active: string | null
          os: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string | null
          os?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          created_at?: string | null
          device_name?: string | null
          device_type?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          is_active?: boolean | null
          last_active?: string | null
          os?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string
          id: string
          is_recurring: boolean | null
          next_occurrence_date: string | null
          notes: string | null
          parent_transaction_id: string | null
          recurrence_end_date: string | null
          recurrence_frequency: string | null
          recurrence_start_date: string | null
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          amount: number
          category_id?: string | null
          created_at?: string | null
          date: string
          description: string
          id?: string
          is_recurring?: boolean | null
          next_occurrence_date?: string | null
          notes?: string | null
          parent_transaction_id?: string | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_start_date?: string | null
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          amount?: number
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string
          id?: string
          is_recurring?: boolean | null
          next_occurrence_date?: string | null
          notes?: string | null
          parent_transaction_id?: string | null
          recurrence_end_date?: string | null
          recurrence_frequency?: string | null
          recurrence_start_date?: string | null
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_parent_transaction_id_fkey"
            columns: ["parent_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          full_name: string | null
          id: string
          job_title: string | null
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles_backup: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: string | null
          email: string | null
          full_name: string | null
          id: string
          image: string | null
          name: string | null
          subscription: string | null
          token_identifier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          image?: string | null
          name?: string | null
          subscription?: string | null
          token_identifier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string | null
          subscription?: string | null
          token_identifier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string
          credits: string | null
          email: string | null
          full_name: string | null
          id: string
          image: string | null
          name: string | null
          subscription: string | null
          token_identifier: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          image?: string | null
          name?: string | null
          subscription?: string | null
          token_identifier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          credits?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          image?: string | null
          name?: string | null
          subscription?: string | null
          token_identifier?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_check_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      check_auth_email: {
        Args: {
          email_input: string
        }
        Returns: {
          id: string
          email: string
        }[]
      }
      check_auth_user_exists: {
        Args: {
          user_id: string
        }
        Returns: boolean
      }
      check_user_exists_by_email: {
        Args: {
          p_email: string
        }
        Returns: Json
      }
      create_auth_user: {
        Args: {
          user_id: string
          user_email: string
          user_password: string
          user_metadata?: Json
        }
        Returns: undefined
      }
      create_auth_user_if_not_exists: {
        Args: {
          user_id: string
          user_email: string
        }
        Returns: undefined
      }
      create_user_profile: {
        Args: {
          user_id: string
          user_email: string
          user_name: string
          user_full_name: string
        }
        Returns: undefined
      }
      create_user_profile_direct: {
        Args: {
          p_id: string
          p_email: string
          p_name: string
          p_full_name: string
        }
        Returns: Json
      }
      diagnose_auth_issues: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      get_auth_user_metadata: {
        Args: {
          user_id: string
        }
        Returns: Json
      }
      insert_user_profile: {
        Args: {
          p_id: string
          p_email: string
          p_name: string
          p_full_name: string
        }
        Returns: Json
      }
      manual_register_user: {
        Args: {
          p_email: string
          p_password: string
          p_full_name: string
        }
        Returns: Json
      }
      migrate_all_users_from_backup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_user_from_backup: {
        Args: {
          p_user_id: string
        }
        Returns: Json
      }
      migrate_user_to_auth_system: {
        Args: {
          p_user_id: string
          p_email: string
          p_full_name: string
        }
        Returns: Json
      }
      verify_manual_user_credentials: {
        Args: {
          p_email: string
          p_password: string
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

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
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

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
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
