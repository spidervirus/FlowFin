import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

// GET /api/budgets - Get all budgets for the current user
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
    const month = url.searchParams.get("month");

    // Build query
    let query = supabase
      .from("budgets")
      .select(`
        *,
        budget_categories(
          id,
          amount,
          category:categories(id, name, type, color)
        )
      `)
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Filter by active status if provided
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    // Filter by month if provided
    if (month) {
      const monthDate = new Date(month);
      query = query.lte("start_date", monthDate).gte("end_date", monthDate);
    }

    const { data: budgets, error } = await query;

    if (error) {
      console.error("Error fetching budgets:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get budget tracking data if month is specified
    if (month && budgets.length > 0) {
      const budgetIds = budgets.map((budget) => budget.id);
      const monthDate = new Date(month);
      const firstDayOfMonth = new Date(
        monthDate.getFullYear(),
        monthDate.getMonth(),
        1
      ).toISOString().split("T")[0];

      const { data: tracking, error: trackingError } = await supabase
        .from("budget_tracking")
        .select(`
          *,
          category:categories(id, name, type, color)
        `)
        .in("budget_id", budgetIds)
        .eq("month", firstDayOfMonth);

      if (trackingError) {
        console.error("Error fetching budget tracking:", trackingError);
      } else {
        // Add tracking data to each budget
        budgets.forEach((budget) => {
          budget.tracking = tracking.filter(
            (item) => item.budget_id === budget.id
          );
        });
      }
    }

    return NextResponse.json(budgets);
  } catch (error) {
    console.error("Error in budget GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch budgets" },
      { status: 500 }
    );
  }
}

// POST /api/budgets - Create a new budget
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
      start_date,
      end_date,
      is_recurring,
      recurrence_period,
      categories,
    } = body;

    // Validate required fields
    if (!name || !start_date || !end_date || !categories || categories.length === 0) {
      return NextResponse.json(
        {
          error:
            "Name, start date, end date, and at least one category are required",
        },
        { status: 400 }
      );
    }

    // Create budget
    const { data: budget, error } = await supabase
      .from("budgets")
      .insert({
        name,
        description,
        start_date,
        end_date,
        is_recurring,
        recurrence_period,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating budget:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Create budget categories
    const budgetCategories = categories.map((category: any) => ({
      budget_id: budget.id,
      category_id: category.id,
      amount: category.amount,
    }));

    const { error: categoriesError } = await supabase
      .from("budget_categories")
      .insert(budgetCategories);

    if (categoriesError) {
      console.error("Error creating budget categories:", categoriesError);
      // Delete the budget if categories couldn't be created
      await supabase.from("budgets").delete().eq("id", budget.id);
      return NextResponse.json(
        { error: categoriesError.message },
        { status: 500 }
      );
    }

    // Initialize budget tracking for current month if budget is active now
    const currentDate = new Date();
    const currentMonth = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      1
    ).toISOString().split("T")[0];
    
    const startDate = new Date(start_date);
    const endDate = new Date(end_date);
    
    if (currentDate >= startDate && currentDate <= endDate) {
      const trackingData = categories.map((category: any) => ({
        budget_id: budget.id,
        category_id: category.id,
        month: currentMonth,
        planned_amount: category.amount,
        actual_amount: 0, // Will be updated by trigger if transactions exist
      }));

      const { error: trackingError } = await supabase
        .from("budget_tracking")
        .insert(trackingData);

      if (trackingError) {
        console.error("Error initializing budget tracking:", trackingError);
      }
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error in budget POST:", error);
    return NextResponse.json(
      { error: "Failed to create budget" },
      { status: 500 }
    );
  }
}

// PUT /api/budgets/:id - Update a budget
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.pathname.split("/").pop();

  if (!id) {
    return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
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
      start_date,
      end_date,
      is_recurring,
      recurrence_period,
      is_active,
      categories,
    } = body;

    // Validate required fields
    if (!name || !start_date || !end_date) {
      return NextResponse.json(
        { error: "Name, start date, and end date are required" },
        { status: 400 }
      );
    }

    // Check if budget exists and belongs to user
    const { data: existingBudget, error: fetchError } = await supabase
      .from("budgets")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingBudget) {
      return NextResponse.json(
        { error: "Budget not found or access denied" },
        { status: 404 }
      );
    }

    // Update budget
    const { data: budget, error } = await supabase
      .from("budgets")
      .update({
        name,
        description,
        start_date,
        end_date,
        is_recurring,
        recurrence_period,
        is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating budget:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Update categories if provided
    if (categories && categories.length > 0) {
      // Delete existing categories
      await supabase.from("budget_categories").delete().eq("budget_id", id);

      // Create new categories
      const budgetCategories = categories.map((category: any) => ({
        budget_id: id,
        category_id: category.id,
        amount: category.amount,
      }));

      const { error: categoriesError } = await supabase
        .from("budget_categories")
        .insert(budgetCategories);

      if (categoriesError) {
        console.error("Error updating budget categories:", categoriesError);
        return NextResponse.json(
          { error: categoriesError.message },
          { status: 500 }
        );
      }

      // Update tracking data for current month if budget is active
      if (is_active) {
        const currentDate = new Date();
        const currentMonth = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        ).toISOString().split("T")[0];
        
        // Delete existing tracking for this month
        await supabase
          .from("budget_tracking")
          .delete()
          .eq("budget_id", id)
          .eq("month", currentMonth);
        
        // Create new tracking entries
        const trackingData = categories.map((category: any) => ({
          budget_id: id,
          category_id: category.id,
          month: currentMonth,
          planned_amount: category.amount,
          actual_amount: 0, // Will be updated by trigger if transactions exist
        }));

        await supabase.from("budget_tracking").insert(trackingData);
      }
    }

    return NextResponse.json(budget);
  } catch (error) {
    console.error("Error in budget PUT:", error);
    return NextResponse.json(
      { error: "Failed to update budget" },
      { status: 500 }
    );
  }
}

// DELETE /api/budgets/:id - Delete a budget
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Budget ID is required" }, { status: 400 });
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if budget exists and belongs to user
    const { data: existingBudget, error: fetchError } = await supabase
      .from("budgets")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingBudget) {
      return NextResponse.json(
        { error: "Budget not found or access denied" },
        { status: 404 }
      );
    }

    // Delete budget (cascade will delete categories and tracking)
    const { error } = await supabase.from("budgets").delete().eq("id", id);

    if (error) {
      console.error("Error deleting budget:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in budget DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete budget" },
      { status: 500 }
    );
  }
} 