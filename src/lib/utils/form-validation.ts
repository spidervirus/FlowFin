/**
 * Form validation utilities for FlowFin
 * 
 * This file provides common validation schemas and utilities for forms
 * using zod and react-hook-form.
 */

import * as z from 'zod';

/**
 * Common validation schemas
 */
export const emailSchema = z
  .string()
  .min(1, { message: 'Email is required' })
  .email({ message: 'Invalid email address' });

export const passwordSchema = z
  .string()
  .min(1, { message: 'Password is required' })
  .min(6, { message: 'Password must be at least 6 characters' });

export const nameSchema = z
  .string()
  .min(1, { message: 'Name is required' })
  .max(100, { message: 'Name is too long' });

export const phoneSchema = z
  .string()
  .min(1, { message: 'Phone number is required' })
  .regex(/^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/, {
    message: 'Invalid phone number format',
  });

export const currencySchema = z
  .string()
  .or(z.number())
  .transform((val) => {
    // Convert string to number if it's a string
    if (typeof val === 'string') {
      // Remove currency symbols and commas
      const normalized = val.replace(/[$,£€]/g, '');
      return Number(normalized);
    }
    return val;
  })
  .refine((val) => !isNaN(val), {
    message: 'Must be a valid number',
  });

export const dateSchema = z
  .date({
    required_error: 'Date is required',
    invalid_type_error: 'Must be a valid date',
  })
  .or(
    z.string().transform((val, ctx) => {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        ctx.addIssue({
          code: z.ZodIssueCode.invalid_date,
          message: 'Invalid date format',
        });
        return z.NEVER;
      }
      return date;
    })
  );

/**
 * Common form schemas
 */
export const loginFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  rememberMe: z.boolean().optional().default(false),
});

export const signupFormSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
  fullName: nameSchema,
  termsAccepted: z.boolean().refine((val) => val === true, {
    message: 'You must accept the terms and conditions',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export const resetPasswordFormSchema = z.object({
  email: emailSchema,
});

export const newPasswordFormSchema = z.object({
  password: passwordSchema,
  confirmPassword: z.string().min(1, { message: 'Please confirm your password' }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Financial form schemas
 */
export const transactionFormSchema = z.object({
  amount: currencySchema,
  date: dateSchema,
  description: z.string().min(1, { message: 'Description is required' }),
  category: z.string().min(1, { message: 'Category is required' }),
  type: z.enum(['income', 'expense']),
  notes: z.string().optional(),
});

export const accountFormSchema = z.object({
  name: z.string().min(1, { message: 'Account name is required' }),
  type: z.enum(['checking', 'savings', 'credit', 'investment', 'other']),
  balance: currencySchema,
  currency: z.string().min(1, { message: 'Currency is required' }),
  isActive: z.boolean().default(true),
});

export const budgetFormSchema = z.object({
  name: z.string().min(1, { message: 'Budget name is required' }),
  amount: currencySchema,
  period: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  category: z.string().min(1, { message: 'Category is required' }),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
}).refine(
  (data) => {
    if (data.endDate) {
      return data.endDate > data.startDate;
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Validation helper functions
 */

/**
 * Format money input by adding commas and dollar sign
 */
export function formatCurrency(value: string | number): string {
  const number = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : value;
  
  if (isNaN(number)) return '';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(number);
}

/**
 * Parse currency input to number
 */
export function parseCurrency(value: string): number {
  // Remove currency symbol and commas
  const parsed = parseFloat(value.replace(/[$,£€]/g, ''));
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Validate a password's strength
 * @returns Object with isValid and feedback
 */
export function validatePasswordStrength(password: string): { 
  isValid: boolean; 
  score: number; 
  feedback: string;
} {
  if (!password) {
    return { isValid: false, score: 0, feedback: 'Password is required' };
  }
  
  let score = 0;
  let feedback = '';
  
  // Length check
  if (password.length < 6) {
    return { 
      isValid: false, 
      score: 0, 
      feedback: 'Password must be at least 6 characters long' 
    };
  } else if (password.length >= 10) {
    score += 2;
  } else {
    score += 1;
  }
  
  // Check for mixed case
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) {
    score += 1;
  }
  
  // Check for numbers
  if (/\d/.test(password)) {
    score += 1;
  }
  
  // Check for special characters
  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 1;
  }
  
  // Determine feedback based on score
  if (score < 2) {
    feedback = 'Weak password';
  } else if (score < 4) {
    feedback = 'Moderate password';
  } else {
    feedback = 'Strong password';
  }
  
  return { isValid: score >= 2, score, feedback };
}

/**
 * Convert form errors from Zod to a friendly object
 */
export function getFormErrors(result: z.ZodFormattedError<any>): Record<string, string> {
  const errors: Record<string, string> = {};
  
  // Handle form-level errors (optional, based on how you want to display them)
  // if (result._errors.length) {
  //   errors._form = result._errors.join(', '); 
  // }

  for (const key in result) {
    if (key === '_errors') continue; // Skip the global errors array

    // Assert that result[key] is an object with _errors (or skip if not)
    const fieldErrorObject = result[key as keyof typeof result];
    if (fieldErrorObject && typeof fieldErrorObject === 'object' && '_errors' in fieldErrorObject) {
      const messages = (fieldErrorObject as { _errors: string[] })._errors;
    if (messages && messages.length > 0) {
      errors[key] = messages[0];
      }
    }
  }
  
  return errors;
}

/**
 * Form normalization helpers
 */

/**
 * Normalize phone number input
 */
export function normalizePhone(value: string): string {
  if (!value) return '';
  
  // Remove all non-digits
  const digits = value.replace(/\D/g, '');
  
  // Apply phone formatting
  if (digits.length <= 3) {
    return digits;
  } else if (digits.length <= 6) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  } else {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
}