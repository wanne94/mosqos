/**
 * Notifications Module Types
 */

import { z } from 'zod';

// =============================================
// Notification Type Enum
// =============================================

export const NOTIFICATION_TYPES = [
  'donation_received',
  'event_reminder',
  'event_rsvp',
  'case_assigned',
  'case_updated',
  'announcement',
  'payment_received',
  'payment_due',
  'class_reminder',
  'class_cancelled',
  'membership_expiring',
  'general',
  'system',
] as const;

export type NotificationType = (typeof NOTIFICATION_TYPES)[number];

export const NOTIFICATION_TYPE_LABELS: Record<NotificationType, string> = {
  donation_received: 'Donation Received',
  event_reminder: 'Event Reminder',
  event_rsvp: 'Event RSVP',
  case_assigned: 'Case Assigned',
  case_updated: 'Case Updated',
  announcement: 'Announcement',
  payment_received: 'Payment Received',
  payment_due: 'Payment Due',
  class_reminder: 'Class Reminder',
  class_cancelled: 'Class Cancelled',
  membership_expiring: 'Membership Expiring',
  general: 'General',
  system: 'System',
};

export const NOTIFICATION_TYPE_ICONS: Record<NotificationType, string> = {
  donation_received: 'DollarSign',
  event_reminder: 'Calendar',
  event_rsvp: 'UserCheck',
  case_assigned: 'FileText',
  case_updated: 'FileEdit',
  announcement: 'Bell',
  payment_received: 'CreditCard',
  payment_due: 'AlertCircle',
  class_reminder: 'GraduationCap',
  class_cancelled: 'XCircle',
  membership_expiring: 'Clock',
  general: 'Info',
  system: 'Settings',
};

// =============================================
// Entity Type Enum
// =============================================

export const ENTITY_TYPES = [
  'donation',
  'event',
  'case',
  'announcement',
  'payment',
  'class',
  'enrollment',
  'member',
  'household',
  'organization',
] as const;

export type EntityType = (typeof ENTITY_TYPES)[number];

// =============================================
// Notification Interface
// =============================================

export interface Notification {
  id: string;
  person_id: string;
  organization_id: string | null;
  type: NotificationType;
  title: string;
  body: string | null;
  entity_type: EntityType | null;
  entity_id: string | null;
  is_read: boolean;
  read_at: string | null;
  action_url: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
}

// =============================================
// Notification Preference Interface
// =============================================

export interface NotificationPreference {
  id: string;
  person_id: string;
  notification_type: NotificationType;
  email_enabled: boolean;
  push_enabled: boolean;
  in_app_enabled: boolean;
  created_at: string;
  updated_at: string;
}

// =============================================
// Zod Schemas
// =============================================

export const createNotificationSchema = z.object({
  person_id: z.string().uuid(),
  type: z.enum(NOTIFICATION_TYPES),
  title: z.string().min(1).max(200),
  body: z.string().max(1000).optional(),
  entity_type: z.enum(ENTITY_TYPES).optional(),
  entity_id: z.string().uuid().optional(),
  action_url: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const updatePreferenceSchema = z.object({
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  in_app_enabled: z.boolean().optional(),
});

export type UpdatePreferenceInput = z.infer<typeof updatePreferenceSchema>;

// =============================================
// Query Types
// =============================================

export interface NotificationFilters {
  type?: NotificationType | NotificationType[];
  is_read?: boolean;
  entity_type?: EntityType;
}

export interface NotificationsQueryOptions {
  filters?: NotificationFilters;
  limit?: number;
  offset?: number;
}
