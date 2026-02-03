import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Calendar, MapPin, Video, Users, Tag } from 'lucide-react';
import type { Event, CreateEventInput } from '../types';
import { createEventSchema, EVENT_TYPES, EVENT_TYPE_LABELS, EVENT_STATUSES } from '../types';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateEventInput) => void;
  event?: Event | null;
  isLoading?: boolean;
}

export default function EventModal({
  isOpen,
  onClose,
  onSubmit,
  event,
  isLoading,
}: EventModalProps) {
  const { t } = useTranslation();
  const isEditing = !!event;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
    reset,
  } = useForm<CreateEventInput>({
    resolver: zodResolver(createEventSchema),
    defaultValues: event
      ? {
          title: event.title,
          description: event.description || '',
          event_type: event.event_type,
          start_datetime: event.start_datetime.slice(0, 16),
          end_datetime: event.end_datetime?.slice(0, 16) || '',
          all_day: event.all_day,
          hijri_date: event.hijri_date || '',
          location: event.location || '',
          is_virtual: event.is_virtual,
          virtual_link: event.virtual_link || '',
          capacity: event.capacity || undefined,
          rsvp_enabled: event.rsvp_enabled,
          rsvp_deadline: event.rsvp_deadline?.slice(0, 16) || '',
          is_recurring: event.is_recurring,
          is_public: event.is_public,
          status: event.status,
          tags: event.tags || [],
          contact_name: event.contact_name || '',
          contact_email: event.contact_email || '',
          contact_phone: event.contact_phone || '',
        }
      : {
          title: '',
          description: '',
          event_type: 'community',
          start_datetime: '',
          end_datetime: '',
          all_day: false,
          is_virtual: false,
          rsvp_enabled: false,
          is_recurring: false,
          is_public: false,
          status: 'draft',
          tags: [],
        },
  });

  const isVirtual = watch('is_virtual');
  const rsvpEnabled = watch('rsvp_enabled');
  const allDay = watch('all_day');

  const handleFormSubmit = (data: CreateEventInput) => {
    onSubmit(data);
    reset();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-2xl bg-white dark:bg-slate-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing
                ? t('events.editEvent') || 'Edit Event'
                : t('events.createEvent') || 'Create Event'}
            </h2>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('events.title') || 'Title'} *
              </label>
              <input
                {...register('title')}
                type="text"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('events.titlePlaceholder') || 'Enter event title'}
              />
              {errors.title && (
                <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
              )}
            </div>

            {/* Event Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('events.type') || 'Event Type'} *
              </label>
              <select
                {...register('event_type')}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                {EVENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {t(`events.types.${type}`) || EVENT_TYPE_LABELS[type]}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('events.description') || 'Description'}
              </label>
              <textarea
                {...register('description')}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder={t('events.descriptionPlaceholder') || 'Describe the event...'}
              />
            </div>

            {/* Date & Time Section */}
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Calendar size={16} />
                {t('events.dateTime') || 'Date & Time'}
              </div>

              {/* All Day Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('all_day')}
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('events.allDayEvent') || 'All day event'}
                </span>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('events.startDateTime') || 'Start'} *
                  </label>
                  <input
                    {...register('start_datetime')}
                    type={allDay ? 'date' : 'datetime-local'}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.start_datetime && (
                    <p className="text-sm text-red-500 mt-1">{errors.start_datetime.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('events.endDateTime') || 'End'}
                  </label>
                  <input
                    {...register('end_datetime')}
                    type={allDay ? 'date' : 'datetime-local'}
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Hijri Date */}
              <div>
                <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                  {t('events.hijriDate') || 'Hijri Date (optional)'}
                </label>
                <input
                  {...register('hijri_date')}
                  type="text"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., 15 Ramadan 1445"
                />
              </div>
            </div>

            {/* Location Section */}
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <MapPin size={16} />
                {t('events.location') || 'Location'}
              </div>

              {/* Virtual Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('is_virtual')}
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <Video size={16} className="text-blue-500" />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('events.virtualEvent') || 'Virtual Event'}
                </span>
              </label>

              {isVirtual ? (
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('events.virtualLink') || 'Meeting Link'}
                  </label>
                  <input
                    {...register('virtual_link')}
                    type="url"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://zoom.us/..."
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('events.physicalLocation') || 'Location'}
                  </label>
                  <input
                    {...register('location')}
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={t('events.locationPlaceholder') || 'Main Hall, Room 101...'}
                  />
                </div>
              )}
            </div>

            {/* RSVP Section */}
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Users size={16} />
                {t('events.rsvp') || 'RSVP & Attendance'}
              </div>

              {/* RSVP Toggle */}
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  {...register('rsvp_enabled')}
                  type="checkbox"
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-600 dark:text-slate-400">
                  {t('events.enableRSVP') || 'Enable RSVP'}
                </span>
              </label>

              {rsvpEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {t('events.capacity') || 'Capacity'}
                    </label>
                    <input
                      {...register('capacity', { valueAsNumber: true })}
                      type="number"
                      min="1"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder={t('events.unlimited') || 'Unlimited'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                      {t('events.rsvpDeadline') || 'RSVP Deadline'}
                    </label>
                    <input
                      {...register('rsvp_deadline')}
                      type="datetime-local"
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Visibility & Status */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('events.status') || 'Status'}
                </label>
                <select
                  {...register('status')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  {EVENT_STATUSES.filter((s) => s !== 'completed').map((status) => (
                    <option key={status} value={status}>
                      {t(`events.status.${status}`) || status}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('events.visibility') || 'Visibility'}
                </label>
                <label className="flex items-center gap-2 mt-2 cursor-pointer">
                  <input
                    {...register('is_public')}
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600 dark:text-slate-400">
                    {t('events.publicEvent') || 'Public event (visible to non-members)'}
                  </span>
                </label>
              </div>
            </div>

            {/* Contact Info */}
            <div className="space-y-3 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
                <Tag size={16} />
                {t('events.contactInfo') || 'Contact Information'}
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('events.contactName') || 'Name'}
                  </label>
                  <input
                    {...register('contact_name')}
                    type="text"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('events.contactEmail') || 'Email'}
                  </label>
                  <input
                    {...register('contact_email')}
                    type="email"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">
                    {t('events.contactPhone') || 'Phone'}
                  </label>
                  <input
                    {...register('contact_phone')}
                    type="tel"
                    className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>
            </div>
          </form>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              onClick={handleSubmit(handleFormSubmit)}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50"
            >
              {isLoading
                ? t('common.saving') || 'Saving...'
                : isEditing
                  ? t('common.save') || 'Save'
                  : t('events.createEvent') || 'Create Event'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
