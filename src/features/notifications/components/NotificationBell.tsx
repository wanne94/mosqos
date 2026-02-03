import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/app/providers/AuthProvider';
import {
  useUnreadNotifications,
  useUnreadCount,
  useMarkAsRead,
  useMarkAllAsRead,
  useDeleteNotification,
} from '../hooks';
import NotificationList from './NotificationList';
import type { Notification } from '../types';

interface NotificationBellProps {
  personId: string;
}

export default function NotificationBell({ personId }: NotificationBellProps) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [markingReadId, setMarkingReadId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Queries
  const { data: notifications = [], isLoading } = useUnreadNotifications(personId, 20);
  const { data: unreadCount = 0 } = useUnreadCount(user?.id || '');

  // Mutations
  const markAsRead = useMarkAsRead();
  const markAllAsRead = useMarkAllAsRead();
  const deleteNotification = useDeleteNotification();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (notificationId: string) => {
    setMarkingReadId(notificationId);
    try {
      await markAsRead.mutateAsync(notificationId);
    } catch {
      toast.error(t('notifications.markReadError') || 'Failed to mark as read');
    } finally {
      setMarkingReadId(null);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user?.id) return;

    try {
      await markAllAsRead.mutateAsync(user.id);
      toast.success(t('notifications.allMarkedRead') || 'All notifications marked as read');
    } catch {
      toast.error(t('notifications.markAllReadError') || 'Failed to mark all as read');
    }
  };

  const handleDelete = async (notificationId: string) => {
    setDeletingId(notificationId);
    try {
      await deleteNotification.mutateAsync(notificationId);
    } catch {
      toast.error(t('notifications.deleteError') || 'Failed to delete notification');
    } finally {
      setDeletingId(null);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      handleMarkAsRead(notification.id);
    }

    // Navigate if action URL exists
    if (notification.action_url) {
      window.location.href = notification.action_url;
    }

    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        aria-label={t('notifications.title') || 'Notifications'}
      >
        <Bell size={20} className="text-slate-600 dark:text-slate-400" />

        {/* Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 end-0 w-5 h-5 bg-red-500 text-white text-xs font-medium rounded-full flex items-center justify-center transform translate-x-1 -translate-y-1">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-80 sm:w-96 bg-white dark:bg-slate-800 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 z-50 overflow-hidden">
          <NotificationList
            notifications={notifications}
            isLoading={isLoading}
            onMarkAsRead={handleMarkAsRead}
            onMarkAllAsRead={handleMarkAllAsRead}
            onDelete={handleDelete}
            onClick={handleNotificationClick}
            markingReadId={markingReadId || undefined}
            deletingId={deletingId || undefined}
            isMarkingAllRead={markAllAsRead.isPending}
            showHeader={true}
            emptyMessage={t('notifications.noNew') || 'No new notifications'}
          />

          {/* View All Link */}
          {notifications.length > 0 && (
            <div className="p-2 border-t border-slate-200 dark:border-slate-700">
              <button
                onClick={() => {
                  setIsOpen(false);
                  // Navigate to notifications page
                  // window.location.href = '/notifications';
                }}
                className="w-full text-center text-sm text-blue-600 dark:text-blue-400 hover:underline py-2"
              >
                {t('notifications.viewAll') || 'View all notifications'}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
