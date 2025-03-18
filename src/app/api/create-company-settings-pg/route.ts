import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { Pool } from 'pg';

export async function POST(request: Request) {
  try {
    console.log("API route called: create-company-settings-pg");
    
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
      // Create a connection to the database
      const pool = new Pool({
        connectionString: process.env.SUPABASE_CONNECTION_STRING,
      });
      
      // Check if company settings already exist
      const checkResult = await pool.query(
        'SELECT id FROM company_settings WHERE user_id = $1',
        [user.id]
      );
      
      if (checkResult.rows.length > 0) {
        console.log("Company settings already exist:", checkResult.rows[0]);
        await pool.end();
        return NextResponse.json(
          { message: 'Company settings already exist' },
          { status: 200 }
        );
      }
      
      // Insert company settings
      const now = new Date().toISOString();
      const result = await pool.query(
        `INSERT INTO company_settings (
          user_id, 
          company_name, 
          country, 
          default_currency, 
          fiscal_year_start, 
          created_at, 
          updated_at
        ) 
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING id`,
        [
          user.id,
          'My Company',
          'United States',
          'USD',
          '01',
          now,
          now
        ]
      );
      
      await pool.end();
      
      console.log("Company settings created with pg client:", result.rows[0]);
      return NextResponse.json(
        { message: 'Company settings created with pg client', data: result.rows[0] },
        { status: 201 }
      );
    } catch (innerError: any) {
      console.error("Error in pg operations:", innerError);
      return NextResponse.json(
        { error: `Error in pg operations: ${innerError.message}` },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error in create-company-settings-pg API route:', error);
    return NextResponse.json(
      { error: `Internal server error: ${error.message}` },
      { status: 500 }
    );
  }
} 