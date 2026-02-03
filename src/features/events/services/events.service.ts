/**
 * Events Service
 *
 * Handles all API operations for events and RSVPs
 *
 * NOTE: The events and event_rsvps tables are created by migration 00059.
 * Until the migration is run and database types are regenerated,
 * we use type assertions to bypass TypeScript errors.
 */

import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import type {
  Event,
  EventWithStats,
  EventRSVP,
  EventRSVPWithPerson,
  UserRSVPStatus,
  CreateEventInput,
  UpdateEventInput,
  CreateRSVPInput,
  UpdateRSVPInput,
  EventsQueryOptions,
  EventType,
  EventStatus,
} from '../types';

// Type assertion helper for tables not yet in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// Check if we're in dev mode (using mock auth instead of real Supabase auth)
// VITE_DEV_MODE=true means we use mock authentication and should return mock data
const FORCE_DEV_MODE = import.meta.env.VITE_DEV_MODE === 'true';
const isDevMode = FORCE_DEV_MODE || !isSupabaseConfigured();

// Mock events for dev mode
const MOCK_EVENTS: Event[] = [
  {
    id: 'dev-event-1',
    organization_id: 'dev-org-id',
    title: 'Jummah Prayer',
    description: 'Weekly Friday congregation prayer with khutbah',
    event_type: 'prayer',
    start_datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days from now
    end_datetime: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString(),
    all_day: false,
    hijri_date: null,
    location: 'Main Prayer Hall',
    is_virtual: false,
    virtual_link: null,
    capacity: 500,
    rsvp_enabled: false,
    rsvp_deadline: null,
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', byDay: ['FR'] },
    parent_event_id: null,
    is_public: true,
    status: 'published',
    category_id: null,
    tags: ['prayer', 'weekly'],
    cover_image_url: null,
    attachments: [],
    contact_name: 'Imam Ahmed',
    contact_email: 'imam@greenlane.org',
    contact_phone: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-event-2',
    organization_id: 'dev-org-id',
    title: 'Quran Study Circle',
    description: 'Weekly Quran study and tafsir session for all levels',
    event_type: 'class',
    start_datetime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // 4 days from now
    end_datetime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000 + 1.5 * 60 * 60 * 1000).toISOString(),
    all_day: false,
    hijri_date: null,
    location: 'Room 101',
    is_virtual: false,
    virtual_link: null,
    capacity: 30,
    rsvp_enabled: true,
    rsvp_deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    is_recurring: true,
    recurrence_rule: { frequency: 'weekly', byDay: ['SU'] },
    parent_event_id: null,
    is_public: true,
    status: 'published',
    category_id: null,
    tags: ['education', 'quran'],
    cover_image_url: null,
    attachments: [],
    contact_name: 'Sheikh Abdullah',
    contact_email: 'education@greenlane.org',
    contact_phone: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'dev-event-3',
    organization_id: 'dev-org-id',
    title: 'Community Iftar',
    description: 'Community iftar dinner - bring a dish to share!',
    event_type: 'iftar',
    start_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from now
    end_datetime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    all_day: false,
    hijri_date: null,
    location: 'Community Hall',
    is_virtual: false,
    virtual_link: null,
    capacity: 200,
    rsvp_enabled: true,
    rsvp_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
    is_recurring: false,
    recurrence_rule: null,
    parent_event_id: null,
    is_public: true,
    status: 'draft',
    category_id: null,
    tags: ['community', 'iftar', 'ramadan'],
    cover_image_url: null,
    attachments: [],
    contact_name: 'Community Team',
    contact_email: 'community@greenlane.org',
    contact_phone: null,
    created_by: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// =============================================
// Events CRUD Operations
// =============================================

/**
 * Get all events for an organization with optional filters
 */
export async function getEvents(
  organizationId: string,
  options?: EventsQueryOptions
): Promise<Event[]> {
  // Return mock data in dev mode
  if (isDevMode) {
    let events = [...MOCK_EVENTS];

    // Apply basic filters
    if (options?.filters) {
      const { event_type, status, search } = options.filters;

      if (event_type) {
        const types = Array.isArray(event_type) ? event_type : [event_type];
        events = events.filter((e) => types.includes(e.event_type as EventType));
      }

      if (status) {
        const statuses = Array.isArray(status) ? status : [status];
        events = events.filter((e) => statuses.includes(e.status as EventStatus));
      }

      if (search) {
        const searchLower = search.toLowerCase();
        events = events.filter(
          (e) =>
            e.title.toLowerCase().includes(searchLower) ||
            e.description?.toLowerCase().includes(searchLower)
        );
      }
    }

    return events;
  }

  let query = db
    .from('events')
    .select('*')
    .eq('organization_id', organizationId);

  // Apply filters
  if (options?.filters) {
    const { event_type, status, is_public, start_date, end_date, search, tags } =
      options.filters;

    if (event_type) {
      if (Array.isArray(event_type)) {
        query = query.in('event_type', event_type);
      } else {
        query = query.eq('event_type', event_type);
      }
    }

    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    if (is_public !== undefined) {
      query = query.eq('is_public', is_public);
    }

    if (start_date) {
      query = query.gte('start_datetime', start_date);
    }

    if (end_date) {
      query = query.lte('start_datetime', end_date);
    }

    if (search) {
      query = query.or(`title.ilike.%${search}%,description.ilike.%${search}%`);
    }

    if (tags && tags.length > 0) {
      query = query.overlaps('tags', tags);
    }
  }

  // Apply sorting
  const sortField = options?.sort || 'start_datetime';
  const sortOrder = options?.order || 'asc';
  query = query.order(sortField, { ascending: sortOrder === 'asc' });

  // Apply pagination
  if (options?.page && options?.limit) {
    const from = (options.page - 1) * options.limit;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  } else if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching events:', error);
    throw error;
  }

  return data as Event[];
}

