import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

type CategoryType = "income" | "expense";

interface Category {
  id?: string;
  name: string;
  type: CategoryType;
  color: string | null;
  parent_id?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  user_id: string;
  is_default: boolean;
}

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 },
      );
    }

    // Create a Supabase client with server-side access
    const supabase = await createClient();

    const now = new Date().toISOString();

    // Define default categories
    const defaultCategories: Category[] = [
      // Income categories
      {
        name: "Salary",
        type: "income",
        user_id: userId,
        is_default: true,
        color: "#4CAF50",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Investments",
        type: "income",
        user_id: userId,
        is_default: true,
        color: "#2196F3",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Sales",
        type: "income",
        user_id: userId,
        is_default: true,
        color: "#9C27B0",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Other Income",
        type: "income",
        user_id: userId,
        is_default: true,
        color: "#607D8B",
        is_active: true,
        created_at: now,
        updated_at: now,
      },

      // Expense categories
      {
        name: "Housing",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#F44336",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Transportation",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#FF9800",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Food",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#795548",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Utilities",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#009688",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Insurance",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#3F51B5",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Medical",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#E91E63",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Entertainment",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#673AB7",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Education",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#00BCD4",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Office Supplies",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#8BC34A",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Marketing",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#FF5722",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Software",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#03A9F4",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
      {
        name: "Other Expenses",
        type: "expense",
        user_id: userId,
        is_default: true,
        color: "#9E9E9E",
        is_active: true,
        created_at: now,
        updated_at: now,
      },
    ];

    // Check if categories already exist for this user
    const { data: existingCategories, error: checkError } = await supabase
      .from("categories")
      .select("id, name, type")
      .eq("user_id", userId);

    if (checkError) {
      console.error("Error checking existing categories:", checkError);
      return NextResponse.json(
        { error: "Failed to check existing categories" },
        { status: 500 },
      );
    }

    // Only insert if no categories exist
    if (!existingCategories || existingCategories.length === 0) {
      // Insert default categories
      const { data, error } = await supabase
        .from("categories")
        .insert(defaultCategories)
        .select();

      if (error) {
        console.error("Error creating default categories:", error);
        return NextResponse.json(
          { error: "Failed to create default categories" },
          { status: 500 },
        );
      }

      return NextResponse.json(
        {
          success: true,
          message: "Default categories created successfully",
          data,
        },
        { status: 201 },
      );
    } else {
      // Categories already exist, return them
      return NextResponse.json(
        {
          success: true,
          message: "Categories already exist for this user",
          data: existingCategories,
        },
        { status: 200 },
      );
    }
  } catch (error) {
    console.error("Error in default categories API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
