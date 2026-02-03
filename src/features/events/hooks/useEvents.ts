/**
 * Events React Query Hooks
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { eventsService } from '../services/events.service';
import type {
  Event,
  EventWithStats,
  CreateEventInput,
  UpdateEventInput,
  EventsQueryOptions,
  EventType,
  EventStatus,
} from '../types';

// =============================================
// Query Keys
// =============================================

export const eventKeys = {
  all: ['events'] as const,
  lists: () => [...eventKeys.all, 'list'] as const,
  list: (organizationId: string, options?: EventsQueryOptions) =>
    [...eventKeys.lists(), organizationId, options] as const,
  upcoming: (organizationId: string, limit?: number, eventType?: EventType) =>
    [...eventKeys.all, 'upcoming', organizationId, limit, eventType] as const,
  past: (organizationId: string, limit?: number) =>
    [...eventKeys.all, 'past', organizationId, limit] as const,
  details: () => [...eventKeys.all, 'detail'] as const,
  detail: (id: string) => [...eventKeys.details(), id] as const,
  withStats: (id: string) => [...eventKeys.details(), id, 'stats'] as const,
  range: (organizationId: string, start: string, end: string) =>
    [...eventKeys.all, 'range', organizationId, start, end] as const,
  today: (organizationId: string) => [...eventKeys.all, 'today', organizationId] as const,
  thisWeek: (organizationId: string) =>
    [...eventKeys.all, 'thisWeek', organizationId] as const,
  month: (organizationId: string, year: number, month: number) =>
    [...eventKeys.all, 'month', organizationId, year, month] as const,
  countByType: (organizationId: string) =>
    [...eventKeys.all, 'countByType', organizationId] as const,
};

// =============================================
// Event Queries
// =============================================

/**
 * Hook to fetch all events for an organization
 */
export function useEvents(organizationId: string, options?: EventsQueryOptions) {
  return useQuery({
    queryKey: eventKeys.list(organizationId, options),
    queryFn: () => eventsService.getEvents(organizationId, options),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch upcoming events
 */
export function useUpcomingEvents(
  organizationId: string,
  limit: number = 10,
  eventType?: EventType
) {
  return useQuery({
    queryKey: eventKeys.upcoming(organizationId, limit, eventType),
    queryFn: () => eventsService.getUpcomingEvents(organizationId, limit, eventType),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch past events
 */
export function usePastEvents(organizationId: string, limit: number = 20) {
  return useQuery({
    queryKey: eventKeys.past(organizationId, limit),
    queryFn: () => eventsService.getPastEvents(organizationId, limit),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch a single event
 */
export function useEvent(eventId: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventId),
    queryFn: () => eventsService.getEvent(eventId),
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch event with RSVP statistics
 */
export function useEventWithStats(eventId: string) {
  return useQuery({
    queryKey: eventKeys.withStats(eventId),
    queryFn: () => eventsService.getEventWithStats(eventId),
    enabled: !!eventId,
  });
}

/**
 * Hook to fetch events in a date range (for calendar)
 */
export function useEventsInRange(
  organizationId: string,
  startDate: string,
  endDate: string,
  includePrivate: boolean = true
) {
  return useQuery({
    queryKey: eventKeys.range(organizationId, startDate, endDate),
    queryFn: () =>
      eventsService.getEventsInRange(organizationId, startDate, endDate, includePrivate),
    enabled: !!organizationId && !!startDate && !!endDate,
  });
}

/**
 * Hook to fetch today's events
 */
export function useTodayEvents(organizationId: string) {
  return useQuery({
    queryKey: eventKeys.today(organizationId),
    queryFn: () => eventsService.getTodayEvents(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch this week's events
 */
export function useThisWeekEvents(organizationId: string) {
  return useQuery({
    queryKey: eventKeys.thisWeek(organizationId),
    queryFn: () => eventsService.getThisWeekEvents(organizationId),
    enabled: !!organizationId,
  });
}

/**
 * Hook to fetch events for a specific month
 */
export function useMonthEvents(organizationId: string, year: number, month: number) {
  return useQuery({
    queryKey: eventKeys.month(organizationId, year, month),
    queryFn: () => eventsService.getMonthEvents(organizationId, year, month),
    enabled: !!organizationId && !!year && !!month,
  });
}

/**
 * Hook to fetch events count by type
 */
export function useEventsCountByType(organizationId: string) {
  return useQuery({
    queryKey: eventKeys.countByType(organizationId),
    queryFn: () => eventsService.getEventsCountByType(organizationId),
    enabled: !!organizationId,
  });
}

// =============================================
// Event Mutations
// =============================================

/**
 * Hook to create a new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      organizationId,
      input,
      createdBy,
    }: {
      organizationId: string;
      input: CreateEventInput;
      createdBy?: string;
    }) => eventsService.createEvent(organizationId, input, createdBy),
    onSuccess: (data, variables) => {
      // Invalidate all event lists for this organization
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.upcoming(variables.organizationId),
      });
      queryClient.invalidateQueries({
        queryKey: eventKeys.countByType(variables.organizationId),
      });
    },
  });
}

/**
 * Hook to update an event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, input }: { eventId: string; input: UpdateEventInput }) =>
      eventsService.updateEvent(eventId, input),
    onSuccess: (data) => {
      // Update the specific event in cache
      queryClient.setQueryData(eventKeys.detail(data.id), data);
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
    },
  });
}

/**
 * Hook to delete an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsService.deleteEvent(eventId),
    onSuccess: (_, eventId) => {
      // Remove from cache
      queryClient.removeQueries({
        queryKey: eventKeys.detail(eventId),
      });
      // Invalidate lists
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
    },
  });
}

/**
 * Hook to update event status
 */
export function useUpdateEventStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: EventStatus }) =>
      eventsService.updateEventStatus(eventId, status),
    onSuccess: (data) => {
      queryClient.setQueryData(eventKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
    },
  });
}

/**
 * Hook to publish an event
 */
export function usePublishEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsService.publishEvent(eventId),
    onSuccess: (data) => {
      queryClient.setQueryData(eventKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
    },
  });
}

/**
 * Hook to cancel an event
 */
export function useCancelEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsService.cancelEvent(eventId),
    onSuccess: (data) => {
      queryClient.setQueryData(eventKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
    },
  });
}

/**
 * Hook to complete an event
 */
export function useCompleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId: string) => eventsService.completeEvent(eventId),
    onSuccess: (data) => {
      queryClient.setQueryData(eventKeys.detail(data.id), data);
      queryClient.invalidateQueries({
        queryKey: eventKeys.lists(),
      });
    },
  });
}
