import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServerClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    console.log("API route called: create-company-settings");

    // Get the current user from Supabase
    const supabase = await createClient();

    console.log(
      "Checking if service role key is defined:",
      !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    );

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

    // Try a direct SQL query to insert the company settings
    try {
      // First check if company settings already exist
      const { data: existingSettings, error: checkError } = await supabaseAdmin
        .from("company_settings")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (checkError) {
        console.error("Error checking existing settings:", checkError);
        return NextResponse.json(
          { error: `Error checking existing settings: ${checkError.message}` },
          { status: 500 },
        );
      }

      if (existingSettings) {
        console.log("Company settings already exist:", existingSettings);
        return NextResponse.json(
          { message: "Company settings already exist" },
          { status: 200 },
        );
      }

      console.log("No existing settings found, creating new settings");

      // Use a direct SQL query to insert the company settings
      const { error: sqlError } = await supabaseAdmin.rpc(
        "create_company_settings",
        {
          p_user_id: user.id,
          p_company_name: "My Company",
          p_country: "United States",
          p_default_currency: "USD",
          p_fiscal_year_start: "01",
        },
      );

      if (sqlError) {
        console.error("Error creating company settings with RPC:", sqlError);

        // Fallback to direct insert
        const { error: createError } = await supabaseAdmin
          .from("company_settings")
          .insert({
            user_id: user.id,
            company_name: "My Company",
            country: "United States",
            default_currency: "USD",
            fiscal_year_start: "01",
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          });

        if (createError) {
          console.error(
            "Error creating company settings with direct insert:",
            createError,
          );
          return NextResponse.json(
            {
              error: `Failed to create company settings: ${createError.message}`,
            },
            { status: 500 },
          );
        }
      }

      console.log("Company settings created successfully");
      return NextResponse.json(
        { message: "Company settings created successfully" },
        { status: 201 },
      );
    } catch (innerError: any) {
      console.error("Error in company settings operations:", innerError);
      return NextResponse.json(
        {
          error: `Error in company settings operations: ${innerError.message}`,
        },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Error in create-company-settings API route:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}
