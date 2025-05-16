import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

export async function POST(request: Request) {
  try {
    console.log("API route called: create-company-settings-raw");

    // Get the current user from Supabase
    const supabase = await createClient();

    // Create a Supabase client with the service role key to bypass RLS
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
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

    try {
      // Check if company settings already exist
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

      // Execute a raw SQL query to insert the company settings
      const now = new Date().toISOString();
      const { data, error } = await supabaseAdmin.rpc("execute_sql", {
        sql_query: `
          INSERT INTO company_settings (
            user_id, 
            company_name, 
            country, 
            default_currency, 
            fiscal_year_start, 
            created_at, 
            updated_at
          ) 
          VALUES (
            '${user.id}', 
            'My Company', 
            'United States', 
            'USD', 
            '01', 
            '${now}', 
            '${now}'
          )
          RETURNING id;
        `,
      });

      if (error) {
        console.error("Error executing raw SQL:", error);
        return NextResponse.json(
          { error: `Failed to create company settings: ${error.message}` },
          { status: 500 },
        );
      }

      console.log("Company settings created with raw SQL:", data);
      return NextResponse.json(
        { message: "Company settings created with raw SQL", data },
        { status: 201 },
      );
    } catch (innerError: any) {
      console.error("Error in SQL operations:", innerError);
      return NextResponse.json(
        { error: `Error in SQL operations: ${innerError.message}` },
        { status: 500 },
      );
    }
  } catch (error: any) {
    console.error("Error in create-company-settings-raw API route:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}
