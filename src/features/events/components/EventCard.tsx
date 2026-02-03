import { useTranslation } from 'react-i18next';
import {
  Calendar,
  Clock,
  MapPin,
  Users,
  Video,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Ban,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useState } from 'react';
import type { Event, EventWithStats } from '../types';
import { EVENT_TYPE_LABELS, EVENT_TYPE_COLORS, EVENT_STATUS_COLORS } from '../types';

interface EventCardProps {
  event: Event | EventWithStats;
  onEdit?: (event: Event | EventWithStats) => void;
  onDelete?: (event: Event | EventWithStats) => void;
  onView?: (event: Event | EventWithStats) => void;
  onPublish?: (eventId: string) => void;
  onCancel?: (eventId: string) => void;
  onComplete?: (eventId: string) => void;
  showActions?: boolean;
  isPublishing?: boolean;
  isCancelling?: boolean;
  isCompleting?: boolean;
}

export default function EventCard({
  event,
  onEdit,
  onDelete,
  onView,
  onPublish,
  onCancel,
  onComplete,
  showActions = true,
  isPublishing,
  isCancelling,
  isCompleting,
}: EventCardProps) {
  const { t, i18n } = useTranslation();
  const [showMenu, setShowMenu] = useState(false);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isUpcoming = new Date(event.start_datetime) > new Date();
  const isPast = new Date(event.start_datetime) < new Date();
  const hasStats = 'attending_count' in event;

  return (
    <div
      className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow ${
        event.status === 'cancelled' ? 'opacity-60' : ''
      }`}
    >
      {/* Cover Image */}
      {event.cover_image_url && (
        <div className="h-32 overflow-hidden rounded-t-lg">
          <img
            src={event.cover_image_url}
            alt={event.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            {/* Event Type Badge */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
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

            {/* Title */}
            <h3
              className="font-semibold text-slate-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
              onClick={() => onView?.(event)}
            >
              {event.title}
            </h3>

            {/* Description */}
            {event.description && (
              <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                {event.description}
              </p>
            )}
          </div>

          {/* Actions Menu */}
          {showActions && (
            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
              >
                <MoreVertical size={18} className="text-slate-500" />
              </button>

              {showMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                  <div className="absolute end-0 top-8 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1">
                    <button
                      onClick={() => {
                        onView?.(event);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <Eye size={16} />
                      {t('common.view') || 'View'}
                    </button>

                    <button
                      onClick={() => {
                        onEdit?.(event);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                      <Edit size={16} />
                      {t('common.edit') || 'Edit'}
                    </button>

                    {event.status === 'draft' && (
                      <button
                        onClick={() => {
                          onPublish?.(event.id);
                          setShowMenu(false);
                        }}
                        disabled={isPublishing}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <Send size={16} />
                        {t('events.publish') || 'Publish'}
                      </button>
                    )}

                    {event.status === 'published' && isUpcoming && (
                      <button
                        onClick={() => {
                          onCancel?.(event.id);
                          setShowMenu(false);
                        }}
                        disabled={isCancelling}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-amber-600 dark:text-amber-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <Ban size={16} />
                        {t('events.cancel') || 'Cancel Event'}
                      </button>
                    )}

                    {event.status === 'published' && isPast && (
                      <button
                        onClick={() => {
                          onComplete?.(event.id);
                          setShowMenu(false);
                        }}
                        disabled={isCompleting}
                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                      >
                        <CheckCircle size={16} />
                        {t('events.markComplete') || 'Mark Complete'}
                      </button>
                    )}

                    <hr className="my-1 border-slate-200 dark:border-slate-700" />

                    <button
                      onClick={() => {
                        onDelete?.(event);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Trash2 size={16} />
                      {t('common.delete') || 'Delete'}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Event Details */}
      <div className="px-4 pb-4 space-y-2">
        {/* Date & Time */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <Calendar size={14} className="flex-shrink-0" />
          <span>{formatDate(event.start_datetime)}</span>
          {!event.all_day && (
            <>
              <Clock size={14} className="flex-shrink-0 ms-2" />
              <span>
                {formatTime(event.start_datetime)}
                {event.end_datetime && ` - ${formatTime(event.end_datetime)}`}
              </span>
            </>
          )}
          {event.all_day && (
            <span className="text-xs text-slate-500">
              ({t('events.allDay') || 'All Day'})
            </span>
          )}
        </div>

        {/* Hijri Date */}
        {event.hijri_date && (
          <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-500">
            <span className="ms-6">{event.hijri_date}</span>
          </div>
        )}

        {/* Location */}
        {(event.location || event.is_virtual) && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            {event.is_virtual ? (
              <>
                <Video size={14} className="flex-shrink-0 text-blue-500" />
                <span>{t('events.virtualEvent') || 'Virtual Event'}</span>
                {event.virtual_link && (
                  <a
                    href={event.virtual_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline truncate"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {t('events.joinLink') || 'Join Link'}
                  </a>
                )}
              </>
            ) : (
              <>
                <MapPin size={14} className="flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </>
            )}
          </div>
        )}

        {/* RSVP Info */}
        {event.rsvp_enabled && (
          <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
            <Users size={14} className="flex-shrink-0" />
            {hasStats ? (
              <span>
                {(event as EventWithStats).attending_count}{' '}
                {t('events.attending') || 'attending'}
                {event.capacity && (
                  <span className="text-slate-500">
                    {' '}
                    / {event.capacity} {t('events.capacity') || 'capacity'}
                  </span>
                )}
              </span>
            ) : (
              <span>
                {t('events.rsvpEnabled') || 'RSVP enabled'}
                {event.capacity && (
                  <span className="text-slate-500">
                    {' '}
                    ({event.capacity} {t('events.maxCapacity') || 'max'})
                  </span>
                )}
              </span>
            )}
          </div>
        )}

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {event.tags.map((tag, index) => (
              <span
                key={index}
                className="text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 rounded"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
