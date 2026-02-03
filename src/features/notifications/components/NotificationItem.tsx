import { useTranslation } from 'react-i18next';
import {
  Bell,
  Calendar,
  DollarSign,
  FileText,
  GraduationCap,
  Info,
  Settings,
  UserCheck,
  Clock,
  CreditCard,
  AlertCircle,
  XCircle,
  Trash2,
  Check,
} from 'lucide-react';
import type { Notification, NotificationType } from '../types';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
  onClick?: (notification: Notification) => void;
  isMarkingRead?: boolean;
  isDeleting?: boolean;
}

const iconMap: Record<NotificationType, React.ComponentType<{ size?: number; className?: string }>> = {
  donation_received: DollarSign,
  event_reminder: Calendar,
  event_rsvp: UserCheck,
  case_assigned: FileText,
  case_updated: FileText,
  announcement: Bell,
  payment_received: CreditCard,
  payment_due: AlertCircle,
  class_reminder: GraduationCap,
  class_cancelled: XCircle,
  membership_expiring: Clock,
  general: Info,
  system: Settings,
};

const colorMap: Record<NotificationType, string> = {
  donation_received: 'text-green-500 bg-green-50 dark:bg-green-900/30',
  event_reminder: 'text-blue-500 bg-blue-50 dark:bg-blue-900/30',
  event_rsvp: 'text-purple-500 bg-purple-50 dark:bg-purple-900/30',
  case_assigned: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  case_updated: 'text-amber-500 bg-amber-50 dark:bg-amber-900/30',
  announcement: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30',
  payment_received: 'text-green-500 bg-green-50 dark:bg-green-900/30',
  payment_due: 'text-red-500 bg-red-50 dark:bg-red-900/30',
  class_reminder: 'text-cyan-500 bg-cyan-50 dark:bg-cyan-900/30',
  class_cancelled: 'text-red-500 bg-red-50 dark:bg-red-900/30',
  membership_expiring: 'text-orange-500 bg-orange-50 dark:bg-orange-900/30',
  general: 'text-slate-500 bg-slate-50 dark:bg-slate-900/30',
  system: 'text-slate-500 bg-slate-50 dark:bg-slate-900/30',
};

export default function NotificationItem({
  notification,
  onMarkAsRead,
  onDelete,
  onClick,
  isMarkingRead,
  isDeleting,
}: NotificationItemProps) {
  const { i18n } = useTranslation();

  const Icon = iconMap[notification.type] || Info;
  const colorClass = colorMap[notification.type] || colorMap.general;

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString(i18n.language, {
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div
      className={`flex items-start gap-3 p-3 rounded-lg transition-colors cursor-pointer ${
        notification.is_read
          ? 'bg-white dark:bg-slate-800'
          : 'bg-blue-50/50 dark:bg-blue-900/10'
      } hover:bg-slate-50 dark:hover:bg-slate-700/50`}
      onClick={() => onClick?.(notification)}
    >
      {/* Icon */}
      <div className={`p-2 rounded-full flex-shrink-0 ${colorClass}`}>
        <Icon size={18} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2">
          <p
            className={`text-sm ${
              notification.is_read
                ? 'text-slate-700 dark:text-slate-300'
                : 'text-slate-900 dark:text-white font-medium'
            }`}
          >
            {notification.title}
          </p>
          {!notification.is_read && (
            <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />
          )}
        </div>

        {notification.body && (
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">
            {notification.body}
          </p>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          <span className="text-xs text-slate-400 dark:text-slate-500">
            {formatTime(notification.created_at)}
          </span>

          {/* Actions */}
          <div className="flex items-center gap-1">
            {!notification.is_read && onMarkAsRead && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}
                disabled={isMarkingRead}
                className="p-1 text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded disabled:opacity-50"
                title="Mark as read"
              >
                <Check size={14} />
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                disabled={isDeleting}
                className="p-1 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded disabled:opacity-50"
                title="Delete"
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
