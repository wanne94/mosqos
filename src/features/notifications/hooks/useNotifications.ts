/**
 * Notifications React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsService } from '../services/notifications.service';
import type {
  Notification,
  NotificationPreference,
  UpdatePreferenceInput,
  NotificationsQueryOptions,
  NotificationType,
} from '../types';

// =============================================
// Query Keys
// =============================================

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (personId: string, options?: NotificationsQueryOptions) =>
    [...notificationKeys.lists(), personId, options] as const,
  unread: (personId: string) => [...notificationKeys.all, 'unread', personId] as const,
  unreadCount: (userId: string) => [...notificationKeys.all, 'unreadCount', userId] as const,
  details: () => [...notificationKeys.all, 'detail'] as const,
  detail: (id: string) => [...notificationKeys.details(), id] as const,
  preferences: (personId: string) =>
    [...notificationKeys.all, 'preferences', personId] as const,
  preference: (personId: string, type: NotificationType) =>
    [...notificationKeys.preferences(personId), type] as const,
};

// =============================================
// Notification Queries
// =============================================

/**
 * Hook to fetch notifications for a user
 */
export function useNotifications(personId: string, options?: NotificationsQueryOptions) {
  return useQuery({
    queryKey: notificationKeys.list(personId, options),
    queryFn: () => notificationsService.getNotifications(personId, options),
    enabled: !!personId,
  });
}

/**
 * Hook to fetch unread notifications
 */
export function useUnreadNotifications(personId: string, limit: number = 10) {
  return useQuery({
    queryKey: notificationKeys.unread(personId),
    queryFn: () => notificationsService.getUnreadNotifications(personId, limit),
    enabled: !!personId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch unread notification count
 */
export function useUnreadCount(userId: string) {
  return useQuery({
    queryKey: notificationKeys.unreadCount(userId),
    queryFn: () => notificationsService.getUnreadCount(userId),
    enabled: !!userId,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
}

/**
 * Hook to fetch a single notification
 */
export function useNotification(notificationId: string) {
  return useQuery({
    queryKey: notificationKeys.detail(notificationId),
    queryFn: () => notificationsService.getNotification(notificationId),
    enabled: !!notificationId,
  });
}

// =============================================
// Notification Mutations
// =============================================

/**
 * Hook to mark a notification as read
 */
export function useMarkAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.markAsRead(notificationId),
    onSuccess: (data) => {
      // Update the specific notification in cache
      queryClient.setQueryData(notificationKeys.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
        predicate: (query) =>
          query.queryKey[1] === 'unread' || query.queryKey[1] === 'unreadCount',
      });
    },
  });
}

/**
 * Hook to mark multiple notifications as read
 */
export function useMarkMultipleAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationIds: string[]) =>
      notificationsService.markMultipleAsRead(notificationIds),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });
}

/**
 * Hook to mark all notifications as read
 */
export function useMarkAllAsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userId: string) => notificationsService.markAllAsRead(userId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });
}

/**
 * Hook to delete a notification
 */
export function useDeleteNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (notificationId: string) =>
      notificationsService.deleteNotification(notificationId),
    onSuccess: (_, notificationId) => {
      queryClient.removeQueries({
        queryKey: notificationKeys.detail(notificationId),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
        predicate: (query) =>
          query.queryKey[1] === 'unread' || query.queryKey[1] === 'unreadCount',
      });
    },
  });
}

/**
 * Hook to delete all notifications
 */
export function useDeleteAllNotifications() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personId: string) =>
      notificationsService.deleteAllNotifications(personId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.all,
      });
    },
  });
}

// =============================================
// Preference Hooks
// =============================================

/**
 * Hook to fetch notification preferences
 */
export function useNotificationPreferences(personId: string) {
  return useQuery({
    queryKey: notificationKeys.preferences(personId),
    queryFn: () => notificationsService.getPreferences(personId),
    enabled: !!personId,
  });
}

/**
 * Hook to fetch a single notification preference
 */
export function useNotificationPreference(
  personId: string,
  notificationType: NotificationType
) {
  return useQuery({
    queryKey: notificationKeys.preference(personId, notificationType),
    queryFn: () => notificationsService.getPreference(personId, notificationType),
    enabled: !!personId && !!notificationType,
  });
}

/**
 * Hook to update a notification preference
 */
export function useUpdatePreference() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      personId,
      notificationType,
      input,
    }: {
      personId: string;
      notificationType: NotificationType;
      input: UpdatePreferenceInput;
    }) => notificationsService.updatePreference(personId, notificationType, input),
    onSuccess: (data, variables) => {
      // Update specific preference
      queryClient.setQueryData(
        notificationKeys.preference(variables.personId, variables.notificationType),
        data
      );
      // Invalidate preferences list
      queryClient.invalidateQueries({
        queryKey: notificationKeys.preferences(variables.personId),
      });
    },
  });
}

/**
 * Hook to reset all preferences
 */
export function useResetPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (personId: string) => notificationsService.resetPreferences(personId),
    onSuccess: (_, personId) => {
      queryClient.invalidateQueries({
        queryKey: notificationKeys.preferences(personId),
      });
    },
  });
}
