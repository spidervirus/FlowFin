import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    console.log("API route called: check-company-settings");

    // Get the current user from Supabase
    const supabase = await createClient();

    // Get the user
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError) {
      console.error("Error getting user:", userError);
      return NextResponse.json(
        { error: `Error getting user: ${userError.message}` },
        { status: 401 },
      );
    }

    if (!user) {
      console.error("No user found");
      return NextResponse.json(
        { error: "User not authenticated" },
        { status: 401 },
      );
    }

    console.log("User found:", user.id);

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            Accept: "application/json, application/vnd.pgrst.object+json",
            "Content-Type": "application/json",
          },
        },
      },
    );

    // Check if company settings exist
    const { data: settings, error: settingsError } = await supabaseAdmin
      .from("company_settings")
      .select("id, company_name, country, default_currency, fiscal_year_start")
      .eq("user_id", user.id)
      .maybeSingle();

    if (settingsError) {
      console.error("Error checking company settings:", settingsError);
      return NextResponse.json(
        { error: `Error checking company settings: ${settingsError.message}` },
        { status: 500 },
      );
    }

    if (!settings) {
      console.log("No company settings found for user:", user.id);
      return NextResponse.json(
        { exists: false, message: "No company settings found" },
        { status: 200 },
      );
    }

    console.log("Company settings found:", settings);
    return NextResponse.json({ exists: true, settings }, { status: 200 });
  } catch (error: any) {
    console.error("Error in check-company-settings API route:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}
