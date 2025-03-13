import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../../supabase/server";

// GET /api/goals/contributions - Get contributions for a specific goal
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get query parameters
    const url = new URL(request.url);
    const goalId = url.searchParams.get("goal_id");

    if (!goalId) {
      return NextResponse.json(
        { error: "Goal ID is required" },
        { status: 400 }
      );
    }

    // Check if goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("financial_goals")
      .select()
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: "Goal not found or access denied" },
        { status: 404 }
      );
    }

    // Get contributions for the goal
    const { data: contributions, error } = await supabase
      .from("goal_contributions")
      .select(`
        *,
        transaction:transactions(*)
      `)
      .eq("goal_id", goalId)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching goal contributions:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(contributions);
  } catch (error) {
    console.error("Error in goal contributions GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch goal contributions" },
      { status: 500 }
    );
  }
}

// POST /api/goals/contributions - Add a contribution to a goal
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
    const body = await request.json();
    const { goal_id, amount, date, notes, transaction_id } = body;

    // Validate required fields
    if (!goal_id || !amount || !date) {
      return NextResponse.json(
        { error: "Goal ID, amount, and date are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Check if goal exists and belongs to user
    const { data: goal, error: goalError } = await supabase
      .from("financial_goals")
      .select()
      .eq("id", goal_id)
      .eq("user_id", user.id)
      .single();

    if (goalError || !goal) {
      return NextResponse.json(
        { error: "Goal not found or access denied" },
        { status: 404 }
      );
    }

    // If transaction_id is provided, check if it exists and belongs to user
    if (transaction_id) {
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .select()
        .eq("id", transaction_id)
        .eq("user_id", user.id)
        .single();

      if (transactionError || !transaction) {
        return NextResponse.json(
          { error: "Transaction not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Add contribution
    const { data: contribution, error } = await supabase
      .from("goal_contributions")
      .insert({
        goal_id,
        amount,
        date,
        notes,
        transaction_id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error adding goal contribution:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get updated goal with new current_amount
    const { data: updatedGoal, error: updateError } = await supabase
      .from("financial_goals")
      .select()
      .eq("id", goal_id)
      .single();

    if (updateError) {
      console.error("Error fetching updated goal:", updateError);
    }

    return NextResponse.json({
      contribution,
      goal: updatedGoal || null,
    });
  } catch (error) {
    console.error("Error in goal contribution POST:", error);
    return NextResponse.json(
      { error: "Failed to add goal contribution" },
      { status: 500 }
    );
  }
}

// PUT /api/goals/contributions - Update a contribution
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Contribution ID is required" },
      { status: 400 }
    );
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { amount, date, notes, transaction_id } = body;

    // Validate required fields
    if (!amount || !date) {
      return NextResponse.json(
        { error: "Amount and date are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    // Check if contribution exists and belongs to user's goal
    const { data: existingContribution, error: fetchError } = await supabase
      .from("goal_contributions")
      .select(`
        *,
        goal:financial_goals!goal_contributions_goal_id_fkey(user_id)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !existingContribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      );
    }

    // Check if the goal belongs to the user
    if (existingContribution.goal.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    // If transaction_id is provided, check if it exists and belongs to user
    if (transaction_id && transaction_id !== existingContribution.transaction_id) {
      const { data: transaction, error: transactionError } = await supabase
        .from("transactions")
        .select()
        .eq("id", transaction_id)
        .eq("user_id", user.id)
        .single();

      if (transactionError || !transaction) {
        return NextResponse.json(
          { error: "Transaction not found or access denied" },
          { status: 404 }
        );
      }
    }

    // Update contribution
    const { data: contribution, error } = await supabase
      .from("goal_contributions")
      .update({
        amount,
        date,
        notes,
        transaction_id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating goal contribution:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get updated goal with new current_amount
    const { data: updatedGoal, error: updateError } = await supabase
      .from("financial_goals")
      .select()
      .eq("id", existingContribution.goal_id)
      .single();

    if (updateError) {
      console.error("Error fetching updated goal:", updateError);
    }

    return NextResponse.json({
      contribution,
      goal: updatedGoal || null,
    });
  } catch (error) {
    console.error("Error in goal contribution PUT:", error);
    return NextResponse.json(
      { error: "Failed to update goal contribution" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals/contributions - Delete a contribution
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json(
      { error: "Contribution ID is required" },
      { status: 400 }
    );
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if contribution exists and belongs to user's goal
    const { data: existingContribution, error: fetchError } = await supabase
      .from("goal_contributions")
      .select(`
        *,
        goal:financial_goals!goal_contributions_goal_id_fkey(user_id)
      `)
      .eq("id", id)
      .single();

    if (fetchError || !existingContribution) {
      return NextResponse.json(
        { error: "Contribution not found" },
        { status: 404 }
      );
    }

    // Check if the goal belongs to the user
    if (existingContribution.goal.user_id !== user.id) {
      return NextResponse.json(
        { error: "Access denied" },
        { status: 403 }
      );
    }

    const goalId = existingContribution.goal_id;

    // Delete contribution
    const { error } = await supabase
      .from("goal_contributions")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Error deleting goal contribution:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get updated goal with new current_amount
    const { data: updatedGoal, error: updateError } = await supabase
      .from("financial_goals")
      .select()
      .eq("id", goalId)
      .single();

    if (updateError) {
      console.error("Error fetching updated goal:", updateError);
    }

    return NextResponse.json({
      success: true,
      goal: updatedGoal || null,
    });
  } catch (error) {
    console.error("Error in goal contribution DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete goal contribution" },
      { status: 500 }
    );
  }
} 