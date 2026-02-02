/**
 * Organization Validation Schemas
 *
 * Zod schemas for organization form validation
 */

import { z } from 'zod'

// Schema for self-service signup with organization creation
export const signupWithOrganizationSchema = z.object({
  organizationName: z.string()
    .min(2, 'Organization name must be at least 2 characters')
    .max(255, 'Organization name must be less than 255 characters'),
  email: z.string()
    .email('Please enter a valid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
  countryId: z.string()
    .uuid('Please select a country'),
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'You must accept the terms and conditions' })
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

export type SignupWithOrganizationFormData = z.infer<typeof signupWithOrganizationSchema>

// Schema for admin creating an organization
export const createOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters'),
  country_id: z.string()
    .uuid('Please select a country'),
  contact_email: z.string()
    .email('Please enter a valid email address'),
  contact_phone: z.string()
    .optional()
    .nullable(),
  address_line1: z.string()
    .max(255, 'Address must be less than 255 characters')
    .optional()
    .nullable(),
  city: z.string()
    .max(100, 'City must be less than 100 characters')
    .optional()
    .nullable(),
  state: z.string()
    .max(100, 'State must be less than 100 characters')
    .optional()
    .nullable(),
  postal_code: z.string()
    .max(20, 'Postal code must be less than 20 characters')
    .optional()
    .nullable(),
  timezone: z.string()
    .optional()
    .nullable(),
})

export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>

// Schema for updating an organization
export const updateOrganizationSchema = z.object({
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(255, 'Name must be less than 255 characters')
    .optional(),
  slug: z.string()
    .min(2, 'Slug must be at least 2 characters')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug can only contain lowercase letters, numbers, and hyphens')
    .optional(),
  country_id: z.string()
    .uuid('Invalid country')
    .optional(),
  contact_email: z.string()
    .email('Please enter a valid email address')
    .optional()
    .nullable(),
  contact_phone: z.string()
    .max(50, 'Phone number must be less than 50 characters')
    .optional()
    .nullable(),
  website: z.string()
    .url('Please enter a valid URL')
    .optional()
    .nullable()
    .or(z.literal('')),
  address_line1: z.string()
    .max(255)
    .optional()
    .nullable(),
  address_line2: z.string()
    .max(255)
    .optional()
    .nullable(),
  city: z.string()
    .max(100)
    .optional()
    .nullable(),
  state: z.string()
    .max(100)
    .optional()
    .nullable(),
  postal_code: z.string()
    .max(20)
    .optional()
    .nullable(),
  primary_color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Please enter a valid hex color (e.g., #10B981)')
    .optional()
    .nullable(),
  is_active: z.boolean()
    .optional(),
})

export type UpdateOrganizationFormData = z.infer<typeof updateOrganizationSchema>

// Schema for rejecting an organization
export const rejectOrganizationSchema = z.object({
  reason: z.string()
    .min(10, 'Please provide a detailed reason (at least 10 characters)')
    .max(1000, 'Reason must be less than 1000 characters'),
})

export type RejectOrganizationFormData = z.infer<typeof rejectOrganizationSchema>
