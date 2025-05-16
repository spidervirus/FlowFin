import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

export async function generateInvoiceNumber(
  supabase: SupabaseClient<Database>
): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Get the latest invoice number for the current year
    const { data: invoices, error } = await supabase
      .from("invoices")
      .select("invoice_number")
      .eq("user_id", user.id)
      .ilike("invoice_number", `INV${currentYear}-%`)
      .order("invoice_number", { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (invoices && invoices.length > 0) {
      // Extract the number from the latest invoice number (format: INV2024-0001)
      const latestNumber = parseInt(invoices[0].invoice_number.split("-")[1]);
      nextNumber = latestNumber + 1;
    }

    // Format: INV2024-0001
    return `INV${currentYear}-${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating invoice number:", error);
    throw error;
  }
} 