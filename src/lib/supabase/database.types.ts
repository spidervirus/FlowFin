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
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date: string
          employee_id: string
          id?: string
          notes?: string | null
          status: string
          updated_at?: string
          user_id: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_number: string | null
          balance: number | null
          created_at: string | null
          currency: string | null
          id: string
          institution: string | null
          is_active: boolean | null
          name: string
          notes: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_number?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean | null
          name: string
          notes?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_number?: string | null
          balance?: number | null
          created_at?: string | null
          currency?: string | null
          id?: string
          institution?: string | null
          is_active?: boolean | null
          name?: string
          notes?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_subscription_details_mv"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      budget_transactions: {
        Row: {
          amount: number
          budget_id: string
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          budget_id: string
          category_id?: string | null
          created_at?: string | null
          date: string
          description?: string | null
          id?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          budget_id?: string
          category_id?: string | null
          created_at?: string | null
          date?: string
          description?: string | null
          id?: string
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
          is_active: boolean | null
          is_default: boolean | null
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
          is_active?: boolean | null
          is_default?: boolean | null
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
          is_active?: boolean | null
          is_default?: boolean | null
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
      chart_of_accounts: {
        Row: {
          code: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          parent_id: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          parent_id?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          parent_id?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          company_name: string | null
          company_size: string | null
          created_at: string | null
          default_currency: string | null
          fiscal_year_start: string | null
          id: string
          industry: string | null
          organization_id: string | null
          phone_number: string | null
          tax_year_start: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          default_currency?: string | null
          fiscal_year_start?: string | null
          id?: string
          industry?: string | null
          organization_id?: string | null
          phone_number?: string | null
          tax_year_start?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          default_currency?: string | null
          fiscal_year_start?: string | null
          id?: string
          industry?: string | null
          organization_id?: string | null
          phone_number?: string | null
          tax_year_start?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          billing_address_line1: string | null
          billing_address_line2: string | null
          billing_city: string | null
          billing_country: string | null
          billing_postal_code: string | null
          billing_state_province: string | null
          company_name: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          notes: string | null
          phone: string | null
          shipping_address_line1: string | null
          shipping_address_line2: string | null
          shipping_city: string | null
          shipping_country: string | null
          shipping_postal_code: string | null
          shipping_state_province: string | null
          tax_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state_province?: string | null
          company_name: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state_province?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_address_line1?: string | null
          billing_address_line2?: string | null
          billing_city?: string | null
          billing_country?: string | null
          billing_postal_code?: string | null
          billing_state_province?: string | null
          company_name?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string | null
          shipping_address_line1?: string | null
          shipping_address_line2?: string | null
          shipping_city?: string | null
          shipping_country?: string | null
          shipping_postal_code?: string | null
          shipping_state_province?: string | null
          tax_id?: string | null
          updated_at?: string
          user_id?: string
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
      delivery_charge_rates: {
        Row: {
          base_rate: number
          created_at: string | null
          description: string | null
          free_shipping_threshold: number | null
          id: string
          is_active: boolean | null
          max_order_amount: number | null
          max_weight: number | null
          min_order_amount: number | null
          min_weight: number | null
          name: string
          per_kg_rate: number | null
          shipping_zone_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_rate?: number
          created_at?: string | null
          description?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name: string
          per_kg_rate?: number | null
          shipping_zone_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_rate?: number
          created_at?: string | null
          description?: string | null
          free_shipping_threshold?: number | null
          id?: string
          is_active?: boolean | null
          max_order_amount?: number | null
          max_weight?: number | null
          min_order_amount?: number | null
          min_weight?: number | null
          name?: string
          per_kg_rate?: number | null
          shipping_zone_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "delivery_charge_rates_shipping_zone_id_fkey"
            columns: ["shipping_zone_id"]
            isOneToOne: false
            referencedRelation: "shipping_zones"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_charges: {
        Row: {
          base_amount: number | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          maximum_amount: number | null
          minimum_amount: number | null
          name: string
          per_km_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          base_amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          name: string
          per_km_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          base_amount?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          maximum_amount?: number | null
          minimum_amount?: number | null
          name?: string
          per_km_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      delivery_tracking: {
        Row: {
          actual_delivery_date: string | null
          carrier: string
          created_at: string | null
          estimated_delivery_date: string | null
          id: string
          invoice_id: string
          notes: string | null
          shipping_address: string
          status: string
          tracking_number: string
          tracking_url: string | null
          updated_at: string | null
          weight: number | null
        }
        Insert: {
          actual_delivery_date?: string | null
          carrier: string
          created_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          invoice_id: string
          notes?: string | null
          shipping_address: string
          status: string
          tracking_number: string
          tracking_url?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Update: {
          actual_delivery_date?: string | null
          carrier?: string
          created_at?: string | null
          estimated_delivery_date?: string | null
          id?: string
          invoice_id?: string
          notes?: string | null
          shipping_address?: string
          status?: string
          tracking_number?: string
          tracking_url?: string | null
          updated_at?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_tracking_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          created_at: string
          department: string
          email: string
          first_name: string
          hire_date: string
          id: string
          last_name: string
          position: string
          salary: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          department: string
          email: string
          first_name: string
          hire_date: string
          id?: string
          last_name: string
          position: string
          salary: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          department?: string
          email?: string
          first_name?: string
          hire_date?: string
          id?: string
          last_name?: string
          position?: string
          salary?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
        Relationships: []
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
        ]
      }
      inventory_adjustments: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          notes?: string | null
          product_id: string
          quantity: number
          reason: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_adjustments_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_adjustments_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_counts: {
        Row: {
          counted_quantity: number
          created_at: string | null
          difference: number
          id: string
          location_id: string
          notes: string | null
          product_id: string
          status: string
          system_quantity: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          counted_quantity: number
          created_at?: string | null
          difference: number
          id?: string
          location_id: string
          notes?: string | null
          product_id: string
          status: string
          system_quantity: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          counted_quantity?: number
          created_at?: string | null
          difference?: number
          id?: string
          location_id?: string
          notes?: string | null
          product_id?: string
          status?: string
          system_quantity?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_counts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_counts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_items: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          product_id: string
          quantity: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          product_id: string
          quantity?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          product_id?: string
          quantity?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_items_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_transactions: {
        Row: {
          created_at: string | null
          id: string
          location_id: string
          notes: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          transaction_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          location_id: string
          notes?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          location_id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          transaction_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_transactions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          id?: string
          invoice_id: string
          quantity: number
          unit_price: number
          updated_at?: string | null
          user_id: string
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
          user_id?: string
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
        Relationships: []
      }
      invoices: {
        Row: {
          created_at: string | null
          customer_id: string
          date: string
          delivery_charge_amount: number | null
          delivery_charge_id: string | null
          delivery_tracking_id: string | null
          due_date: string
          id: string
          invoice_number: string
          notes: string | null
          payment_date: string | null
          shipping_address: string | null
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          date: string
          delivery_charge_amount?: number | null
          delivery_charge_id?: string | null
          delivery_tracking_id?: string | null
          due_date: string
          id?: string
          invoice_number: string
          notes?: string | null
          payment_date?: string | null
          shipping_address?: string | null
          status: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          date?: string
          delivery_charge_amount?: number | null
          delivery_charge_id?: string | null
          delivery_tracking_id?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          notes?: string | null
          payment_date?: string | null
          shipping_address?: string | null
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_customer"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_delivery_charge_id_fkey"
            columns: ["delivery_charge_id"]
            isOneToOne: false
            referencedRelation: "delivery_charge_rates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_delivery_tracking_id_fkey"
            columns: ["delivery_tracking_id"]
            isOneToOne: false
            referencedRelation: "delivery_tracking"
            referencedColumns: ["id"]
          },
        ]
      }
      items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          sku: string | null
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          sku?: string | null
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      leave_balances: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          leave_type: string
          remaining_days: number
          total_days: number
          updated_at: string
          used_days: number
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          leave_type: string
          remaining_days: number
          total_days: number
          updated_at?: string
          used_days?: number
          user_id: string
          year: number
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          leave_type?: string
          remaining_days?: number
          total_days?: number
          updated_at?: string
          used_days?: number
          user_id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "leave_balances_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type: string
          reason: string | null
          start_date: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type: string
          reason?: string | null
          start_date: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type?: string
          reason?: string | null
          start_date?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
          user_id: string
          warehouse_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
          user_id: string
          warehouse_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
          user_id?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      manual_journals: {
        Row: {
          created_at: string
          date: string
          description: string
          entries: Json
          id: string
          reference_number: string
          status: Database["public"]["Enums"]["journal_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description: string
          entries: Json
          id?: string
          reference_number: string
          status?: Database["public"]["Enums"]["journal_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string
          entries?: Json
          id?: string
          reference_number?: string
          status?: Database["public"]["Enums"]["journal_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      notification_logs: {
        Row: {
          created_at: string | null
          error: string | null
          id: string
          metadata: Json | null
          status: string
          template_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          status: string
          template_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          error?: string | null
          id?: string
          metadata?: Json | null
          status?: string
          template_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_logs_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body: string
          created_at: string | null
          id: string
          subject: string
          type: string
          updated_at: string | null
        }
        Insert: {
          body: string
          created_at?: string | null
          id?: string
          subject: string
          type: string
          updated_at?: string | null
        }
        Update: {
          body?: string
          created_at?: string | null
          id?: string
          subject?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      organization_invites: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          invited_by: string
          organization_id: string
          status: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          organization_id: string
          status?: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          organization_id?: string
          status?: string
        }
        Relationships: []
      }
      organization_members: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string
          role: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id: string
          role: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string
          role?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_setup_progress: {
        Row: {
          created_at: string | null
          current_step: number
          id: string
          step_data: Json | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_step?: number
          id?: string
          step_data?: Json | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_step?: number
          id?: string
          step_data?: Json | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      pay_run_deductions: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          pay_run_employee_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          pay_run_employee_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          pay_run_employee_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_run_deductions_pay_run_employee_id_fkey"
            columns: ["pay_run_employee_id"]
            isOneToOne: false
            referencedRelation: "pay_run_employees"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_run_employees: {
        Row: {
          base_pay: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          net_pay: number
          overtime_pay: number
          pay_run_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          base_pay: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          net_pay: number
          overtime_pay?: number
          pay_run_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          base_pay?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          net_pay?: number
          overtime_pay?: number
          pay_run_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "pay_run_employees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pay_run_employees_pay_run_id_fkey"
            columns: ["pay_run_id"]
            isOneToOne: false
            referencedRelation: "pay_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      pay_runs: {
        Row: {
          created_at: string
          id: string
          payment_date: string
          period_end: string
          period_start: string
          status: string
          total_deductions: number
          total_employees: number
          total_gross: number
          total_net: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_date: string
          period_end: string
          period_start: string
          status?: string
          total_deductions?: number
          total_employees?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_date?: string
          period_end?: string
          period_start?: string
          status?: string
          total_deductions?: number
          total_employees?: number
          total_gross?: number
          total_net?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      payroll_periods: {
        Row: {
          created_at: string | null
          end_date: string
          id: string
          start_date: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          end_date: string
          id?: string
          start_date: string
          status: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          end_date?: string
          id?: string
          start_date?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      payroll_settings: {
        Row: {
          created_at: string
          default_401k_contribution: number | null
          default_health_insurance_deduction: number | null
          enable_401k: boolean | null
          enable_health_insurance: boolean | null
          enable_holiday_pay: boolean | null
          enable_sick_leave: boolean | null
          enable_vacation_leave: boolean | null
          holiday_pay_rate: number | null
          id: string
          overtime_rate: number
          overtime_threshold: number
          sick_leave_accrual_rate: number | null
          tax_rate: number
          updated_at: string
          user_id: string
          vacation_leave_accrual_rate: number | null
        }
        Insert: {
          created_at?: string
          default_401k_contribution?: number | null
          default_health_insurance_deduction?: number | null
          enable_401k?: boolean | null
          enable_health_insurance?: boolean | null
          enable_holiday_pay?: boolean | null
          enable_sick_leave?: boolean | null
          enable_vacation_leave?: boolean | null
          holiday_pay_rate?: number | null
          id?: string
          overtime_rate?: number
          overtime_threshold?: number
          sick_leave_accrual_rate?: number | null
          tax_rate?: number
          updated_at?: string
          user_id: string
          vacation_leave_accrual_rate?: number | null
        }
        Update: {
          created_at?: string
          default_401k_contribution?: number | null
          default_health_insurance_deduction?: number | null
          enable_401k?: boolean | null
          enable_health_insurance?: boolean | null
          enable_holiday_pay?: boolean | null
          enable_sick_leave?: boolean | null
          enable_vacation_leave?: boolean | null
          holiday_pay_rate?: number | null
          id?: string
          overtime_rate?: number
          overtime_threshold?: number
          sick_leave_accrual_rate?: number | null
          tax_rate?: number
          updated_at?: string
          user_id?: string
          vacation_leave_accrual_rate?: number | null
        }
        Relationships: []
      }
      payslip_items: {
        Row: {
          amount: number
          created_at: string
          description: string
          id: string
          payslip_id: string
          type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description: string
          id?: string
          payslip_id: string
          type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string
          id?: string
          payslip_id?: string
          type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslip_items_payslip_id_fkey"
            columns: ["payslip_id"]
            isOneToOne: false
            referencedRelation: "payslips"
            referencedColumns: ["id"]
          },
        ]
      }
      payslips: {
        Row: {
          created_at: string
          deductions: number
          employee_id: string
          gross_pay: number
          id: string
          net_pay: number
          pay_run_id: string
          payment_date: string
          period_end: string
          period_start: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deductions: number
          employee_id: string
          gross_pay: number
          id?: string
          net_pay: number
          pay_run_id: string
          payment_date: string
          period_end: string
          period_start: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deductions?: number
          employee_id?: string
          gross_pay?: number
          id?: string
          net_pay?: number
          pay_run_id?: string
          payment_date?: string
          period_end?: string
          period_start?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payslips_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payslips_pay_run_id_fkey"
            columns: ["pay_run_id"]
            isOneToOne: false
            referencedRelation: "pay_runs"
            referencedColumns: ["id"]
          },
        ]
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
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          purchase_price: number | null
          reorder_point: number | null
          reorder_quantity: number | null
          selling_price: number | null
          sku: string | null
          unit: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          purchase_price?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          selling_price?: number | null
          sku?: string | null
          unit: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          purchase_price?: number | null
          reorder_point?: number | null
          reorder_quantity?: number | null
          selling_price?: number | null
          sku?: string | null
          unit?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          department: string | null
          email: string
          full_name: string | null
          id: string
          job_title: string | null
          name: string | null
          phone: string | null
          role: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          department?: string | null
          email?: string
          full_name?: string | null
          id?: string
          job_title?: string | null
          name?: string | null
          phone?: string | null
          role?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      purchase_order_items: {
        Row: {
          amount: number
          created_at: string | null
          id: string
          product_id: string
          purchase_order_id: string
          quantity: number
          unit_price: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          id?: string
          product_id: string
          purchase_order_id: string
          quantity: number
          unit_price: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          id?: string
          product_id?: string
          purchase_order_id?: string
          quantity?: number
          unit_price?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          created_at: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_date: string
          order_number: string
          status: string
          subtotal: number | null
          supplier_id: string
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date: string
          order_number: string
          status: string
          subtotal?: number | null
          supplier_id: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          order_number?: string
          status?: string
          subtotal?: number | null
          supplier_id?: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_items: {
        Row: {
          created_at: string | null
          description: string
          discount_amount: number | null
          id: string
          quantity: number
          quote_id: string
          tax_amount: number | null
          tax_rate: number | null
          total_amount: number
          unit_price: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          discount_amount?: number | null
          id?: string
          quantity?: number
          quote_id: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          discount_amount?: number | null
          id?: string
          quantity?: number
          quote_id?: string
          tax_amount?: number | null
          tax_rate?: number | null
          total_amount?: number
          unit_price?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      quote_templates: {
        Row: {
          content: Json
          created_at: string
          description: string | null
          id: string
          is_default: boolean
          name: string
          type: Database["public"]["Enums"]["template_type"] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name: string
          type?: Database["public"]["Enums"]["template_type"] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: Json
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean
          name?: string
          type?: Database["public"]["Enums"]["template_type"] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          created_at: string | null
          customer_id: string
          date: string
          discount_amount: number | null
          discount_rate: number | null
          expiry_date: string | null
          id: string
          notes: string | null
          quote_date: string
          quote_number: string
          status: string
          subtotal: number | null
          tax_amount: number | null
          tax_rate: number | null
          template_id: string | null
          terms: string | null
          total: number | null
          total_amount: number | null
          updated_at: string | null
          user_id: string
          valid_until: string | null
        }
        Insert: {
          created_at?: string | null
          customer_id: string
          date: string
          discount_amount?: number | null
          discount_rate?: number | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          quote_date?: string
          quote_number: string
          status: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          terms?: string | null
          total?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id: string
          valid_until?: string | null
        }
        Update: {
          created_at?: string | null
          customer_id?: string
          date?: string
          discount_amount?: number | null
          discount_rate?: number | null
          expiry_date?: string | null
          id?: string
          notes?: string | null
          quote_date?: string
          quote_number?: string
          status?: string
          subtotal?: number | null
          tax_amount?: number | null
          tax_rate?: number | null
          template_id?: string | null
          terms?: string | null
          total?: number | null
          total_amount?: number | null
          updated_at?: string | null
          user_id?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quotes_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "quote_templates"
            referencedColumns: ["id"]
          },
        ]
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
        Relationships: []
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
        Relationships: []
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
      shipping_zones: {
        Row: {
          countries: string[]
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          postal_codes: string[] | null
          regions: string[] | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          countries: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          postal_codes?: string[] | null
          regions?: string[] | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          countries?: string[]
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          postal_codes?: string[] | null
          regions?: string[] | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_plans: {
        Row: {
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          name: string
          price: number
          receipt_limit: number | null
          transaction_limit: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id: string
          name: string
          price: number
          receipt_limit?: number | null
          transaction_limit?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          name?: string
          price?: number
          receipt_limit?: number | null
          transaction_limit?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      subscription_limits: {
        Row: {
          created_at: string
          id: string
          period_end: string | null
          period_start: string | null
          receipts_count: number | null
          transactions_count: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          receipts_count?: number | null
          transactions_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          period_end?: string | null
          period_start?: string | null
          receipts_count?: number | null
          transactions_count?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          id: string
          plan_id: string
          status: string
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id: string
          status: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan_id?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          payment_terms: string | null
          phone: string | null
          tax_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          payment_terms?: string | null
          phone?: string | null
          tax_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      timesheet_entries: {
        Row: {
          created_at: string
          date: string
          description: string | null
          employee_id: string
          hours: number
          id: string
          timesheet_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          description?: string | null
          employee_id: string
          hours: number
          id?: string
          timesheet_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          description?: string | null
          employee_id?: string
          hours?: number
          id?: string
          timesheet_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheet_entries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "timesheet_entries_timesheet_id_fkey"
            columns: ["timesheet_id"]
            isOneToOne: false
            referencedRelation: "timesheets"
            referencedColumns: ["id"]
          },
        ]
      }
      timesheets: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          status: string
          updated_at: string
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          week_end?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "timesheets_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          account_id: string
          amount: number
          category_id: string | null
          created_at: string | null
          date: string
          description: string | null
          id: string
          is_recurring: boolean | null
          notes: string | null
          reference_number: string | null
          status: string | null
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
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
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
          description?: string | null
          id?: string
          is_recurring?: boolean | null
          notes?: string | null
          reference_number?: string | null
          status?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_limits: {
        Row: {
          created_at: string | null
          id: string
          receipts_count: number | null
          reset_date: string | null
          transactions_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          receipts_count?: number | null
          reset_date?: string | null
          transactions_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          receipts_count?: number | null
          reset_date?: string | null
          transactions_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          account_type: string
          created_at: string | null
          currency: string
          date_format: string | null
          id: string
          theme: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          account_type: string
          created_at?: string | null
          currency?: string
          date_format?: string | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          account_type?: string
          created_at?: string | null
          currency?: string
          date_format?: string | null
          id?: string
          theme?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      user_profiles_backup: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          name: string | null
          role: string | null
          token_identifier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id?: string
          name?: string | null
          role?: string | null
          token_identifier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          name?: string | null
          role?: string | null
          token_identifier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          last_active: string | null
          role: string
          status: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_active?: string | null
          role?: string
          status?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      users: {
        Row: {
          created_at: string | null
          email: string
          full_name: string | null
          id: string
          stripe_customer_id: string | null
          subscription_period_end: string | null
          subscription_period_start: string | null
          subscription_plan: string | null
          subscription_status: string | null
          subscription_updated_at: string | null
          trial_end: string | null
          trial_ends_at: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          full_name?: string | null
          id: string
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_updated_at?: string | null
          trial_end?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          full_name?: string | null
          id?: string
          stripe_customer_id?: string | null
          subscription_period_end?: string | null
          subscription_period_start?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          subscription_updated_at?: string | null
          trial_end?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      waitlist: {
        Row: {
          company_name: string | null
          company_size: string | null
          created_at: string | null
          email: string
          id: string
          interested_in: string | null
          joined_at: string | null
          name: string
          signup_date: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email: string
          id?: string
          interested_in?: string | null
          joined_at?: string | null
          name: string
          signup_date?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string | null
          company_size?: string | null
          created_at?: string | null
          email?: string
          id?: string
          interested_in?: string | null
          joined_at?: string | null
          name?: string
          signup_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string | null
          contact_name: string | null
          created_at: string | null
          email: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          address?: string | null
          contact_name?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      manual_journal_totals: {
        Row: {
          date: string | null
          id: string | null
          reference_number: string | null
          status: Database["public"]["Enums"]["journal_status"] | null
          total_credits: number | null
          total_debits: number | null
          user_id: string | null
        }
        Relationships: []
      }
      subscription_metrics: {
        Row: {
          active_subscribers: number | null
          churned_subscribers: number | null
          month: string | null
          monthly_revenue: number | null
          total_subscribers: number | null
        }
        Relationships: []
      }
      usage_metrics: {
        Row: {
          active_users: number | null
          avg_receipts_per_user: number | null
          avg_transactions_per_user: number | null
          day: string | null
          total_receipts: number | null
          total_transactions: number | null
        }
        Relationships: []
      }
      user_roles_with_auth: {
        Row: {
          created_at: string | null
          email: string | null
          id: string | null
          last_active: string | null
          role: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
          user_metadata: Json | null
        }
        Relationships: []
      }
      user_subscription_details_mv: {
        Row: {
          cancel_at_period_end: boolean | null
          email: string | null
          id: string | null
          next_reset_date: string | null
          plan_id: string | null
          plan_name: string | null
          plan_price: number | null
          receipts_count: number | null
          receipts_remaining: number | null
          subscription_end_date: string | null
          subscription_status: string | null
          transactions_count: number | null
          transactions_remaining: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      accept_invitation: {
        Args: { p_invitation_id: string; p_user_id: string }
        Returns: boolean
      }
      admin_check_auth_users: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      can_access_feature: {
        Args: { user_uuid: string; feature_name: string }
        Returns: boolean
      }
      can_perform_action: {
        Args: { user_uuid: string; action_type: string }
        Returns: boolean
      }
      check_auth_email: {
        Args: { email_input: string }
        Returns: {
          id: string
          email: string
        }[]
      }
      check_auth_migration_status: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          status: string
          message: string
          created_at: string
        }[]
      }
      check_auth_user_exists: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_user_admin_access: {
        Args: { org_id_param: string; user_id_param: string }
        Returns: boolean
      }
      check_user_exists_by_email: {
        Args: { p_email: string }
        Returns: Json
      }
      check_user_permission: {
        Args: {
          p_user_id: string
          p_organization_id: string
          p_permission_name: string
        }
        Returns: boolean
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
        Args: { user_id: string; user_email: string }
        Returns: undefined
      }
      create_auth_user_robust: {
        Args: {
          p_user_id: string
          p_email: string
          p_password?: string
          p_user_metadata?: Json
        }
        Returns: Json
      }
      create_auth_user_robust_v2: {
        Args: {
          p_user_id: string
          p_email: string
          p_password: string
          p_user_metadata?: Json
        }
        Returns: Json
      }
      create_user_profile: {
        Args:
          | { user_id: string; user_email: string; user_full_name: string }
          | {
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
      diagnose_auth_system: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      diagnose_auth_system_v2: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      ensure_user_profile: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      exec_sql: {
        Args: { sql: string }
        Returns: undefined
      }
      get_auth_user_metadata: {
        Args: { user_id: string }
        Returns: Json
      }
      get_or_create_setup_progress: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          user_id: string
          current_step: number
          step_data: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_organization_stats: {
        Args: { p_organization_id: string }
        Returns: {
          total_users: number
          active_users: number
          pending_invitations: number
          roles_distribution: Json
        }[]
      }
      get_organization_users: {
        Args: {
          p_organization_id: string
          p_page?: number
          p_limit?: number
          p_search?: string
          p_role?: Database["public"]["Enums"]["user_role"]
          p_status?: Database["public"]["Enums"]["user_status"]
        }
        Returns: {
          id: string
          user_id: string
          email: string
          full_name: string
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          job_title: string
          department: string
          created_at: string
          total_count: number
        }[]
      }
      get_setup_progress: {
        Args: { user_id_param: string }
        Returns: {
          id: string
          user_id: string
          current_step: number
          step_data: Json
          created_at: string
          updated_at: string
        }[]
      }
      get_subscription_analytics: {
        Args: { start_date?: string; end_date?: string }
        Returns: {
          period: string
          total_revenue: number
          active_subscribers: number
          churn_rate: number
          avg_revenue_per_user: number
        }[]
      }
      get_user_organization_roles: {
        Args: { p_user_id: string; p_organization_id: string }
        Returns: {
          role: Database["public"]["Enums"]["user_role"]
          permissions: string[]
        }[]
      }
      get_user_organizations: {
        Args: Record<PropertyKey, never>
        Returns: string[]
      }
      get_user_subscription_details: {
        Args: { user_uuid?: string }
        Returns: {
          id: string
          email: string
          plan_id: string
          plan_name: string
          plan_price: number
          subscription_status: string
          subscription_end_date: string
          cancel_at_period_end: boolean
          transactions_count: number
          receipts_count: number
          transactions_remaining: number
          receipts_remaining: number
          next_reset_date: string
        }[]
      }
      get_user_subscription_status: {
        Args: { user_uuid: string }
        Returns: {
          plan: string
          status: string
          current_period_end: string
          transactions_remaining: number
          receipts_remaining: number
          next_reset_date: string
        }[]
      }
      handle_new_user: {
        Args: { user_id: string; user_email: string; user_name: string }
        Returns: undefined
      }
      has_any_organization: {
        Args: { user_id_param: string }
        Returns: boolean
      }
      has_organization_access: {
        Args: { org_id: string }
        Returns: boolean
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
      invite_user: {
        Args: { p_email: string; p_role?: string }
        Returns: Json
      }
      is_member_of_organization: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_organization_admin: {
        Args:
          | { org_id: string }
          | { org_id_param: string; user_id_param: string }
        Returns: boolean
      }
      is_organization_owner_or_admin: {
        Args: { org_id: string }
        Returns: boolean
      }
      is_user_admin: {
        Args: { p_user_id: string; p_organization_id: string }
        Returns: boolean
      }
      manual_register_user: {
        Args: { p_email: string; p_password: string; p_full_name: string }
        Returns: Json
      }
      migrate_all_users_from_backup: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      migrate_user_from_backup: {
        Args: { p_user_id: string }
        Returns: Json
      }
      migrate_user_to_auth_system: {
        Args: { p_user_id: string; p_email: string; p_full_name: string }
        Returns: Json
      }
      reset_monthly_limits: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rollback_subscription_analytics: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rollback_subscription_notifications: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rollback_subscription_tables: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      rollback_user_subscriptions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      send_subscription_notification: {
        Args: { p_user_id: string; p_template_type: string; p_metadata: Json }
        Returns: undefined
      }
      update_setup_progress: {
        Args: {
          user_id_param: string
          step_param: number
          step_data_param: Json
        }
        Returns: undefined
      }
      update_user_role: {
        Args: {
          p_organization_id: string
          p_user_id: string
          p_new_role: Database["public"]["Enums"]["user_role"]
          p_updated_by: string
        }
        Returns: boolean
      }
      verify_manual_user_credentials: {
        Args: { p_email: string; p_password: string }
        Returns: Json
      }
    }
    Enums: {
      account_type: "asset" | "liability" | "equity" | "revenue" | "expense"
      invitation_status: "pending" | "accepted" | "expired" | "cancelled"
      journal_status: "draft" | "posted"
      template_type: "quote" | "invoice"
      user_role: "admin" | "manager" | "user"
      user_status: "active" | "inactive" | "pending" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      account_type: ["asset", "liability", "equity", "revenue", "expense"],
      invitation_status: ["pending", "accepted", "expired", "cancelled"],
      journal_status: ["draft", "posted"],
      template_type: ["quote", "invoice"],
      user_role: ["admin", "manager", "user"],
      user_status: ["active", "inactive", "pending", "suspended"],
    },
  },
} as const
