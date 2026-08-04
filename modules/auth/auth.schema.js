import { z } from 'zod';

/**
 * Auth Module — Zod Schemas
 * Domain-specific validation rules for the auth module.
 */

export const AuthLoginSchema = z.object({
  email: z.string().min(1, { message: 'Email is required' }).email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Password is required' }),
});

export const AuthPasswordSchema = z.object({
  currentPassword: z.string().min(1, { message: 'Current password is required' }),
  newPassword: z
    .string()
    .min(8, { message: 'New password must be at least 8 characters' })
    .max(128, { message: 'Password too long' }),
});
