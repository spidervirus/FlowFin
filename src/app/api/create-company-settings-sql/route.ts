import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createServerClient } from '@supabase/supabase-js';

export async function POST(request: Request) {
  try {
    console.log("API route called: create-company-settings-sql");
    
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
      }
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
        { status: 401 }
      );
    }
    
    if (!user) {
      console.error("No user found");
      return NextResponse.json(
        { error: 'User not authenticated' },
        { status: 401 }
      );
    }
    
    console.log("User found:", user.id);
    
    try {
      // Execute a direct SQL query to insert the company settings
      const { data, error } = await supabaseAdmin.rpc('insert_company_settings', {
        user_id: user.id,
        company_name: 'My Company',
        country: 'United States',
        default_currency: 'USD',
        fiscal_year_start: '01'
      });
      
      if (error) {
        console.error("Error executing SQL function:", error);
        
        // Try a direct SQL query as a fallback
        const { error: sqlError } = await supabaseAdmin.from('company_settings').insert({
          user_id: user.id,
          company_name: 'My Company',
          country: 'United States',
          default_currency: 'USD',
          fiscal_year_start: '01',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
        
        if (sqlError) {
          console.error("Error with direct SQL insert:", sqlError);
          return NextResponse.json(
            { error: `Failed to create company settings: ${sqlError.message}` },
            { status: 500 }
          );
        }
        
        console.log("Company settings created with direct SQL insert");
        return NextResponse.json(
          { message: 'Company settings created with direct SQL insert' },
          { status: 201 }
        );
      }
      
      console.log("Company settings created with SQL function:", data);
      return NextResponse.json(
        { message: 'Company settings created with SQL function', data },
        { status: 201 }
      );
    } catch (innerError: any) {
      console.error("Error in SQL operations:", innerError);
      return NextResponse.json(
        { error: `Error in SQL operations: ${innerError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in create-company-settings-sql API route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 