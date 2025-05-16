import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  try {
    console.log("Testing service role key");

    // Check if the service role key is defined
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("Service role key is not defined");
      return NextResponse.json(
        { error: "Service role key is not defined" },
        { status: 500 },
      );
    }

    // Create a Supabase client with the service role key
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

    // Try to access a table that requires admin privileges
    const { data, error } = await supabaseAdmin
      .from("company_settings")
      .select("id")
      .limit(1);

    if (error) {
      console.error("Error accessing company_settings table:", error);
      return NextResponse.json(
        { error: `Error accessing company_settings table: ${error.message}` },
        { status: 500 },
      );
    }

    console.log("Successfully accessed company_settings table:", data);

    return NextResponse.json(
      {
        message: "Service role key is working correctly",
        data,
        serviceRoleKeyDefined: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        supabaseUrlDefined: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error in test-service-role API route:", error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 },
    );
  }
}
