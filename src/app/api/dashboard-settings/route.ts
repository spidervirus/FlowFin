import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

// GET /api/dashboard-settings - Get dashboard settings for the current user
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
    // Get dashboard settings
    const { data: settings, error } = await supabase
      .from("dashboard_settings")
      .select()
      .eq("user_id", user.id)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error, which is expected if user has no settings yet
      console.error("Error fetching dashboard settings:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If no settings exist, create default settings
    if (!settings) {
      const defaultSettings = {
        user_id: user.id,
        layout: {},
        theme: "light",
        default_view: "monthly",
        widgets: [
          {
            id: "financial-overview",
            position: 0,
            visible: true,
          },
          {
            id: "recent-transactions",
            position: 1,
            visible: true,
          },
          {
            id: "accounts-summary",
            position: 2,
            visible: true,
          },
          {
            id: "budget-overview",
            position: 3,
            visible: true,
          },
          {
            id: "cash-flow",
            position: 4,
            visible: true,
          },
        ],
      };

      const { data: newSettings, error: insertError } = await supabase
        .from("dashboard_settings")
        .insert(defaultSettings)
        .select()
        .single();

      if (insertError) {
        console.error("Error creating default dashboard settings:", insertError);
        return NextResponse.json(
          { error: insertError.message },
          { status: 500 }
        );
      }

      return NextResponse.json(newSettings);
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error in dashboard settings GET:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard settings" },
      { status: 500 }
    );
  }
}

// PUT /api/dashboard-settings - Update dashboard settings
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
    const body = await request.json();
    const { layout, theme, default_view, widgets } = body;

    // Check if settings exist
    const { data: existingSettings, error: fetchError } = await supabase
      .from("dashboard_settings")
      .select()
      .eq("user_id", user.id)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      console.error("Error fetching dashboard settings:", fetchError);
      return NextResponse.json(
        { error: fetchError.message },
        { status: 500 }
      );
    }

    // Update or insert settings
    const updateData: any = {};
    if (layout !== undefined) updateData.layout = layout;
    if (theme !== undefined) updateData.theme = theme;
    if (default_view !== undefined) updateData.default_view = default_view;
    if (widgets !== undefined) updateData.widgets = widgets;

    let result;
    if (existingSettings) {
      // Update existing settings
      const { data, error } = await supabase
        .from("dashboard_settings")
        .update(updateData)
        .eq("user_id", user.id)
        .select()
        .single();

      if (error) {
        console.error("Error updating dashboard settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    } else {
      // Create new settings
      updateData.user_id = user.id;
      const { data, error } = await supabase
        .from("dashboard_settings")
        .insert(updateData)
        .select()
        .single();

      if (error) {
        console.error("Error creating dashboard settings:", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      result = data;
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in dashboard settings PUT:", error);
    return NextResponse.json(
      { error: "Failed to update dashboard settings" },
      { status: 500 }
    );
  }
} 