/**
 * Events Module - Public Exports
 *
 * This module provides complete event management functionality:
 * - Event CRUD operations
 * - RSVP management
 * - Calendar view
 * - Check-in tracking
 */

// Types - export specific types to avoid conflicts with component names
export type {
  EventType,
  EventStatus,
  RSVPStatus,
  RecurrenceRule,
  Event,
  EventWithStats,
  EventRSVP,
  EventRSVPWithPerson,
  UserRSVPStatus,
  CreateEventInput,
  UpdateEventInput,
  CreateRSVPInput,
  UpdateRSVPInput,
  EventFilterOptions,
  EventsQueryOptions,
  CalendarEvent,
} from './types';

export {
  EVENT_TYPES,
  EVENT_TYPE_LABELS,
  EVENT_TYPE_COLORS,
  EVENT_STATUSES,
  EVENT_STATUS_LABELS,
  EVENT_STATUS_COLORS,
  RSVP_STATUSES,
  RSVP_STATUS_LABELS,
  RSVP_STATUS_COLORS,
  createEventSchema,
  updateEventSchema,
  createRSVPSchema,
  updateRSVPSchema,
  recurrenceRuleSchema,
  toCalendarEvent,
} from './types';

// Hooks
export * from './hooks';

// Components
export * from './components';

// Pages
export * from './pages';

// Service (for direct access if needed)
export { eventsService } from './services/events.service';
