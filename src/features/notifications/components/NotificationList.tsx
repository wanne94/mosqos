import { useTranslation } from 'react-i18next';
import { Bell, CheckCheck, Trash2 } from 'lucide-react';
import type { Notification } from '../types';
import NotificationItem from './NotificationItem';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

interface NotificationListProps {
  notifications: Notification[];
  isLoading?: boolean;
  onMarkAsRead?: (id: string) => void;
  onMarkAllAsRead?: () => void;
  onDelete?: (id: string) => void;
  onDeleteAll?: () => void;
  onClick?: (notification: Notification) => void;
  markingReadId?: string;
  deletingId?: string;
  isMarkingAllRead?: boolean;
  isDeletingAll?: boolean;
  showHeader?: boolean;
  emptyMessage?: string;
}

export default function NotificationList({
  notifications,
  isLoading,
  onMarkAsRead,
  onMarkAllAsRead,
  onDelete,
  onDeleteAll,
  onClick,
  markingReadId,
  deletingId,
  isMarkingAllRead,
  isDeletingAll,
  showHeader = true,
  emptyMessage,
}: NotificationListProps) {
  const { t } = useTranslation();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {showHeader && (
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {t('notifications.title') || 'Notifications'}
            </h3>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1">
            {unreadCount > 0 && onMarkAllAsRead && (
              <button
                onClick={onMarkAllAsRead}
                disabled={isMarkingAllRead}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded disabled:opacity-50"
                title={t('notifications.markAllRead') || 'Mark all as read'}
              >
                <CheckCheck size={14} />
                <span className="hidden sm:inline">
                  {t('notifications.markAllRead') || 'Mark all read'}
                </span>
              </button>
            )}
            {notifications.length > 0 && onDeleteAll && (
              <button
                onClick={onDeleteAll}
                disabled={isDeletingAll}
                className="flex items-center gap-1.5 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                title={t('notifications.deleteAll') || 'Delete all'}
              >
                <Trash2 size={14} />
                <span className="hidden sm:inline">
                  {t('notifications.deleteAll') || 'Clear all'}
                </span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Content */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center mb-3">
            <Bell size={24} className="text-slate-400 dark:text-slate-500" />
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
            {emptyMessage || t('notifications.empty') || 'No notifications'}
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto">
          <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onMarkAsRead={onMarkAsRead}
                onDelete={onDelete}
                onClick={onClick}
                isMarkingRead={markingReadId === notification.id}
                isDeleting={deletingId === notification.id}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
