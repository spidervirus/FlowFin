import { z } from 'zod';

/**
 * Schema for sign-up validation
 */
export const SignUpSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  terms: z.boolean()
    .refine(val => val === true, { message: 'You must accept the terms and conditions' }),
});

/**
 * Schema for sign-in validation
 */
export const SignInSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
  password: z.string()
    .min(1, { message: 'Password is required' }),
  remember: z.boolean().optional(),
});

/**
 * Schema for forgot password validation
 */
export const ForgotPasswordSchema = z.object({
  email: z.string()
    .min(1, { message: 'Email is required' })
    .email({ message: 'Please enter a valid email address' }),
});

/**
 * Schema for reset password validation
 */
export const ResetPasswordSchema = z.object({
  password: z.string()
    .min(1, { message: 'Password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string()
    .min(1, { message: 'Please confirm your password' }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

/**
 * Schema for updating password
 */
export const UpdatePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, { message: 'Current password is required' }),
  newPassword: z.string()
    .min(1, { message: 'New password is required' })
    .min(8, { message: 'Password must be at least 8 characters long' })
    .regex(/[A-Z]/, { message: 'Password must contain at least one uppercase letter' })
    .regex(/[a-z]/, { message: 'Password must contain at least one lowercase letter' })
    .regex(/[0-9]/, { message: 'Password must contain at least one number' })
    .regex(/[^A-Za-z0-9]/, { message: 'Password must contain at least one special character' }),
  confirmPassword: z.string()
    .min(1, { message: 'Please confirm your new password' }),
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine(data => data.currentPassword !== data.newPassword, {
  message: 'New password must be different from current password',
  path: ['newPassword'],
});

/**
 * Schema for updating user profile
 */
export const UpdateProfileSchema = z.object({
  name: z.string()
    .min(1, { message: 'Name is required' })
    .max(100, { message: 'Name cannot exceed 100 characters' }),
  email: z.string()
    .email({ message: 'Please enter a valid email address' })
    .optional(),
  phone: z.string()
    .regex(/^\+?[0-9]{10,15}$/, { message: 'Please enter a valid phone number' })
    .optional()
    .or(z.literal('')),
  bio: z.string()
    .max(500, { message: 'Bio cannot exceed 500 characters' })
    .optional()
    .or(z.literal('')),
});

/**
 * Schema for two-factor authentication setup
 */
export const TwoFactorSetupSchema = z.object({
  code: z.string()
    .min(6, { message: 'Authentication code must be at least 6 characters' })
    .max(6, { message: 'Authentication code cannot exceed 6 characters' })
    .regex(/^[0-9]+$/, { message: 'Authentication code must contain only numbers' }),
});

/**
 * Schema for two-factor authentication verification
 */
export const TwoFactorVerifySchema = z.object({
  code: z.string()
    .min(6, { message: 'Authentication code must be at least 6 characters' })
    .max(6, { message: 'Authentication code cannot exceed 6 characters' })
    .regex(/^[0-9]+$/, { message: 'Authentication code must contain only numbers' }),
  remember: z.boolean().optional(),
});