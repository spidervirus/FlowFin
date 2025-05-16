import { SupabaseClient } from "@supabase/supabase-js";
import { Database } from "@/lib/supabase/database.types";

export async function generateQuoteNumber(
  supabase: SupabaseClient<Database>
): Promise<string> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not found");

    // Get the current year
    const currentYear = new Date().getFullYear();

    // Get the latest quote number for the current year
    const { data: quotes, error } = await supabase
      .from("quotes")
      .select("quote_number")
      .eq("user_id", user.id)
      .ilike("quote_number", `Q${currentYear}-%`)
      .order("quote_number", { ascending: false })
      .limit(1);

    if (error) throw error;

    let nextNumber = 1;
    if (quotes && quotes.length > 0) {
      // Extract the number from the latest quote number (format: Q2024-0001)
      const latestNumber = parseInt(quotes[0].quote_number.split("-")[1]);
      nextNumber = latestNumber + 1;
    }

    // Format: Q2024-0001
    return `Q${currentYear}-${nextNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating quote number:", error);
    throw error;
  }
} 