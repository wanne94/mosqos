/**
 * Events Module Types
 */

import { z } from 'zod';

// =============================================
// Event Types Enum
// =============================================

export const EVENT_TYPES = [
  'prayer',
  'class',
  'lecture',
  'meeting',
  'community',
  'fundraiser',
  'iftar',
  'taraweeh',
  'eid',
  'sports',
  'youth',
  'sisters',
  'other',
] as const;

export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  prayer: 'Prayer',
  class: 'Class',
  lecture: 'Lecture',
  meeting: 'Meeting',
  community: 'Community Event',
  fundraiser: 'Fundraiser',
  iftar: 'Iftar',
  taraweeh: 'Taraweeh',
  eid: 'Eid',
  sports: 'Sports',
  youth: 'Youth Program',
  sisters: 'Sisters Program',
  other: 'Other',
};

export const EVENT_TYPE_COLORS: Record<EventType, string> = {
  prayer: 'bg-green-100 text-green-800',
  class: 'bg-blue-100 text-blue-800',
  lecture: 'bg-purple-100 text-purple-800',
  meeting: 'bg-gray-100 text-gray-800',
  community: 'bg-yellow-100 text-yellow-800',
  fundraiser: 'bg-pink-100 text-pink-800',
  iftar: 'bg-orange-100 text-orange-800',
  taraweeh: 'bg-teal-100 text-teal-800',
  eid: 'bg-red-100 text-red-800',
  sports: 'bg-indigo-100 text-indigo-800',
  youth: 'bg-cyan-100 text-cyan-800',
  sisters: 'bg-rose-100 text-rose-800',
  other: 'bg-slate-100 text-slate-800',
};

// =============================================
// Event Status Enum
// =============================================

export const EVENT_STATUSES = ['draft', 'published', 'cancelled', 'completed'] as const;

export type EventStatus = (typeof EVENT_STATUSES)[number];

export const EVENT_STATUS_LABELS: Record<EventStatus, string> = {
  draft: 'Draft',
  published: 'Published',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export const EVENT_STATUS_COLORS: Record<EventStatus, string> = {
  draft: 'bg-gray-100 text-gray-800',
  published: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
  completed: 'bg-blue-100 text-blue-800',
};

// =============================================
// RSVP Status Enum
// =============================================

export const RSVP_STATUSES = ['attending', 'maybe', 'declined'] as const;

export type RSVPStatus = (typeof RSVP_STATUSES)[number];

export const RSVP_STATUS_LABELS: Record<RSVPStatus, string> = {
  attending: 'Attending',
  maybe: 'Maybe',
  declined: 'Not Attending',
};

export const RSVP_STATUS_COLORS: Record<RSVPStatus, string> = {
  attending: 'bg-green-100 text-green-800',
  maybe: 'bg-yellow-100 text-yellow-800',
  declined: 'bg-red-100 text-red-800',
};

// =============================================
// Recurrence Rule Type
// =============================================

export interface RecurrenceRule {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  until?: string; // ISO date string
  count?: number;
  byDay?: string[]; // ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU']
  byMonthDay?: number[];
  byMonth?: number[];
}

// =============================================
// Event Interface
// =============================================

export interface Event {
  id: string;
  organization_id: string;

  // Basic info
  title: string;
  description: string | null;
  event_type: EventType;

  // Date and time
  start_datetime: string;
  end_datetime: string | null;
  all_day: boolean;
  hijri_date: string | null;

  // Location
  location: string | null;
  is_virtual: boolean;
  virtual_link: string | null;

  // Capacity and registration
  capacity: number | null;
  rsvp_enabled: boolean;
  rsvp_deadline: string | null;

  // Recurrence
  is_recurring: boolean;
  recurrence_rule: RecurrenceRule | null;
  parent_event_id: string | null;

  // Visibility and status
  is_public: boolean;
  status: EventStatus;

  // Categories and tags
  category_id: string | null;
  tags: string[] | null;

  // Media
  cover_image_url: string | null;
  attachments: Array<{ name: string; url: string; type: string }>;

  // Contact
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;

  // Metadata
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Event with Stats (from RPC function)
// =============================================

export interface EventWithStats extends Event {
  attending_count: number;
  maybe_count: number;
  declined_count: number;
  checked_in_count: number;
}

// =============================================
// Event RSVP Interface
// =============================================

export interface EventRSVP {
  id: string;
  event_id: string;
  person_id: string;
  status: RSVPStatus;
  guests_count: number;
  notes: string | null;
  checked_in: boolean;
  checked_in_at: string | null;
  checked_in_by: string | null;
  created_at: string;
  updated_at: string;
}

// =============================================
// Event RSVP with Person Info
// =============================================

export interface EventRSVPWithPerson extends EventRSVP {
  person: {
    id: string;
    first_name: string;
    last_name: string;
    email: string | null;
    phone: string | null;
  };
}

// =============================================
// User RSVP Status (from RPC function)
// =============================================

export interface UserRSVPStatus {
  rsvp_id: string | null;
  status: RSVPStatus | null;
  guests_count: number;
  checked_in: boolean;
}

// =============================================
// Zod Schemas for Validation
// =============================================

export const recurrenceRuleSchema = z.object({
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  interval: z.number().min(1).default(1),
  until: z.string().optional(),
  count: z.number().min(1).optional(),
  byDay: z.array(z.enum(['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'])).optional(),
  byMonthDay: z.array(z.number().min(1).max(31)).optional(),
  byMonth: z.array(z.number().min(1).max(12)).optional(),
});

export const createEventSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(5000).optional(),
    event_type: z.enum(EVENT_TYPES),

    start_datetime: z.string().min(1, 'Start date/time is required'),
    end_datetime: z.string().optional(),
    all_day: z.boolean().default(false),
    hijri_date: z.string().optional(),

    location: z.string().max(500).optional(),
    is_virtual: z.boolean().default(false),
    virtual_link: z.string().url().optional().or(z.literal('')),

    capacity: z.number().min(1).optional(),
    rsvp_enabled: z.boolean().default(false),
    rsvp_deadline: z.string().optional(),

    is_recurring: z.boolean().default(false),
    recurrence_rule: recurrenceRuleSchema.optional(),

    is_public: z.boolean().default(false),
    status: z.enum(EVENT_STATUSES).default('draft'),

    tags: z.array(z.string()).optional(),
    cover_image_url: z.string().url().optional().or(z.literal('')),

    contact_name: z.string().max(100).optional(),
    contact_email: z.string().email().optional().or(z.literal('')),
    contact_phone: z.string().max(20).optional(),
  })
  .refine(
    (data) => {
      if (data.is_virtual && !data.virtual_link) {
        return true; // Virtual link is optional
      }
      return true;
    },
    {
      message: 'Virtual link is recommended for virtual events',
      path: ['virtual_link'],
    }
  );

