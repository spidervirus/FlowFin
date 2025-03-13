import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

// GET /api/goals - Get all financial goals for the current user
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
    const active = url.searchParams.get("active");
    const completed = url.searchParams.get("completed");
    const categoryId = url.searchParams.get("category_id");
    const withContributions = url.searchParams.get("with_contributions") === "true";

    // Build query
    let query = supabase
      .from("financial_goals")
      .select(`
        *,
        category:categories(*)
        ${withContributions ? `, contributions:goal_contributions(*)` : ""}
      `)
      .eq("user_id", user.id)
      .order("target_date", { ascending: true });

    // Apply filters
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    if (completed === "true") {
      query = query.eq("is_completed", true);
    } else if (completed === "false") {
      query = query.eq("is_completed", false);
    }

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    const { data: goals, error } = await query;

    if (error) {
      console.error("Error fetching financial goals:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(goals);
  } catch (error) {
    console.error("Error in financial goals GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch financial goals" },
      { status: 500 }
    );
  }
}

// POST /api/goals - Create a new financial goal
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
    const {
      name,
      description,
      target_amount,
      start_date,
      target_date,
      category_id,
      icon,
      color,
    } = body;

    // Validate required fields
    if (!name || !target_amount || !start_date || !target_date) {
      return NextResponse.json(
        { error: "Name, target amount, start date, and target date are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(target_amount) || target_amount <= 0) {
      return NextResponse.json(
        { error: "Target amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const targetDate = new Date(target_date);
    const currentDate = new Date();

    if (isNaN(startDate.getTime()) || isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (targetDate < startDate) {
      return NextResponse.json(
        { error: "Target date must be after start date" },
        { status: 400 }
      );
    }

    // Create financial goal
    const { data: goal, error } = await supabase
      .from("financial_goals")
      .insert({
        name,
        description,
        target_amount,
        start_date,
        target_date,
        category_id,
        icon,
        color,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating financial goal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error in financial goal POST:", error);
    return NextResponse.json(
      { error: "Failed to create financial goal" },
      { status: 500 }
    );
  }
}

// PUT /api/goals - Update a financial goal
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
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
    const {
      name,
      description,
      target_amount,
      start_date,
      target_date,
      category_id,
      is_active,
      icon,
      color,
    } = body;

    // Validate required fields
    if (!name || !target_amount || !start_date || !target_date) {
      return NextResponse.json(
        { error: "Name, target amount, start date, and target date are required" },
        { status: 400 }
      );
    }

    // Validate amount
    if (isNaN(target_amount) || target_amount <= 0) {
      return NextResponse.json(
        { error: "Target amount must be a positive number" },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(start_date);
    const targetDate = new Date(target_date);

    if (isNaN(startDate.getTime()) || isNaN(targetDate.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (targetDate < startDate) {
      return NextResponse.json(
        { error: "Target date must be after start date" },
        { status: 400 }
      );
    }

    // Check if goal exists and belongs to user
    const { data: existingGoal, error: fetchError } = await supabase
      .from("financial_goals")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { error: "Goal not found or access denied" },
        { status: 404 }
      );
    }

    // Update financial goal
    const { data: goal, error } = await supabase
      .from("financial_goals")
      .update({
        name,
        description,
        target_amount,
        start_date,
        target_date,
        category_id,
        is_active: is_active !== undefined ? is_active : existingGoal.is_active,
        icon,
        color,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating financial goal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(goal);
  } catch (error) {
    console.error("Error in financial goal PUT:", error);
    return NextResponse.json(
      { error: "Failed to update financial goal" },
      { status: 500 }
    );
  }
}

// DELETE /api/goals - Delete a financial goal
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Goal ID is required" }, { status: 400 });
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if goal exists and belongs to user
    const { data: existingGoal, error: fetchError } = await supabase
      .from("financial_goals")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingGoal) {
      return NextResponse.json(
        { error: "Goal not found or access denied" },
        { status: 404 }
      );
    }

    // Delete goal (this will cascade delete contributions due to foreign key constraint)
    const { error } = await supabase.from("financial_goals").delete().eq("id", id);

    if (error) {
      console.error("Error deleting financial goal:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in financial goal DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete financial goal" },
      { status: 500 }
    );
  }
} 