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

    // Extract invoice data
    const invoice_number = formData.get("invoice_number") as string;
    const date = formData.get("date") as string;
    const due_date = formData.get("due_date") as string;
    const account_id = formData.get("account_id") as string;
    const client_name = formData.get("client_name") as string;
    const client_email = formData.get("client_email") as string;
    const client_address = formData.get("client_address") as string;
    const notes = (formData.get("notes") as string) || null;

    // Process line items
    const lineItems: Array<{description: string; amount: number; quantity?: number; unit_price?: number}> = [];
    let total_amount = 0;

    // Get all form keys to find line items
    const keys = Array.from(formData.keys());
    const itemKeys = keys.filter((key) => key.startsWith("items["));

    // Group keys by item index
    const itemIndices = new Set();
    itemKeys.forEach((key) => {
      const match = key.match(/items\[(\d+)\]/);
      if (match) {
        itemIndices.add(match[1]);
      }
    });

    // Process each item
    Array.from(itemIndices).forEach((index) => {
      const description = formData.get(
        `items[${index}][description]`,
      ) as string;
      const quantity = parseInt(
        formData.get(`items[${index}][quantity]`) as string,
      );
      const unit_price = parseFloat(
        formData.get(`items[${index}][unit_price]`) as string,
      );

      if (description && !isNaN(quantity) && !isNaN(unit_price)) {
        const amount = quantity * unit_price;
        total_amount += amount;

        lineItems.push({
          description,
          quantity,
          unit_price,
          amount,
        });
      }
    });

    // Validate required fields
    if (
      !invoice_number ||
      !date ||
      !due_date ||
      !account_id ||
      !client_name ||
      !client_email ||
      lineItems.length === 0
    ) {
      return NextResponse.json(
        { error: "All required fields must be filled" },
        { status: 400 },
      );
    }

    // Create invoice in database
    const { data: invoice, error: invoiceError } = await supabase
      .from("invoices")
      .insert([
        {
          invoice_number,
          date,
          due_date,
          account_id,
          client_name,
          client_email,
          client_address,
          notes,
          items: lineItems,
          total_amount,
          status: "draft",
          user_id: user.id,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (invoiceError) {
      console.error("Error creating invoice:", invoiceError);
      return NextResponse.json(
        { error: "Failed to create invoice" },
        { status: 500 },
      );
    }

    // Redirect to the invoices page
    return NextResponse.redirect(new URL(`/dashboard/invoices`, request.url));
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

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
    // Get JSON data
    const { id, ...updates } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    // Update the invoice
    const { data, error } = await supabase
      .from("invoices")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .eq("user_id", user.id)
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update invoice" },
        { status: 500 },
      );
    }

    return NextResponse.json({ data });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  const supabase = await createClient();

  // Check if user is authenticated
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Get invoice ID from URL
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Invoice ID is required" },
        { status: 400 },
      );
    }

    // Delete the invoice
    const { error } = await supabase
      .from("invoices")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return NextResponse.json(
        { error: "Failed to delete invoice" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
