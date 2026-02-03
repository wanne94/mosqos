import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  Video,
  Users,
  Edit,
  Trash2,
  Send,
  Ban,
  CheckCircle,
  ExternalLink,
  Mail,
  Phone,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { useOrganization } from '@/app/providers/OrganizationProvider';
import {
  useEventWithStats,
  useUpdateEvent,
  useDeleteEvent,
  usePublishEvent,
  useCancelEvent,
  useCompleteEvent,
} from '../hooks';
import {
  useEventRSVPs,
  useCheckInAttendee,
  useUndoCheckIn,
} from '../hooks/useEventRSVPs';
import { EventModal, EventRSVPList, DeleteEventModal } from '../components';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, EVENT_STATUS_COLORS } from '../types';
import type { CreateEventInput, Event } from '../types';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

export default function EventDetailPage() {
  const { t, i18n } = useTranslation();
  const { slug, eventId } = useParams<{ slug: string; eventId: string }>();
  const navigate = useNavigate();
  const { currentOrganization: organization } = useOrganization();

  // State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [checkingInRSVP, setCheckingInRSVP] = useState<string | null>(null);

  // Queries
  const { data: event, isLoading, error } = useEventWithStats(eventId || '');
  const { data: rsvps = [], isLoading: isLoadingRSVPs } = useEventRSVPs(eventId || '');

  // Mutations
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const publishEvent = usePublishEvent();
  const cancelEvent = useCancelEvent();
  const completeEvent = useCompleteEvent();
  const checkInAttendee = useCheckInAttendee();
  const undoCheckIn = useUndoCheckIn();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Handlers
  const handleUpdateEvent = async (data: CreateEventInput) => {
    if (!event) return;

    try {
      await updateEvent.mutateAsync({
        eventId: event.id,
        input: data,
      });
      toast.success(t('events.updateSuccess') || 'Event updated successfully');
      setIsEditModalOpen(false);
    } catch (err) {
      toast.error(t('events.updateError') || 'Failed to update event');
      console.error('Error updating event:', err);
    }
  };

  const handleDeleteEvent = async () => {
    if (!event) return;

    try {
      await deleteEvent.mutateAsync(event.id);
      toast.success(t('events.deleteSuccess') || 'Event deleted successfully');
      navigate(`/${slug}/admin/events`);
    } catch (err) {
      toast.error(t('events.deleteError') || 'Failed to delete event');
      console.error('Error deleting event:', err);
    }
  };

  const handlePublish = async () => {
    if (!event) return;

    try {
      await publishEvent.mutateAsync(event.id);
      toast.success(t('events.publishSuccess') || 'Event published successfully');
    } catch (err) {
      toast.error(t('events.publishError') || 'Failed to publish event');
    }
  };

  const handleCancel = async () => {
    if (!event) return;

    try {
      await cancelEvent.mutateAsync(event.id);
      toast.success(t('events.cancelSuccess') || 'Event cancelled');
    } catch (err) {
      toast.error(t('events.cancelError') || 'Failed to cancel event');
    }
  };

  const handleComplete = async () => {
    if (!event) return;

    try {
      await completeEvent.mutateAsync(event.id);
      toast.success(t('events.completeSuccess') || 'Event marked as complete');
    } catch (err) {
      toast.error(t('events.completeError') || 'Failed to complete event');
    }
  };

  const handleCheckIn = async (rsvpId: string) => {
    setCheckingInRSVP(rsvpId);
    try {
      await checkInAttendee.mutateAsync({ rsvpId });
      toast.success(t('events.checkInSuccess') || 'Attendee checked in');
    } catch (err) {
      toast.error(t('events.checkInError') || 'Failed to check in attendee');
    } finally {
      setCheckingInRSVP(null);
    }
  };

  const handleUndoCheckIn = async (rsvpId: string) => {
    setCheckingInRSVP(rsvpId);
    try {
      await undoCheckIn.mutateAsync(rsvpId);
      toast.success(t('events.undoCheckInSuccess') || 'Check-in undone');
    } catch (err) {
      toast.error(t('events.undoCheckInError') || 'Failed to undo check-in');
    } finally {
      setCheckingInRSVP(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">{t('events.notFound') || 'Event not found'}</p>
        <button
          onClick={() => navigate(`/${slug}/admin/events`)}
          className="mt-4 text-blue-600 hover:underline"
        >
          {t('events.backToList') || 'Back to events'}
        </button>
      </div>
    );
  }

  const isUpcoming = new Date(event.start_datetime) > new Date();
  const isPast = new Date(event.start_datetime) < new Date();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(`/${slug}/admin/events`)}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
        >
          <ArrowLeft size={20} className="text-slate-600 dark:text-slate-400" />
        </button>
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${EVENT_TYPE_COLORS[event.event_type]}`}
            >
              {t(`events.types.${event.event_type}`) || EVENT_TYPE_LABELS[event.event_type]}
            </span>
            <span
              className={`inline-flex items-center text-xs px-2 py-0.5 rounded-full ${EVENT_STATUS_COLORS[event.status]}`}
            >
              {t(`events.status.${event.status}`) || event.status}
            </span>
            {event.is_public && (
              <span className="inline-flex items-center text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
                {t('events.public') || 'Public'}
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            {event.title}
          </h1>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {event.status === 'draft' && (
            <button
              onClick={handlePublish}
              disabled={publishEvent.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Send size={16} />
              {t('events.publish') || 'Publish'}
            </button>
          )}

          {event.status === 'published' && isUpcoming && (
            <button
              onClick={handleCancel}
              disabled={cancelEvent.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <Ban size={16} />
              {t('events.cancel') || 'Cancel'}
            </button>
          )}

          {event.status === 'published' && isPast && (
            <button
              onClick={handleComplete}
              disabled={completeEvent.isPending}
              className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium disabled:opacity-50"
            >
              <CheckCircle size={16} />
              {t('events.markComplete') || 'Complete'}
            </button>
          )}

          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-medium"
          >
            <Edit size={16} />
            {t('common.edit') || 'Edit'}
          </button>

          <button
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center gap-2 px-3 py-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg text-sm font-medium"
          >
            <Trash2 size={16} />
            {t('common.delete') || 'Delete'}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Event Details Card */}
          <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
            {/* Cover Image */}
            {event.cover_image_url && (
              <div className="h-48 -mx-6 -mt-6 mb-6 overflow-hidden rounded-t-lg">
                <img
                  src={event.cover_image_url}
                  alt={event.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                  {t('events.description') || 'Description'}
                </h3>
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            )}

            {/* Details Grid */}
            <div className="grid gap-4 sm:grid-cols-2">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar size={20} className="text-slate-400 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('events.date') || 'Date'}
                  </div>
                  <div className="text-slate-900 dark:text-white">
                    {formatDate(event.start_datetime)}
                  </div>
                  {event.hijri_date && (
                    <div className="text-sm text-slate-500 dark:text-slate-400">
                      {event.hijri_date}
                    </div>
                  )}
                </div>
              </div>

              {/* Time */}
              {!event.all_day && (
                <div className="flex items-start gap-3">
                  <Clock size={20} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('events.time') || 'Time'}
                    </div>
                    <div className="text-slate-900 dark:text-white">
                      {formatTime(event.start_datetime)}
                      {event.end_datetime && ` - ${formatTime(event.end_datetime)}`}
                    </div>
                  </div>
                </div>
              )}

              {/* Location */}
              <div className="flex items-start gap-3">
                {event.is_virtual ? (
                  <Video size={20} className="text-blue-500 mt-0.5" />
                ) : (
                  <MapPin size={20} className="text-slate-400 mt-0.5" />
                )}
                <div>
                  <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                    {t('events.location') || 'Location'}
                  </div>
                  {event.is_virtual ? (
                    <div>
                      <span className="text-slate-900 dark:text-white">
                        {t('events.virtualEvent') || 'Virtual Event'}
                      </span>
                      {event.virtual_link && (
                        <a
                          href={event.virtual_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 hover:underline mt-1"
                        >
                          <ExternalLink size={14} />
                          {t('events.joinLink') || 'Join Meeting'}
                        </a>
                      )}
                    </div>
                  ) : (
                    <div className="text-slate-900 dark:text-white">
                      {event.location || t('events.noLocation') || 'No location specified'}
                    </div>
                  )}
                </div>
              </div>

              {/* Capacity */}
              {event.rsvp_enabled && (
                <div className="flex items-start gap-3">
                  <Users size={20} className="text-slate-400 mt-0.5" />
                  <div>
                    <div className="text-sm font-medium text-slate-500 dark:text-slate-400">
                      {t('events.attendance') || 'Attendance'}
                    </div>
                    <div className="text-slate-900 dark:text-white">
                      {event.attending_count} {t('events.attending') || 'attending'}
                      {event.capacity && (
                        <span className="text-slate-500">
                          {' '}
                          / {event.capacity} {t('events.capacity') || 'capacity'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Contact Info */}
            {(event.contact_name || event.contact_email || event.contact_phone) && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-3">
                  {t('events.contactInfo') || 'Contact Information'}
                </h3>
                <div className="flex flex-wrap gap-4">
                  {event.contact_name && (
                    <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                      <User size={16} className="text-slate-400" />
                      {event.contact_name}
                    </div>
                  )}
                  {event.contact_email && (
                    <a
                      href={`mailto:${event.contact_email}`}
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Mail size={16} />
                      {event.contact_email}
                    </a>
                  )}
                  {event.contact_phone && (
                    <a
                      href={`tel:${event.contact_phone}`}
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <Phone size={16} />
                      {event.contact_phone}
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags && event.tags.length > 0 && (
              <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                <div className="flex flex-wrap gap-2">
                  {event.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="text-sm px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar - RSVPs */}
        <div className="space-y-6">
          {event.rsvp_enabled && (
            <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">
                {t('events.rsvps') || 'RSVPs'}
              </h3>

              {isLoadingRSVPs ? (
                <div className="flex items-center justify-center py-8">
                  <LoadingSpinner />
                </div>
              ) : (
                <EventRSVPList
                  rsvps={rsvps}
                  onCheckIn={handleCheckIn}
                  onUndoCheckIn={handleUndoCheckIn}
                  isCheckingIn={checkingInRSVP || undefined}
                  showCheckIn={event.status === 'published'}
                />
              )}
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      <EventModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleUpdateEvent}
        event={event as Event}
        isLoading={updateEvent.isPending}
      />

      {/* Delete Modal */}
      <DeleteEventModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteEvent}
        event={event as Event}
        isDeleting={deleteEvent.isPending}
      />
    </div>
  );
}
