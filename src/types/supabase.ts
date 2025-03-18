import { CurrencyCode } from '@/lib/utils';

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

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
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "company_settings_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      categories: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          name: string;
          type: string;
          color: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          name: string;
          type: string;
          color: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          name?: string;
          type?: string;
          color?: string;
        };
        Relationships: [
          {
            foreignKeyName: "categories_user_id_fkey";
            columns: ["user_id"];
            referencedRelation: "users";
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
          type: string;
          category_id: string;
          status: string;
          payment_date: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id: string;
          date: string;
          description: string;
          amount: number;
          type: string;
          category_id: string;
          status?: string;
          payment_date?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string;
          date?: string;
          description?: string;
          amount?: number;
          type?: string;
          category_id?: string;
          status?: string;
          payment_date?: string | null;
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
          }
        ];
      };
      recurring_transactions: {
        Row: {
          id: string;
          created_at: string;
          user_id: string;
          description: string;
          amount: number;
          type: string;
          category_id: string;
          frequency: string;
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
          type: string;
          category_id: string;
          frequency: string;
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
          type?: string;
          category_id?: string;
          frequency?: string;
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
          }
        ];
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
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
