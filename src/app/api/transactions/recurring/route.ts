import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { logger } from "../../../../lib/logger";

// Define transaction interface
interface Transaction {
  id: string;
  amount: number;
  date: string;
  description: string;
  is_recurring: boolean;
  recurrence_frequency?: string;
  next_occurrence_date?: string;
  account?: {
    id: string;
    name: string;
  };
  category?: {
    id: string;
    name: string;
    type: string;
    color: string;
  };
}

// GET endpoint to fetch recurring transactions
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  try {
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data, error } = await supabase
      .from("transactions")
      .select(`
        *,
        account:accounts(id, name),
        category:categories(id, name, type, color)
      `)
      .eq("user_id", user.id)
      .eq("is_recurring", true)
      .order("date", { ascending: false });

    if (error) {
      logger.error("Error fetching recurring transactions:", error);
      return NextResponse.json(
        { error: "Failed to fetch recurring transactions", details: error.message },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        data: [],
        message: "No recurring transactions found"
      });
    }

    // Validate and sanitize the data
    const validatedData = data.map(transaction => ({
      ...transaction,
      amount: Number(transaction.amount),
      date: new Date(transaction.date).toISOString().split('T')[0]
    }));

    return NextResponse.json({
      data: validatedData,
      count: validatedData.length
    });
  } catch (error: unknown) {
    logger.error("Error processing recurring transactions request:", error instanceof Error ? error : new Error('Unknown error'));
    return NextResponse.json(
      { error: "Internal server error", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// DELETE endpoint to delete a recurring transaction
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get transaction ID from query params
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 }
      );
    }

    // Get the transaction to verify ownership and get details
    const { data: transaction, error: getError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .eq("is_recurring", true)
      .single();

    if (getError) {
      return NextResponse.json(
        { error: "Recurring transaction not found" },
        { status: 404 }
      );
    }

    // Update the transaction to disable recurring
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        is_recurring: false,
        recurrence_frequency: null,
        next_occurrence_date: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return NextResponse.json(
        { error: "Failed to delete recurring transaction" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}