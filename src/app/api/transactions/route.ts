import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

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
    // Get form data
    const formData = await request.formData();

    // Extract transaction data
    const date = formData.get("date") as string;
    const description = formData.get("description") as string;
    const amount = parseFloat(formData.get("amount") as string);
    const type = formData.get("type") as string;
    const category_id = (formData.get("category") as string) || null;
    const account_id = formData.get("account_id") as string;
    const notes = (formData.get("notes") as string) || null;

    // Validate required fields
    if (!date || !description || isNaN(amount) || !type || !account_id) {
      return NextResponse.json(
        { error: "Date, description, amount, type, and account are required" },
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
    const { data, error } = await supabase
      .from("transactions")
      .insert([
        {
          date,
          description,
          amount,
          type,
          category_id,
          account_id,
          status: "completed",
          notes,
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("Error creating transaction:", error);

      // Rollback the account balance update
      await supabase
        .from("accounts")
        .update({
          balance: account.balance,
          updated_at: new Date().toISOString(),
        })
        .eq("id", account_id);

      return NextResponse.json(
        { error: "Failed to create transaction" },
        { status: 500 },
      );
    }

    // Redirect to the transactions page
    return NextResponse.redirect(
      new URL(`/dashboard/transactions`, request.url),
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

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get JSON data
    const { id, ...updates } = await request.json();

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
    const { data, error } = await supabase
      .from("transactions")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update transaction" },
        { status: 500 },
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
