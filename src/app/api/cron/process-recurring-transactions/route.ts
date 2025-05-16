import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

// Helper function to calculate next occurrence date based on frequency
function calculateNextOccurrenceDate(
  startDate: string,
  frequency: string,
): string {
  const date = new Date(startDate);

  switch (frequency) {
    case "daily":
      date.setDate(date.getDate() + 1);
      break;
    case "weekly":
      date.setDate(date.getDate() + 7);
      break;
    case "biweekly":
      date.setDate(date.getDate() + 14);
      break;
    case "monthly":
      date.setMonth(date.getMonth() + 1);
      break;
    case "quarterly":
      date.setMonth(date.getMonth() + 3);
      break;
    case "yearly":
      date.setFullYear(date.getFullYear() + 1);
      break;
    default:
      return "";
  }

  return date.toISOString().split("T")[0];
}

export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Verify API key for security (should be set in environment variables)
  const url = new URL(request.url);
  const apiKey = url.searchParams.get("api_key");

  if (!apiKey || apiKey !== process.env.CRON_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get current date
    const today = new Date().toISOString().split("T")[0];

    // Find recurring transactions that need to be processed
    const { data: recurringTransactions, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("is_recurring", true)
      .lte("next_occurrence_date", today);

    if (fetchError) {
      console.error("Error fetching recurring transactions:", fetchError);
      return NextResponse.json(
        { error: "Failed to fetch recurring transactions" },
        { status: 500 },
      );
    }

    if (!recurringTransactions || recurringTransactions.length === 0) {
      return NextResponse.json({
        message: "No recurring transactions to process",
      });
    }

    const results = [];

    // Process each recurring transaction
    for (const transaction of recurringTransactions) {
      // Skip if end date is reached
      if (
        transaction.recurrence_end_date &&
        transaction.recurrence_end_date < today
      ) {
        // Update transaction to disable recurring
        await supabase
          .from("transactions")
          .update({
            is_recurring: false,
            next_occurrence_date: null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.id);

        results.push({
          id: transaction.id,
          status: "ended",
          message: "Recurring schedule ended",
        });

        continue;
      }

      // Create a new transaction instance
      const newTransaction = {
        date: transaction.next_occurrence_date,
        description: transaction.description,
        amount: transaction.amount,
        type: transaction.type,
        category_id: transaction.category_id || null,
        account_id: transaction.account_id,
        status: "completed",
        notes: transaction.notes,
        is_recurring: false,
        parent_transaction_id: transaction.id,
        user_id: transaction.user_id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Get current account balance
      const { data: account, error: accountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", transaction.account_id)
        .single();

      if (accountError) {
        results.push({
          id: transaction.id,
          status: "error",
          message: "Account not found",
        });
        continue;
      }

      // Calculate new balance
      let newBalance = account.balance;
      if (transaction.type === "income") {
        newBalance += transaction.amount;
      } else if (transaction.type === "expense") {
        newBalance -= transaction.amount;
      }

      // Update account balance
      const { error: updateBalanceError } = await supabase
        .from("accounts")
        .update({
          balance: newBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.account_id);

      if (updateBalanceError) {
        results.push({
          id: transaction.id,
          status: "error",
          message: "Failed to update account balance",
        });
        continue;
      }

      // Insert new transaction
      const { data: newTransactionData, error: insertError } = await supabase
        .from("transactions")
        .insert([newTransaction])
        .select("id")
        .single();

      if (insertError) {
        // Rollback account balance update
        await supabase
          .from("accounts")
          .update({
            balance: account.balance,
            updated_at: new Date().toISOString(),
          })
          .eq("id", transaction.account_id);

        results.push({
          id: transaction.id,
          status: "error",
          message: "Failed to create new transaction instance",
        });
        continue;
      }

      // Calculate next occurrence date
      const nextOccurrenceDate = calculateNextOccurrenceDate(
        transaction.next_occurrence_date,
        transaction.recurrence_frequency,
      );

      // Update the recurring transaction with new next_occurrence_date
      const { error: updateError } = await supabase
        .from("transactions")
        .update({
          next_occurrence_date: nextOccurrenceDate,
          updated_at: new Date().toISOString(),
        })
        .eq("id", transaction.id);

      if (updateError) {
        results.push({
          id: transaction.id,
          status: "partial",
          message:
            "Created transaction but failed to update next occurrence date",
          new_transaction_id: newTransactionData.id,
        });
        continue;
      }

      results.push({
        id: transaction.id,
        status: "success",
        message: "Processed recurring transaction",
        new_transaction_id: newTransactionData.id,
        next_occurrence: nextOccurrenceDate,
      });
    }

    return NextResponse.json({
      processed: results.length,
      results,
    });
  } catch (error) {
    console.error("Error processing recurring transactions:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
