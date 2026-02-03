import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import {
  useEvents,
  useCreateEvent,
  useUpdateEvent,
  useDeleteEvent,
  usePublishEvent,
  useCancelEvent,
  useCompleteEvent,
} from '../hooks';
import {
  EventCard,
  EventModal,
  EventFilters,
  EventCalendar,
  DeleteEventModal,
} from '../components';
import type { Event, CreateEventInput, EventFilterOptions } from '../types';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

export default function EventsPage() {
  const { t } = useTranslation();
  const { currentOrganization: organization } = useOrganization();

  // State
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [filters, setFilters] = useState<EventFilterOptions>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);

  // Queries
  const {
    data: events = [],
    isLoading,
    error,
  } = useEvents(organization?.id || '', { filters });

  // Mutations
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const publishEvent = usePublishEvent();
  const cancelEvent = useCancelEvent();
  const completeEvent = useCompleteEvent();

  // Handlers
  const handleCreateEvent = async (data: CreateEventInput) => {
    if (!organization) return;

    try {
      await createEvent.mutateAsync({
        organizationId: organization.id,
        input: data,
      });
      toast.success(t('events.createSuccess') || 'Event created successfully');
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      toast.error(t('events.createError') || 'Failed to create event');
      console.error('Error creating event:', err);
    }
  };

  const handleUpdateEvent = async (data: CreateEventInput) => {
    if (!selectedEvent) return;

    try {
      await updateEvent.mutateAsync({
        eventId: selectedEvent.id,
        input: data,
      });
      toast.success(t('events.updateSuccess') || 'Event updated successfully');
      setIsModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      toast.error(t('events.updateError') || 'Failed to update event');
      console.error('Error updating event:', err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!selectedEvent) return;

    try {
      await deleteEvent.mutateAsync(selectedEvent.id);
      toast.success(t('events.deleteSuccess') || 'Event deleted successfully');
      setIsDeleteModalOpen(false);
      setSelectedEvent(null);
    } catch (err) {
      toast.error(t('events.deleteError') || 'Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };

  const handlePublishEvent = async (eventId: string) => {
    try {
      await publishEvent.mutateAsync(eventId);
      toast.success(t('events.publishSuccess') || 'Event published successfully');
    } catch (err) {
      toast.error(t('events.publishError') || 'Failed to publish event');
      console.error('Error publishing event:', err);
    }
  };

  const handleCancelEvent = async (eventId: string) => {
    try {
      await cancelEvent.mutateAsync(eventId);
      toast.success(t('events.cancelSuccess') || 'Event cancelled');
    } catch (err) {
      toast.error(t('events.cancelError') || 'Failed to cancel event');
      console.error('Error cancelling event:', err);
    }
  };

  const handleCompleteEvent = async (eventId: string) => {
    try {
      await completeEvent.mutateAsync(eventId);
      toast.success(t('events.completeSuccess') || 'Event marked as complete');
    } catch (err) {
      toast.error(t('events.completeError') || 'Failed to complete event');
      console.error('Error completing event:', err);
    }
  };

  const openEditModal = (event: Event) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };

  const openDeleteModal = (event: Event) => {
    setSelectedEvent(event);
    setIsDeleteModalOpen(true);
  };

  const openViewPage = (event: Event) => {
    // Navigate to event detail page
    window.location.href = `/${organization?.slug}/admin/events/${event.id}`;
  };

  // Categorize events
  const categorizedEvents = useMemo(() => {
    const now = new Date();
    const upcoming = events.filter((e) => new Date(e.start_datetime) > now);
    const past = events.filter((e) => new Date(e.start_datetime) <= now);

    return { upcoming, past, all: events };
  }, [events]);

  if (!organization) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {t('events.title') || 'Events'}
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            {t('events.subtitle') || 'Manage your mosque events and activities'}
          </p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
        >
          <Plus size={20} />
          {t('events.createEvent') || 'Create Event'}
        </button>
      </div>

      {/* Filters */}
      <EventFilters
        filters={filters}
        onFilterChange={setFilters}
        view={view}
        onViewChange={setView}
      />

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-500">{t('events.loadError') || 'Failed to load events'}</p>
        </div>
      ) : view === 'calendar' ? (
        <EventCalendar
          events={events}
          onEventClick={openViewPage}
          onDateClick={(date) => {
            setSelectedEvent(null);
            setIsModalOpen(true);
          }}
        />
      ) : events.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
          <Calendar size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {t('events.noEvents') || 'No events found'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {t('events.noEventsDescription') || 'Create your first event to get started'}
          </p>
          <button
            onClick={() => {
              setSelectedEvent(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
          >
            <Plus size={20} />
            {t('events.createEvent') || 'Create Event'}
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Upcoming Events */}
          {categorizedEvents.upcoming.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.upcoming') || 'Upcoming Events'} ({categorizedEvents.upcoming.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedEvents.upcoming.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onView={openViewPage}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onPublish={handlePublishEvent}
                    onCancel={handleCancelEvent}
                    isPublishing={publishEvent.isPending}
                    isCancelling={cancelEvent.isPending}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Events */}
          {categorizedEvents.past.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.past') || 'Past Events'} ({categorizedEvents.past.length})
              </h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {categorizedEvents.past.map((event) => (
                  <EventCard
                    key={event.id}
                    event={event}
                    onView={openViewPage}
                    onEdit={openEditModal}
                    onDelete={openDeleteModal}
                    onComplete={handleCompleteEvent}
                    isCompleting={completeEvent.isPending}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create/Edit Modal */}
      <EventModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedEvent(null);
        }}
        onSubmit={selectedEvent ? handleUpdateEvent : handleCreateEvent}
        event={selectedEvent}
        isLoading={createEvent.isPending || updateEvent.isPending}
      />

      {/* Delete Modal */}
      <DeleteEventModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedEvent(null);
        }}
        onConfirm={handleDeleteEvent}
        event={selectedEvent}
        isDeleting={deleteEvent.isPending}
      />
    </div>
  );
}
