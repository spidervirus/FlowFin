import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../../supabase/server";

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
    // Get form data
    const formData = await request.formData();
    
    // Extract transaction data
    const date = formData.get('date') as string;
    const description = formData.get('description') as string;
    const amount = parseFloat(formData.get('amount') as string);
    const type = formData.get('type') as string;
    const category_id = formData.get('category') as string || null;
    const account_id = formData.get('account_id') as string;
    const notes = formData.get('notes') as string || null;
    
    // Validate required fields
    if (!date || !description || isNaN(amount) || !type || !account_id) {
      return NextResponse.json(
        { error: "Date, description, amount, type, and account are required" },
        { status: 400 }
      );
    }
    
    // Get current account balance
    const { data: account, error: accountError } = await supabase
      .from('accounts')
      .select('balance')
      .eq('id', account_id)
      .single();
    
    if (accountError) {
      return NextResponse.json(
        { error: "Account not found" },
        { status: 404 }
      );
    }
    
    // Calculate new balance
    let newBalance = account.balance;
    if (type === 'income') {
      newBalance += amount;
    } else if (type === 'expense') {
      newBalance -= amount;
    }
    
    // Start a transaction
    // First update the account balance
    const { error: updateError } = await supabase
      .from('accounts')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', account_id);
    
    if (updateError) {
      return NextResponse.json(
        { error: "Failed to update account balance" },
        { status: 500 }
      );
    }
    
    // Then create the transaction
    const { data, error } = await supabase
      .from('transactions')
      .insert([
        {
          date,
          description,
          amount,
          type,
          category_id,
          account_id,