/**
 * Get upcoming events for an organization
 */
export async function getUpcomingEvents(
  organizationId: string,
  limit: number = 10,
  eventType?: EventType
): Promise<EventWithStats[]> {
  const { data, error } = await db.rpc('get_upcoming_events', {
    p_organization_id: organizationId,
    p_limit: limit,
    p_event_type: eventType || null,
  });

  if (error) {
    console.error('Error fetching upcoming events:', error);
    throw error;
  }

  return data as EventWithStats[];
}

/**
 * Get past events for an organization
 */
export async function getPastEvents(
  organizationId: string,
  limit: number = 20
): Promise<Event[]> {
  const { data, error } = await db
    .from('events')
    .select('*')
    .eq('organization_id', organizationId)
    .lt('start_datetime', new Date().toISOString())
    .order('start_datetime', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching past events:', error);
    throw error;
  }

  return data as Event[];
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string): Promise<Event> {
  const { data, error } = await db
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    console.error('Error fetching event:', error);
    throw error;
  }

  return data as Event;
}

/**
 * Get event with RSVP statistics
 */
export async function getEventWithStats(eventId: string): Promise<EventWithStats> {
  const { data, error } = await db.rpc('get_event_with_stats', {
    p_event_id: eventId,
  });

  if (error) {
    console.error('Error fetching event with stats:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    throw new Error('Event not found');
  }

  return data[0] as EventWithStats;
}

/**
 * Create a new event
 */
export async function createEvent(
  organizationId: string,
  input: CreateEventInput,
  createdBy?: string
): Promise<Event> {
  const { data, error } = await db
    .from('events')
    .insert({
      organization_id: organizationId,
      ...input,
      created_by: createdBy,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating event:', error);
    throw error;
  }

  return data as Event;
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  input: UpdateEventInput
): Promise<Event> {
  const { data, error } = await db
    .from('events')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating event:', error);
    throw error;
  }

  return data as Event;
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await db.from('events').delete().eq('id', eventId);

  if (error) {
    console.error('Error deleting event:', error);
    throw error;
  }
}

/**
 * Update event status
 */
export async function updateEventStatus(
  eventId: string,
  status: EventStatus
): Promise<Event> {
  return updateEvent(eventId, { status });
}

/**
 * Publish an event (change status from draft to published)
 */
export async function publishEvent(eventId: string): Promise<Event> {
  return updateEventStatus(eventId, 'published');
}

/**
 * Cancel an event
 */
export async function cancelEvent(eventId: string): Promise<Event> {
  return updateEventStatus(eventId, 'cancelled');
}

/**
 * Mark event as completed
 */
export async function completeEvent(eventId: string): Promise<Event> {
  return updateEventStatus(eventId, 'completed');
}

// =============================================
// RSVP Operations
// =============================================

/**
 * Get all RSVPs for an event
 */
export async function getEventRSVPs(eventId: string): Promise<EventRSVPWithPerson[]> {
  const { data, error } = await db
    .from('event_rsvps')
    .select(
      `
      *,
      person:members!event_rsvps_person_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .eq('event_id', eventId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching event RSVPs:', error);
    throw error;
  }

  return data as EventRSVPWithPerson[];
}

/**
 * Get attending RSVPs for an event
 */
export async function getAttendingRSVPs(eventId: string): Promise<EventRSVPWithPerson[]> {
  const { data, error } = await db
    .from('event_rsvps')
    .select(
      `
      *,
      person:members!event_rsvps_person_id_fkey (
        id,
        first_name,
        last_name,
        email,
        phone
      )
    `
    )
    .eq('event_id', eventId)
    .eq('status', 'attending')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching attending RSVPs:', error);
    throw error;
  }

  return data as EventRSVPWithPerson[];
}

/**
 * Get user's RSVP status for an event
 */
export async function getUserRSVPStatus(
  eventId: string,
  userId: string
): Promise<UserRSVPStatus | null> {
  const { data, error } = await db.rpc('get_user_rsvp_status', {
    p_event_id: eventId,
    p_user_id: userId,
  });

  if (error) {
    console.error('Error fetching user RSVP status:', error);
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  return data[0] as UserRSVPStatus;
}

/**
 * Create an RSVP
 */
export async function createRSVP(
  personId: string,
  input: CreateRSVPInput
): Promise<EventRSVP> {
  const { data, error } = await db
    .from('event_rsvps')
    .insert({
      person_id: personId,
      ...input,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating RSVP:', error);
    throw error;
  }

  return data as EventRSVP;
}

/**
 * Update an RSVP
 */
export async function updateRSVP(
  rsvpId: string,
  input: UpdateRSVPInput
): Promise<EventRSVP> {
  const { data, error } = await db
    .from('event_rsvps')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', rsvpId)
    .select()
    .single();

  if (error) {
    console.error('Error updating RSVP:', error);
    throw error;
  }

  return data as EventRSVP;
}

/**
 * Delete an RSVP
 */
export async function deleteRSVP(rsvpId: string): Promise<void> {
  const { error } = await db.from('event_rsvps').delete().eq('id', rsvpId);

  if (error) {
    console.error('Error deleting RSVP:', error);
    throw error;
  }
}

/**
 * Check in an attendee
 */
export async function checkInAttendee(
  rsvpId: string,
  checkedInBy?: string
): Promise<EventRSVP> {
  const { data, error } = await db
    .from('event_rsvps')
    .update({
      checked_in: true,
      checked_in_at: new Date().toISOString(),
      checked_in_by: checkedInBy,
    })
    .eq('id', rsvpId)
    .select()
    .single();

  if (error) {
    console.error('Error checking in attendee:', error);
    throw error;
  }

  return data as EventRSVP;
}

/**
 * Undo check-in for an attendee
 */
export async function undoCheckIn(rsvpId: string): Promise<EventRSVP> {
  const { data, error } = await db
    .from('event_rsvps')
    .update({
      checked_in: false,
      checked_in_at: null,
      checked_in_by: null,
    })
    .eq('id', rsvpId)
    .select()
    .single();

  if (error) {
    console.error('Error undoing check-in:', error);
    throw error;
  }

  return data as EventRSVP;
}

// =============================================
// Calendar/Date Range Queries
// =============================================

/**
 * Get events for a date range (calendar view)
 */
export async function getEventsInRange(
  organizationId: string,
  startDate: string,
  endDate: string,
  includePrivate: boolean = true
): Promise<Event[]> {
  let query = db
    .from('events')
    .select('*')
    .eq('organization_id', organizationId)
    .gte('start_datetime', startDate)
    .lte('start_datetime', endDate)
    .in('status', ['published', 'completed']);

  if (!includePrivate) {
    query = query.eq('is_public', true);
  }

  const { data, error } = await query.order('start_datetime', { ascending: true });

  if (error) {
    console.error('Error fetching events in range:', error);
    throw error;
  }

  return data as Event[];
}

/**
 * Get events for today
 */
export async function getTodayEvents(organizationId: string): Promise<Event[]> {
  const today = new Date();
  const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
  const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

  return getEventsInRange(organizationId, startOfDay, endOfDay);
}

/**
 * Get events for this week
 */
export async function getThisWeekEvents(organizationId: string): Promise<Event[]> {
  const today = new Date();
  const dayOfWeek = today.getDay();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - dayOfWeek);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  return getEventsInRange(
    organizationId,
    startOfWeek.toISOString(),
    endOfWeek.toISOString()
  );
}

/**
 * Get events for a specific month
 */
export async function getMonthEvents(
  organizationId: string,
  year: number,
  month: number
): Promise<Event[]> {
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);

  return getEventsInRange(
    organizationId,
    startOfMonth.toISOString(),
    endOfMonth.toISOString()
  );
}

// =============================================
// Statistics and Reports
// =============================================

/**
 * Get event attendance statistics
 */
export async function getEventAttendanceStats(eventId: string): Promise<{
  total_rsvps: number;
  attending: number;
  maybe: number;
  declined: number;
  checked_in: number;
  total_guests: number;
}> {
  const { data, error } = await db
    .from('event_rsvps')
    .select('status, guests_count, checked_in')
    .eq('event_id', eventId);

  if (error) {
    console.error('Error fetching attendance stats:', error);
    throw error;
  }

  const stats = {
    total_rsvps: data.length,
    attending: 0,
    maybe: 0,
    declined: 0,
    checked_in: 0,
    total_guests: 0,
  };

  data.forEach((rsvp: { status: string; checked_in: boolean; guests_count: number }) => {
    if (rsvp.status === 'attending') stats.attending++;
    if (rsvp.status === 'maybe') stats.maybe++;
    if (rsvp.status === 'declined') stats.declined++;
    if (rsvp.checked_in) stats.checked_in++;
    stats.total_guests += rsvp.guests_count || 0;
  });

  return stats;
}

/**
 * Get events count by type for an organization
 */
export async function getEventsCountByType(
  organizationId: string
): Promise<Record<EventType, number>> {
  const { data, error } = await db
    .from('events')
    .select('event_type')
    .eq('organization_id', organizationId);

  if (error) {
    console.error('Error fetching events count by type:', error);
    throw error;
  }

  const counts: Record<string, number> = {};
  data.forEach((event: { event_type: string }) => {
    counts[event.event_type] = (counts[event.event_type] || 0) + 1;
  });

  return counts as Record<EventType, number>;
}

// =============================================
// Export all functions as service object
// =============================================

export const eventsService = {
  // Events CRUD
  getEvents,
  getUpcomingEvents,
  getPastEvents,
  getEvent,
  getEventWithStats,
  createEvent,
  updateEvent,
  deleteEvent,
  updateEventStatus,
  publishEvent,
  cancelEvent,
  completeEvent,

  // RSVPs
  getEventRSVPs,
  getAttendingRSVPs,
  getUserRSVPStatus,
  createRSVP,
  updateRSVP,
  deleteRSVP,
  checkInAttendee,
  undoCheckIn,

  // Calendar queries
  getEventsInRange,
  getTodayEvents,
  getThisWeekEvents,
  getMonthEvents,

  // Statistics
  getEventAttendanceStats,
  getEventsCountByType,
};
