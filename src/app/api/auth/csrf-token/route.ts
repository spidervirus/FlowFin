import { NextResponse } from "next/server";
import { generateCsrfToken, setCsrfTokenOnResponse } from "@/lib/utils/csrf"; // Adjusted import

export async function GET() {
  try {
    const tokenValue = generateCsrfToken();

    // Create an initial response
    const response = NextResponse.json({ csrfToken: tokenValue });

    // Set the HttpOnly cookie on this response
    setCsrfTokenOnResponse(response, tokenValue); // Use the correct function

    return response;
  } catch (error) {
    console.error("CSRF token generation error:", error);
    return NextResponse.json(
      { error: "Failed to generate CSRF token" },
      { status: 500 }
    );
  }
} 