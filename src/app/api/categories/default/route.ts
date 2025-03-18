import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Create a Supabase client with server-side access
    const supabase = await createClient();

    // Define default categories
    const defaultCategories = [
      // Income categories
      { name: "Salary", type: "income", user_id: userId, is_default: true, color: "#4CAF50" },
      { name: "Investments", type: "income", user_id: userId, is_default: true, color: "#2196F3" },
      { name: "Sales", type: "income", user_id: userId, is_default: true, color: "#9C27B0" },
      { name: "Other Income", type: "income", user_id: userId, is_default: true, color: "#607D8B" },
      
      // Expense categories
      { name: "Housing", type: "expense", user_id: userId, is_default: true, color: "#F44336" },
      { name: "Transportation", type: "expense", user_id: userId, is_default: true, color: "#FF9800" },
      { name: "Food", type: "expense", user_id: userId, is_default: true, color: "#795548" },
      { name: "Utilities", type: "expense", user_id: userId, is_default: true, color: "#009688" },
      { name: "Insurance", type: "expense", user_id: userId, is_default: true, color: "#3F51B5" },
      { name: "Medical", type: "expense", user_id: userId, is_default: true, color: "#E91E63" },
      { name: "Entertainment", type: "expense", user_id: userId, is_default: true, color: "#673AB7" },
      { name: "Education", type: "expense", user_id: userId, is_default: true, color: "#00BCD4" },
      { name: "Office Supplies", type: "expense", user_id: userId, is_default: true, color: "#8BC34A" },
      { name: "Marketing", type: "expense", user_id: userId, is_default: true, color: "#FF5722" },
      { name: "Software", type: "expense", user_id: userId, is_default: true, color: "#03A9F4" },
      { name: "Other Expenses", type: "expense", user_id: userId, is_default: true, color: "#9E9E9E" }
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
        { status: 500 }
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
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: true, 
          message: "Default categories created successfully", 
          data 
        },
        { status: 201 }
      );
    } else {
      // Categories already exist, return them
      return NextResponse.json(
        { 
          success: true, 
          message: "Categories already exist for this user", 
          data: existingCategories 
        },
        { status: 200 }
      );
    }
  } catch (error) {
    console.error("Error in default categories API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
} 