export type CreateEventInput = z.infer<typeof createEventSchema>;

// For update, we need the base object schema without the refinement
export const updateEventSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  event_type: z.enum(EVENT_TYPES).optional(),

  start_datetime: z.string().optional(),
  end_datetime: z.string().optional(),
  all_day: z.boolean().optional(),
  hijri_date: z.string().optional(),

  location: z.string().max(500).optional(),
  is_virtual: z.boolean().optional(),
  virtual_link: z.string().url().optional().or(z.literal('')),

  capacity: z.number().min(1).optional(),
  rsvp_enabled: z.boolean().optional(),
  rsvp_deadline: z.string().optional(),

  is_recurring: z.boolean().optional(),
  recurrence_rule: recurrenceRuleSchema.optional(),

  is_public: z.boolean().optional(),
  status: z.enum(EVENT_STATUSES).optional(),

  tags: z.array(z.string()).optional(),
  cover_image_url: z.string().url().optional().or(z.literal('')),

  contact_name: z.string().max(100).optional(),
  contact_email: z.string().email().optional().or(z.literal('')),
  contact_phone: z.string().max(20).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const createRSVPSchema = z.object({
  event_id: z.string().uuid(),
  status: z.enum(RSVP_STATUSES),
  guests_count: z.number().min(0).default(0),
  notes: z.string().max(500).optional(),
});

export type CreateRSVPInput = z.infer<typeof createRSVPSchema>;

export const updateRSVPSchema = z.object({
  status: z.enum(RSVP_STATUSES).optional(),
  guests_count: z.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

export type UpdateRSVPInput = z.infer<typeof updateRSVPSchema>;

// =============================================
// Filter and Query Types
// =============================================

export interface EventFilterOptions {
  event_type?: EventType | EventType[];
  status?: EventStatus | EventStatus[];
  is_public?: boolean;
  start_date?: string;
  end_date?: string;
  search?: string;
  tags?: string[];
}

// Alias for backward compatibility
export type EventFilters = EventFilterOptions;

export interface EventsQueryOptions {
  filters?: EventFilters;
  sort?: 'start_datetime' | 'created_at' | 'title';
  order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// =============================================
// Calendar View Types
// =============================================

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date | null;
  allDay: boolean;
  eventType: EventType;
  status: EventStatus;
  color: string;
  extendedProps: {
    description: string | null;
    location: string | null;
    is_virtual: boolean;
    rsvp_enabled: boolean;
    capacity: number | null;
    attending_count?: number;
  };
}

/**
 * Convert Event to CalendarEvent format
 */
export function toCalendarEvent(event: Event | EventWithStats): CalendarEvent {
  return {
    id: event.id,
    title: event.title,
    start: new Date(event.start_datetime),
    end: event.end_datetime ? new Date(event.end_datetime) : null,
    allDay: event.all_day,
    eventType: event.event_type,
    status: event.status,
    color: EVENT_TYPE_COLORS[event.event_type],
    extendedProps: {
      description: event.description,
      location: event.location,
      is_virtual: event.is_virtual,
      rsvp_enabled: event.rsvp_enabled,
      capacity: event.capacity,
      attending_count: 'attending_count' in event ? event.attending_count : undefined,
    },
  };
}
