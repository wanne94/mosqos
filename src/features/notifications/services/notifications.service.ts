/**
 * Notifications Service
 *
 * NOTE: The notifications and notification_preferences tables are created by migration 00060.
 * Until the migration is run and database types are regenerated,
 * we use type assertions to bypass TypeScript errors.
 */

import { supabase } from '@/lib/supabase/client';
import type {
  Notification,
  NotificationPreference,
  CreateNotificationInput,
  UpdatePreferenceInput,
  NotificationsQueryOptions,
  NotificationType,
} from '../types';

// Type assertion helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// =============================================
// Notification Queries
// =============================================

/**
 * Get notifications for the current user
 */
export async function getNotifications(
  personId: string,
  options?: NotificationsQueryOptions
): Promise<Notification[]> {
  let query = db
    .from('notifications')
    .select('*')
    .eq('person_id', personId)
    .order('created_at', { ascending: false });

  // Apply filters
  if (options?.filters) {
    const { type, is_read, entity_type } = options.filters;

    if (type) {
      if (Array.isArray(type)) {
        query = query.in('type', type);
      } else {
        query = query.eq('type', type);
      }
    }

    if (is_read !== undefined) {
      query = query.eq('is_read', is_read);
    }

    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }
  }

  // Apply pagination
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 20) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching notifications:', error);
    throw error;
  }

  return data as Notification[];
}

/**
 * Get unread notifications for the current user
 */
export async function getUnreadNotifications(
  personId: string,
  limit: number = 10
): Promise<Notification[]> {
  return getNotifications(personId, {
    filters: { is_read: false },
    limit,
  });
}

/**
 * Get unread notification count
 */
export async function getUnreadCount(userId: string): Promise<number> {
  const { data, error } = await db.rpc('get_unread_notification_count', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching unread count:', error);
    throw error;
  }

  return data || 0;
}

/**
 * Get a single notification
 */
export async function getNotification(notificationId: string): Promise<Notification> {
  const { data, error } = await db
    .from('notifications')
    .select('*')
    .eq('id', notificationId)
    .single();

  if (error) {
    console.error('Error fetching notification:', error);
    throw error;
  }

  return data as Notification;
}

// =============================================
// Notification Mutations
// =============================================

/**
 * Mark a notification as read
 */
export async function markAsRead(notificationId: string): Promise<Notification> {
  const { data, error } = await db
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq('id', notificationId)
    .select()
    .single();

  if (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }

  return data as Notification;
}

/**
 * Mark multiple notifications as read
 */
export async function markMultipleAsRead(notificationIds: string[]): Promise<void> {
  const { error } = await db
    .from('notifications')
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .in('id', notificationIds);

  if (error) {
    console.error('Error marking notifications as read:', error);
    throw error;
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsRead(userId: string): Promise<number> {
  const { data, error } = await db.rpc('mark_all_notifications_read', {
    p_user_id: userId,
  });

  if (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }

  return data || 0;
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string): Promise<void> {
  const { error } = await db
    .from('notifications')
    .delete()
    .eq('id', notificationId);

  if (error) {
    console.error('Error deleting notification:', error);
    throw error;
  }
}

/**
 * Delete all notifications for a user
 */
export async function deleteAllNotifications(personId: string): Promise<void> {
  const { error } = await db
    .from('notifications')
    .delete()
    .eq('person_id', personId);

  if (error) {
    console.error('Error deleting all notifications:', error);
    throw error;
  }
}

/**
 * Create a notification (typically called by backend/triggers)
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<Notification> {
  const { data, error } = await db
    .from('notifications')
    .insert(input)
    .select()
    .single();

  if (error) {
    console.error('Error creating notification:', error);
    throw error;
  }

  return data as Notification;
}

// =============================================
// Notification Preferences
// =============================================

/**
 * Get notification preferences for a user
 */
export async function getPreferences(personId: string): Promise<NotificationPreference[]> {
  const { data, error } = await db
    .from('notification_preferences')
    .select('*')
    .eq('person_id', personId);

  if (error) {
    console.error('Error fetching notification preferences:', error);
    throw error;
  }

  return data as NotificationPreference[];
}

/**
 * Get preference for a specific notification type
 */
export async function getPreference(
  personId: string,
  notificationType: NotificationType
): Promise<NotificationPreference | null> {
  const { data, error } = await db
    .from('notification_preferences')
    .select('*')
    .eq('person_id', personId)
    .eq('notification_type', notificationType)
    .single();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = not found
    console.error('Error fetching notification preference:', error);
    throw error;
  }

  return data as NotificationPreference | null;
}

/**
 * Update or create a notification preference
 */
export async function updatePreference(
  personId: string,
  notificationType: NotificationType,
  input: UpdatePreferenceInput
): Promise<NotificationPreference> {
  // Try to update existing
  const { data: existingData, error: existingError } = await db
    .from('notification_preferences')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('person_id', personId)
    .eq('notification_type', notificationType)
    .select()
    .single();

  if (!existingError) {
    return existingData as NotificationPreference;
  }

  // If not found, create new
  if (existingError.code === 'PGRST116') {
    const { data, error } = await db
      .from('notification_preferences')
      .insert({
        person_id: personId,
        notification_type: notificationType,
        email_enabled: input.email_enabled ?? true,
        push_enabled: input.push_enabled ?? true,
        in_app_enabled: input.in_app_enabled ?? true,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification preference:', error);
      throw error;
    }

    return data as NotificationPreference;
  }

  throw existingError;
}

/**
 * Reset all preferences to default for a user
 */
export async function resetPreferences(personId: string): Promise<void> {
  const { error } = await db
    .from('notification_preferences')
    .delete()
    .eq('person_id', personId);

  if (error) {
    console.error('Error resetting notification preferences:', error);
    throw error;
  }
}

// =============================================
// Export as service object
// =============================================

export const notificationsService = {
  // Queries
  getNotifications,
  getUnreadNotifications,
  getUnreadCount,
  getNotification,

  // Mutations
  markAsRead,
  markMultipleAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,

  // Preferences
  getPreferences,
  getPreference,
  updatePreference,
  resetPreferences,
};
