import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

// GET /api/categories - Get all categories for the current user
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
    const type = url.searchParams.get("type");
    const active = url.searchParams.get("active");

    // Build query
    let query = supabase
      .from("categories")
      .select("*")
      .eq("user_id", user.id)
      .order("name", { ascending: true });

    // Filter by type if provided
    if (type === "income" || type === "expense") {
      query = query.eq("type", type);
    }

    // Filter by active status if provided
    if (active === "true") {
      query = query.eq("is_active", true);
    } else if (active === "false") {
      query = query.eq("is_active", false);
    }

    const { data: categories, error } = await query;

    if (error) {
      console.error("Error fetching categories:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(categories);
  } catch (error) {
    console.error("Error in categories GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch categories" },
      { status: 500 }
    );
  }
}

// POST /api/categories - Create a new category
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
    const { name, type, color, parent_id } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    // Check if type is valid
    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Type must be 'income' or 'expense'" },
        { status: 400 }
      );
    }

    // Create category
    const { data: category, error } = await supabase
      .from("categories")
      .insert({
        name,
        type,
        color,
        parent_id,
        user_id: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error in category POST:", error);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 500 }
    );
  }
}

// PUT /api/categories/:id - Update a category
export async function PUT(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
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
    const { name, type, color, parent_id, is_active } = body;

    // Validate required fields
    if (!name || !type) {
      return NextResponse.json(
        { error: "Name and type are required" },
        { status: 400 }
      );
    }

    // Check if type is valid
    if (type !== "income" && type !== "expense") {
      return NextResponse.json(
        { error: "Type must be 'income' or 'expense'" },
        { status: 400 }
      );
    }

    // Check if category exists and belongs to user
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingCategory) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    // Update category
    const { data: category, error } = await supabase
      .from("categories")
      .update({
        name,
        type,
        color,
        parent_id,
        is_active,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Error updating category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error("Error in category PUT:", error);
    return NextResponse.json(
      { error: "Failed to update category" },
      { status: 500 }
    );
  }
}

// DELETE /api/categories/:id - Delete a category
export async function DELETE(request: NextRequest) {
  const supabase = await createClient();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Category ID is required" }, { status: 400 });
  }

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Check if category exists and belongs to user
    const { data: existingCategory, error: fetchError } = await supabase
      .from("categories")
      .select()
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (fetchError || !existingCategory) {
      return NextResponse.json(
        { error: "Category not found or access denied" },
        { status: 404 }
      );
    }

    // Check if category is used in transactions
    const { count: transactionCount, error: countError } = await supabase
      .from("transactions")
      .select("*", { count: "exact", head: true })
      .eq("category_id", id);

    if (countError) {
      console.error("Error checking transactions:", countError);
      return NextResponse.json(
        { error: "Failed to check if category is in use" },
        { status: 500 }
      );
    }

    if (transactionCount && transactionCount > 0) {
      return NextResponse.json(
        {
          error: "Cannot delete category that is used in transactions",
          count: transactionCount,
        },
        { status: 400 }
      );
    }

    // Delete category
    const { error } = await supabase.from("categories").delete().eq("id", id);

    if (error) {
      console.error("Error deleting category:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in category DELETE:", error);
    return NextResponse.json(
      { error: "Failed to delete category" },
      { status: 500 }
    );
  }
} 