import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";
import { suggestCategory } from "@/lib/transaction-categorization";

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get request data
    const requestData = await request.json();
    const { transactions, account_id, auto_categorize } = requestData;

    if (
      !transactions ||
      !Array.isArray(transactions) ||
      transactions.length === 0
    ) {
      return NextResponse.json(
        { error: "No transactions provided" },
        { status: 400 },
      );
    }

    if (!account_id) {
      return NextResponse.json(
        { error: "Account ID is required" },
        { status: 400 },
      );
    }

    // Fetch account to verify it exists and get current balance
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("*")
      .eq("id", account_id)
      .eq("user_id", user.id)
      .single();

    if (accountError || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Fetch categories for auto-categorization
    const { data: categories } = await supabase
      .from("categories")
      .select("*")
      .eq("is_active", true)
      .eq("user_id", user.id);

    // Fetch existing transactions for auto-categorization
    const { data: existingTransactions } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("date", { ascending: false })
      .limit(500);

    // Process transactions
    const processedTransactions = transactions.map((transaction: any) => {
      // Ensure required fields
      if (
        !transaction.date ||
        !transaction.description ||
        transaction.amount === undefined
      ) {
        throw new Error(
          "Each transaction must have date, description, and amount",
        );
      }

      // Auto-categorize if enabled
      let category = transaction.category;
      if (auto_categorize && !category && categories && existingTransactions) {
        const suggestedCategory = suggestCategory(
          transaction.description,
          transaction.amount,
          transaction.type || "expense",
          existingTransactions,
          categories,
        );

        if (suggestedCategory) {
          category = suggestedCategory;
        }
      }

      return {
        date: transaction.date,
        description: transaction.description,
        amount: parseFloat(transaction.amount),
        type: transaction.type || "expense",
        category,
        account_id,
        status: transaction.status || "completed",
        notes: transaction.notes || "",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: user.id,
      };
    });

    // Calculate total impact on account balance
    const totalBalanceChange = processedTransactions.reduce(
      (sum, transaction) => {
        if (transaction.type === "income") {
          return sum + transaction.amount;
        } else if (transaction.type === "expense") {
          return sum - transaction.amount;
        }
        return sum;
      },
      0,
    );

    // Insert transactions in batches
    const batchSize = 50;
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < processedTransactions.length; i += batchSize) {
      const batch = processedTransactions.slice(i, i + batchSize);

      const { error: insertError } = await supabase
        .from("transactions")
        .insert(batch);

      if (insertError) {
        console.error("Error importing batch:", insertError);
        errorCount += batch.length;
      } else {
        successCount += batch.length;
      }
    }

    // Update account balance
    const newBalance = account.balance + totalBalanceChange;

    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account_id)
      .eq("user_id", user.id);

    if (updateError) {
      return NextResponse.json(
        {
          error: "Failed to update account balance",
          successCount,
          errorCount,
        },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      imported: successCount,
      failed: errorCount,
      newBalance,
    });
  } catch (error) {
    console.error("Error processing import:", error);
    return NextResponse.json(
      { error: "Failed to import transactions" },
      { status: 500 },
    );
  }
}
