import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";
import { RateLimiter } from '@/lib/utils/rate-limit';
import { validateCsrfToken } from '@/lib/utils/csrf';

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

export async function POST(request: NextRequest) {
  const supabase = await createClient();

  try {
    // Get form data
    const formData = await request.formData();

    // Get user ID from form data or from authenticated user
    let userId = formData.get("user_id") as string;

    // If no user ID in form data, try to get from authenticated user
    if (!userId) {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
      } else {
        return NextResponse.json(
          { error: "User ID is required" },
          { status: 401 },
        );
      }
    }

    // Extract transaction data
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const type = formData.get("type") as string;
    const category_id = formData.get("category_id") as string | null;
    // Handle missing or "uncategorized" value as null
    const effective_category_id =
      category_id &&
      category_id !== "uncategorized" &&
      category_id.trim() !== ""
        ? category_id
        : null;
    const account_id = formData.get("account_id") as string;
    const notes = (formData.get("notes") as string) || null;

    // Log the category information for debugging
    console.log("Category ID from form:", category_id);
    console.log("Effective category ID:", effective_category_id);

    // Extract recurring transaction data
    const is_recurring = formData.get("is_recurring") === "on";
    let recurrence_frequency = null;
    let recurrence_start_date = null;
    let recurrence_end_date = null;
    let next_occurrence_date = null;

    if (is_recurring) {
      recurrence_frequency = formData.get("recurrence_frequency") as string;
      recurrence_start_date = formData.get("recurrence_start_date") as string;

      // Handle optional end date
      const endDateValue = formData.get("recurrence_end_date");
      recurrence_end_date =
        endDateValue && endDateValue !== "" ? (endDateValue as string) : null;

      // Calculate next occurrence date if we have valid data
      if (recurrence_frequency && recurrence_start_date) {
        next_occurrence_date = calculateNextOccurrenceDate(
          recurrence_start_date || date,
          recurrence_frequency,
        );
      }
    }

    // Validate required fields
    if (!date || !description || isNaN(amount) || !type || !account_id) {
      return NextResponse.json(
        { error: "Date, description, amount, type, and account are required" },
        { status: 400 },
      );
    }

    // Validate recurring transaction fields if is_recurring is true
    if (is_recurring && !recurrence_frequency) {
      return NextResponse.json(
        { error: "Frequency is required for recurring transactions" },
        { status: 400 },
      );
    }

    // Get current account balance
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", account_id)
      .single();

    if (accountError) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Calculate new balance
    let newBalance = account.balance;
    if (type === "income") {
      newBalance += amount;
    } else if (type === "expense") {
      newBalance -= amount;
    }

    // Start a transaction
    // First update the account balance
    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", account_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update account balance" },
        { status: 500 },
      );
    }

    // Then create the transaction
    const transactionData = {
      date,
      description,
      amount,
      type,
      category_id: effective_category_id,
      account_id,
      status: "completed",
      notes,
      is_recurring,
      recurrence_frequency,
      recurrence_start_date: recurrence_start_date || date,
      recurrence_end_date,
      next_occurrence_date,
      user_id: userId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    console.log("Inserting transaction with data:", transactionData);

    // First insert the transaction without selecting
    const { error: insertError } = await supabase
      .from("transactions")
      .insert([transactionData]);

    if (insertError) {
      console.error("Error creating transaction:", insertError);

      // Rollback the account balance update
      await supabase
        .from("accounts")
        .update({
          balance: account.balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account_id);

      return NextResponse.json(
        { error: "Failed to create transaction: " + insertError.message },
        { status: 500 },
      );
    }

    // Then fetch the created transaction ID
    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("id")
      .eq("user_id", userId)
      .eq("date", date)
      .eq("description", description)
      .eq("amount", amount)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (fetchError) {
      console.error("Error fetching created transaction:", fetchError);
      return NextResponse.json(
        {
          success: true,
          message:
            "Transaction created successfully, but could not retrieve ID",
        },
        { status: 201 },
      );
    }

    // Return success response with the created transaction ID
    return NextResponse.json(
      {
        success: true,
        message: "Transaction created successfully",
        data: { id: data.id },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient();

  // --- Rate limiting ---
  const rateLimiter = new RateLimiter();
  const rateLimitResult = await rateLimiter.check(request, 'api');
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  // --- CSRF validation ---
  const csrfResult = await validateCsrfToken(request);
  if (!csrfResult.success) {
    return NextResponse.json({ error: 'Invalid CSRF token.' }, { status: 403 });
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get JSON data
    const { id, category_id, ...otherUpdates } = await request.json();

    // Handle category_id correctly
    const updates = {
      ...otherUpdates,
      category_id:
        category_id &&
        category_id !== "uncategorized" &&
        category_id.trim() !== ""
          ? category_id
          : null,
    };

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    // Get the original transaction
    const { data: originalTransaction, error: getError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (getError) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // If amount, type, or account_id is changing, update account balances
    if (
      updates.amount !== undefined ||
      updates.type !== undefined ||
      updates.account_id !== undefined
    ) {
      // Get original account balance
      const { data: originalAccount, error: originalAccountError } =
        await supabase
          .from("accounts")
          .select("balance")
          .eq("id", originalTransaction.account_id)
          .single();

      if (originalAccountError) {
        return NextResponse.json(
          { error: "Original account not found" },
          { status: 404 },
        );
      }

      // Revert the effect of the original transaction
      let originalAccountNewBalance = originalAccount.balance;
      if (originalTransaction.type === "income") {
        originalAccountNewBalance -= originalTransaction.amount;
      } else if (originalTransaction.type === "expense") {
        originalAccountNewBalance += originalTransaction.amount;
      }

      // Update original account balance
      const { error: updateOriginalError } = await supabase
        .from("accounts")
        .update({
          balance: originalAccountNewBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", originalTransaction.account_id);

      if (updateOriginalError) {
        return NextResponse.json(
          { error: "Failed to update original account balance" },
          { status: 500 },
        );
      }

      // If account changed, apply new transaction to new account
      const targetAccountId =
        updates.account_id || originalTransaction.account_id;
      const transactionType = updates.type || originalTransaction.type;
      const transactionAmount = updates.amount || originalTransaction.amount;

      // Get target account balance
      const { data: targetAccount, error: targetAccountError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", targetAccountId)
        .single();

      if (targetAccountError) {
        return NextResponse.json(
          { error: "Target account not found" },
          { status: 404 },
        );
      }

      // Apply the effect of the updated transaction
      let targetAccountNewBalance = targetAccount.balance;
      if (transactionType === "income") {
        targetAccountNewBalance += transactionAmount;
      } else if (transactionType === "expense") {
        targetAccountNewBalance -= transactionAmount;
      }

      // Update target account balance
      const { error: updateTargetError } = await supabase
        .from("accounts")
        .update({
          balance: targetAccountNewBalance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", targetAccountId);

      if (updateTargetError) {
        return NextResponse.json(
          { error: "Failed to update target account balance" },
          { status: 500 },
        );
      }
    }

    // Update the transaction
    const { error: updateError } = await supabase
      .from("transactions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (updateError) {
      console.error("Error updating transaction:", updateError);
      return NextResponse.json(
        { error: "Failed to update transaction: " + updateError.message },
        { status: 500 },
      );
    }

    // Fetch the updated transaction
    const { data, error: fetchError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError) {
      return NextResponse.json(
        {
          success: true,
          message:
            "Transaction updated successfully, but could not retrieve updated data",
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  // --- Rate limiting ---
  const rateLimiter = new RateLimiter();
  const rateLimitResult = await rateLimiter.check(request, 'api');
  if (!rateLimitResult.success) {
    return NextResponse.json({ error: 'Too many requests. Please try again later.' }, { status: 429 });
  }
  // --- CSRF validation ---
  const csrfResult = await validateCsrfToken(request);
  if (!csrfResult.success) {
    return NextResponse.json({ error: 'Invalid CSRF token.' }, { status: 403 });
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get transaction ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Transaction ID is required" },
        { status: 400 },
      );
    }

    // Get the transaction to adjust account balance
    const { data: transaction, error: getError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (getError) {
      return NextResponse.json(
        { error: "Transaction not found" },
        { status: 404 },
      );
    }

    // Get current account balance
    const { data: account, error: accountError } = await supabase
      .from("accounts")
      .select("balance")
      .eq("id", transaction.account_id)
      .single();

    if (accountError) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Calculate new balance
    let newBalance = account.balance;
    if (transaction.type === "income") {
      newBalance -= transaction.amount;
    } else if (transaction.type === "expense") {
      newBalance += transaction.amount;
    }

    // Update account balance
    const { error: updateError } = await supabase
      .from("accounts")
      .update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      })
      .eq("id", transaction.account_id);

    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update account balance" },
        { status: 500 },
      );
    }

    // Delete the transaction
    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete transaction" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
