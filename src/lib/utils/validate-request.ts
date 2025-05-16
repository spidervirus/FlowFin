import { z } from 'zod';

/**
 * Validate request data against a Zod schema
 * @param data The data to validate
 * @param schema The Zod schema to validate against
 * @returns Object with validation results
 */
export async function validateRequest<T>(
  data: unknown,
  schema: z.ZodType<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const validatedData = await schema.parseAsync(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      // Format error messages
      const errorMessage = error.errors
        .map((e) => `${e.path.join('.')}: ${e.message}`)
        .join(', ');
      return { success: false, error: errorMessage };
    }
    
    // For other types of errors
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    return { success: false, error: message };
  }
}

/**
 * Validate query parameters against a Zod schema
 * @param query The query parameters object
 * @param schema The Zod schema to validate against
 * @returns Object with validation results
 */
export async function validateQueryParams<T>(
  query: Record<string, string | string[] | undefined>,
  schema: z.ZodType<T>
): Promise<{ success: boolean; data?: T; error?: string }> {
  // Convert array parameters to their first value if needed
  const processedQuery: Record<string, string | undefined> = {};
  
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) {
      processedQuery[key] = value[0];
    } else {
      processedQuery[key] = value;
    }
  }
  
  return validateRequest(processedQuery, schema);
}

/**
 * Utility to create a typed validation middleware
 * @param schema The Zod schema to validate against
 * @returns A validation middleware function
 */
export function createValidator<T>(schema: z.ZodType<T>) {
  return async (data: unknown): Promise<{ success: boolean; data?: T; error?: string }> => {
    return validateRequest(data, schema);
  };
}

/**
 * Convert Zod validation errors to a user-friendly format
 * @param error The Zod error object
 * @returns An object mapping field paths to error messages
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  
  for (const issue of error.errors) {
    const path = issue.path.join('.');
    errors[path] = issue.message;
  }
  
  return errors;
}

/**
 * Validate and sanitize IDs
 * @param id The ID to validate and sanitize
 * @returns The sanitized ID or null if invalid
 */
export function validateId(id: string | undefined | null): string | null {
  if (!id) return null;
  
  // Remove any non-alphanumeric characters except allowed special chars
  const sanitized = id.replace(/[^\w-]/g, '');
  
  // Ensure it's not empty after sanitization
  return sanitized.length > 0 ? sanitized : null;
}

/**
 * Validate UUID format
 * @param uuid The UUID to validate
 * @returns Boolean indicating if the UUID is valid
 */
export function isValidUuid(uuid: string | undefined | null): boolean {
  if (!uuid) return false;
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}