/**
 * Request Validation Utilities
 * 
 * This file provides utilities for validating incoming API requests using Zod schemas.
 * It integrates with our API response utilities for consistent error handling.
 */

import { NextRequest } from 'next/server';
import { z } from 'zod';
import { apiValidationError } from './api-response';

/**
 * Parse and validate request body using a Zod schema
 */
export async function validateBody<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): Promise<{ success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof apiValidationError> }> {
  try {
    // Parse the request body as JSON
    const body = await req.json();
    
    // Validate with zod schema
    const result = schema.safeParse(body);
    
    if (!result.success) {
      // Convert zod errors to a more readable format
      const fieldErrors: Record<string, string[]> = {};
      
      result.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      return {
        success: false,
        error: apiValidationError(fieldErrors, 'Invalid request data')
      };
    }
    
    // Return validated data
    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    // Handle JSON parsing errors
    return {
      success: false,
      error: apiValidationError('Invalid JSON in request body', 'Failed to parse request body')
    };
  }
}

/**
 * Parse and validate URL search params using a Zod schema
 */
export function validateQuery<T extends z.ZodType>(
  req: NextRequest,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof apiValidationError> } {
  try {
    // Extract query parameters
    const url = new URL(req.url);
    const queryObj: Record<string, string | string[]> = {};
    
    // Convert URL search params to object
    url.searchParams.forEach((value, key) => {
      if (queryObj[key]) {
        // If the key already exists, convert it to an array
        if (Array.isArray(queryObj[key])) {
          (queryObj[key] as string[]).push(value);
        } else {
          queryObj[key] = [queryObj[key] as string, value];
        }
      } else {
        queryObj[key] = value;
      }
    });
    
    // Validate with zod schema
    const result = schema.safeParse(queryObj);
    
    if (!result.success) {
      // Convert zod errors to a more readable format
      const fieldErrors: Record<string, string[]> = {};
      
      result.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      return {
        success: false,
        error: apiValidationError(fieldErrors, 'Invalid query parameters')
      };
    }
    
    // Return validated data
    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    return {
      success: false,
      error: apiValidationError('Failed to parse query parameters')
    };
  }
}

/**
 * Parse and validate URL path parameters using a Zod schema
 */
export function validateParams<T extends z.ZodType>(
  params: Record<string, string | string[]>,
  schema: T
): { success: true; data: z.infer<T> } | { success: false; error: ReturnType<typeof apiValidationError> } {
  try {
    // Validate with zod schema
    const result = schema.safeParse(params);
    
    if (!result.success) {
      // Convert zod errors to a more readable format
      const fieldErrors: Record<string, string[]> = {};
      
      result.error.errors.forEach((err) => {
        const field = err.path.join('.');
        if (!fieldErrors[field]) {
          fieldErrors[field] = [];
        }
        fieldErrors[field].push(err.message);
      });
      
      return {
        success: false,
        error: apiValidationError(fieldErrors, 'Invalid path parameters')
      };
    }
    
    // Return validated data
    return {
      success: true,
      data: result.data
    };
  } catch (err) {
    return {
      success: false,
      error: apiValidationError('Failed to parse path parameters')
    };
  }
}

/**
 * Helper function to create validation schema with common patterns
 */
export const createValidators = {
  pagination: z.object({
    page: z.coerce.number().min(1).optional().default(1),
    pageSize: z.coerce.number().min(1).max(100).optional().default(20)
  }),
  
  id: z.string().uuid(),
  
  dateRange: z.object({
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional()
  }),
  
  sorting: z.object({
    sortBy: z.string(),
    order: z.enum(['asc', 'desc']).default('asc')
  }).optional()
};