import { useTranslation } from 'react-i18next';
import { AlertTriangle, X } from 'lucide-react';
import type { Event } from '../types';

interface DeleteEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  event: Event | null;
  isDeleting?: boolean;
}

export default function DeleteEventModal({
  isOpen,
  onClose,
  onConfirm,
  event,
  isDeleting,
}: DeleteEventModalProps) {
  const { t } = useTranslation();

  if (!isOpen || !event) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black/50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-xl shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle size={20} className="text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('events.deleteEvent') || 'Delete Event'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <X size={20} className="text-slate-500" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4">
            <p className="text-slate-600 dark:text-slate-400">
              {t('events.deleteConfirmation') ||
                'Are you sure you want to delete this event? This action cannot be undone.'}
            </p>

            <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
              <p className="font-medium text-slate-900 dark:text-white">
                {event.title}
              </p>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {new Date(event.start_datetime).toLocaleDateString(undefined, {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {event.rsvp_enabled && (
              <div className="mt-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-400">
                  <AlertTriangle size={14} className="inline me-1" />
                  {t('events.deleteWarningRSVPs') ||
                    'Warning: This event has RSVP enabled. All RSVPs will also be deleted.'}
                </p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg disabled:opacity-50"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg disabled:opacity-50"
            >
              {isDeleting
                ? t('common.deleting') || 'Deleting...'
                : t('common.delete') || 'Delete'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
