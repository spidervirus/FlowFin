import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '../../../../../supabase/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    // Check authentication using Supabase directly
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session || !session.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = session.user.id;
    
    // Parse the request body
    const body = await request.json();
    
    // Validate required fields
    const { 
      description, 
      amount, 
      date, 
      account_id, 
      category_id, 
      items 
    } = body;
    
    if (!description || amount === undefined || !date || !account_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }
    
    // Get the Supabase client
    const serverSupabase = await createClient();
    
    // Create the main transaction
    const { data: transaction, error: transactionError } = await serverSupabase
      .from('transactions')
      .insert({
        id: uuidv4(),
        user_id: userId,
        description,
        amount,
        date,
        type: 'expense',
        account_id,
        category_id: category_id || null,
        status: 'completed',
        notes: body.notes || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();
    
    if (transactionError) {
      console.error('Error creating transaction:', transactionError);
      return NextResponse.json({ error: 'Failed to create transaction' }, { status: 500 });
    }
    
    // If there are line items, store them as well (if your database has a structure for this)
    if (items && Array.isArray(items) && items.length > 0) {
      // This is optional and depends on your database schema
      // For example, you might have a receipt_items table
      const { error: itemsError } = await serverSupabase
        .from('receipt_items')
        .insert(
          items.map(item => ({
            id: uuidv4(),
            transaction_id: transaction.id,
            description: item.description,
            amount: item.amount,
            user_id: userId,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }))
        );
      
      if (itemsError) {
        console.error('Error creating receipt items:', itemsError);
        // We don't return an error here since the main transaction was created successfully
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      transaction 
    });
    
  } catch (error) {
    console.error('Error creating transaction from receipt:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create transaction' },
      { status: 500 }
    );
  }
} 