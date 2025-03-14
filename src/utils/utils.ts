import { redirect } from "next/navigation";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Redirects to a specified path with an encoded message as a query parameter.
 * @param {('error' | 'success' | 'warning')} type - The type of message, either 'error', 'success', or 'warning'.
 * @param {string} path - The path to redirect to.
 * @param {string} message - The message to be encoded and added as a query parameter.
 * @returns {never} This function doesn't return as it triggers a redirect.
 */
export function encodedRedirect(
  type: "error" | "success" | "warning",
  path: string,
  message: string,
) {
  return redirect(`${path}?${type}=${encodeURIComponent(message)}`);
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param amount The amount to format
 * @param currency The currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
