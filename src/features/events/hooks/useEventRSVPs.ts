/**
 * Event RSVP React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '../services/events.service';
import type {
  CreateRSVPInput,
  UpdateRSVPInput,
} from '../types';
import { eventKeys } from './useEvents';

// =============================================
// RSVP Query Keys
// =============================================

export const rsvpKeys = {
  all: ['event-rsvps'] as const,
  lists: () => [...rsvpKeys.all, 'list'] as const,
  list: (eventId: string) => [...rsvpKeys.lists(), eventId] as const,
  attending: (eventId: string) => [...rsvpKeys.lists(), eventId, 'attending'] as const,
  userStatus: (eventId: string, userId: string) =>
    [...rsvpKeys.all, 'userStatus', eventId, userId] as const,
  stats: (eventId: string) => [...rsvpKeys.all, 'stats', eventId] as const,
};

// =============================================
// RSVP Queries
// =============================================

/**
 * Hook to fetch all RSVPs for an event
 */
export function useEventRSVPs(eventId: string) {
  return useQuery({
    queryKey: rsvpKeys.list(eventId),
    queryFn: () => eventsService.getEventRSVPs(eventId),
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch attending RSVPs for an event
 */
export function useAttendingRSVPs(eventId: string) {
  return useQuery({
    queryKey: rsvpKeys.attending(eventId),
    queryFn: () => eventsService.getAttendingRSVPs(eventId),
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch user's RSVP status for an event
 */
export function useUserRSVPStatus(eventId: string, userId: string) {
  return useQuery({
    queryKey: rsvpKeys.userStatus(eventId, userId),
    queryFn: () => eventsService.getUserRSVPStatus(eventId, userId),
    enabled: !!eventId && !!userId,
  });
}

/**
 * Hook to fetch event attendance statistics
 */
export function useEventAttendanceStats(eventId: string) {
  return useQuery({
    queryKey: rsvpKeys.stats(eventId),
    queryFn: () => eventsService.getEventAttendanceStats(eventId),
    enabled: !!eventId,
  });
}

// =============================================
// RSVP Mutations
// =============================================

/**
 * Hook to create an RSVP
 */
export function useCreateRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ personId, input }: { personId: string; input: CreateRSVPInput }) =>
      eventsService.createRSVP(personId, input),
    onSuccess: (data) => {
      // Invalidate RSVP lists
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.list(data.event_id),
      });
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.stats(data.event_id),
      });
      // Invalidate event stats
      queryClient.invalidateQueries({
        queryKey: eventKeys.withStats(data.event_id),
      });
    },
  });
}

/**
 * Hook to update an RSVP
 */
export function useUpdateRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rsvpId, input }: { rsvpId: string; input: UpdateRSVPInput }) =>
      eventsService.updateRSVP(rsvpId, input),
    onSuccess: (data) => {
      // Invalidate RSVP lists
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.list(data.event_id),
      });
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.stats(data.event_id),
      });
      // Invalidate event stats
      queryClient.invalidateQueries({
        queryKey: eventKeys.withStats(data.event_id),
      });
    },
  });
}

/**
 * Hook to delete an RSVP
 */
export function useDeleteRSVP() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rsvpId, eventId }: { rsvpId: string; eventId: string }) =>
      eventsService.deleteRSVP(rsvpId).then(() => eventId),
    onSuccess: (eventId) => {
      // Invalidate RSVP lists
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.list(eventId),
      });
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.stats(eventId),
      });
      // Invalidate event stats
      queryClient.invalidateQueries({
        queryKey: eventKeys.withStats(eventId),
      });
    },
  });
}

/**
 * Hook to check in an attendee
 */
export function useCheckInAttendee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ rsvpId, checkedInBy }: { rsvpId: string; checkedInBy?: string }) =>
      eventsService.checkInAttendee(rsvpId, checkedInBy),
    onSuccess: (data) => {
      // Invalidate RSVP lists
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.list(data.event_id),
      });
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.stats(data.event_id),
      });
    },
  });
}

/**
 * Hook to undo check-in
 */
export function useUndoCheckIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (rsvpId: string) => eventsService.undoCheckIn(rsvpId),
    onSuccess: (data) => {
      // Invalidate RSVP lists
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.list(data.event_id),
      });
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.stats(data.event_id),
      });
    },
  });
}

/**
 * Combined hook for managing user's RSVP
 * Provides status query and create/update mutations
 */
export function useManageRSVP(eventId: string, userId: string, personId: string) {
  const queryClient = useQueryClient();

  const statusQuery = useUserRSVPStatus(eventId, userId);

  const createMutation = useCreateRSVP();
  const updateMutation = useUpdateRSVP();

  const submitRSVP = async (input: Omit<CreateRSVPInput, 'event_id'>) => {
    const existingRSVP = statusQuery.data;

    if (existingRSVP?.rsvp_id) {
      // Update existing RSVP
      return updateMutation.mutateAsync({
        rsvpId: existingRSVP.rsvp_id,
        input: {
          status: input.status,
          guests_count: input.guests_count,
          notes: input.notes,
        },
      });
    } else {
      // Create new RSVP
      return createMutation.mutateAsync({
        personId,
        input: {
          ...input,
          event_id: eventId,
        },
      });
    }
  };

  const cancelRSVP = async () => {
    const existingRSVP = statusQuery.data;

    if (existingRSVP?.rsvp_id) {
      await eventsService.deleteRSVP(existingRSVP.rsvp_id);
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.userStatus(eventId, userId),
      });
      queryClient.invalidateQueries({
        queryKey: rsvpKeys.list(eventId),
      });
    }
  };

  return {
    status: statusQuery.data,
    isLoading: statusQuery.isLoading,
    isSubmitting: createMutation.isPending || updateMutation.isPending,
    submitRSVP,
    cancelRSVP,
    error: createMutation.error || updateMutation.error,
  };
}
