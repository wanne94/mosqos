import { useTranslation } from 'react-i18next';
import { Bell, Mail, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { useNotificationPreferences, useUpdatePreference } from '../hooks';
import {
  NOTIFICATION_TYPES,
  NOTIFICATION_TYPE_LABELS,
  type NotificationType,
  type NotificationPreference,
} from '../types';
import LoadingSpinner from '@/shared/components/LoadingSpinner';

interface NotificationSettingsProps {
  personId: string;
}

export default function NotificationSettings({ personId }: NotificationSettingsProps) {
  const { t } = useTranslation();

  const { data: preferences = [], isLoading } = useNotificationPreferences(personId);
  const updatePreference = useUpdatePreference();

  // Create a map for easy lookup
  const preferencesMap = preferences.reduce(
    (acc, pref) => {
      acc[pref.notification_type] = pref;
      return acc;
    },
    {} as Record<NotificationType, NotificationPreference>
  );

  const handleToggle = async (
    notificationType: NotificationType,
    channel: 'email_enabled' | 'push_enabled' | 'in_app_enabled',
    currentValue: boolean
  ) => {
    try {
      await updatePreference.mutateAsync({
        personId,
        notificationType,
        input: { [channel]: !currentValue },
      });
    } catch {
      toast.error(t('notifications.updateError') || 'Failed to update preference');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <LoadingSpinner />
      </div>
    );
  }

  // Group notification types by category
  const categories = {
    events: ['event_reminder', 'event_rsvp'] as NotificationType[],
    financial: ['donation_received', 'payment_received', 'payment_due'] as NotificationType[],
    cases: ['case_assigned', 'case_updated'] as NotificationType[],
    education: ['class_reminder', 'class_cancelled'] as NotificationType[],
    general: ['announcement', 'membership_expiring', 'general', 'system'] as NotificationType[],
  };

  const categoryLabels: Record<string, string> = {
    events: t('notifications.categories.events') || 'Events',
    financial: t('notifications.categories.financial') || 'Financial',
    cases: t('notifications.categories.cases') || 'Cases',
    education: t('notifications.categories.education') || 'Education',
    general: t('notifications.categories.general') || 'General',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          {t('notifications.settings') || 'Notification Settings'}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
          {t('notifications.settingsDescription') ||
            'Choose how you want to be notified about different activities'}
        </p>
      </div>

      {/* Channel Legend */}
      <div className="flex items-center gap-6 text-sm text-slate-600 dark:text-slate-400">
        <div className="flex items-center gap-2">
          <Bell size={16} />
          {t('notifications.channels.inApp') || 'In-App'}
        </div>
        <div className="flex items-center gap-2">
          <Mail size={16} />
          {t('notifications.channels.email') || 'Email'}
        </div>
        <div className="flex items-center gap-2">
          <Smartphone size={16} />
          {t('notifications.channels.push') || 'Push'}
        </div>
      </div>

      {/* Settings by Category */}
      {Object.entries(categories).map(([category, types]) => (
        <div key={category} className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 pb-2">
            {categoryLabels[category]}
          </h4>

          <div className="space-y-2">
            {types.map((notificationType) => {
              const pref = preferencesMap[notificationType];
              const inAppEnabled = pref?.in_app_enabled ?? true;
              const emailEnabled = pref?.email_enabled ?? true;
              const pushEnabled = pref?.push_enabled ?? true;

              return (
                <div
                  key={notificationType}
                  className="flex items-center justify-between py-2"
                >
                  <span className="text-sm text-slate-900 dark:text-white">
                    {t(`notifications.types.${notificationType}`) ||
                      NOTIFICATION_TYPE_LABELS[notificationType]}
                  </span>

                  <div className="flex items-center gap-4">
                    {/* In-App Toggle */}
                    <button
                      onClick={() =>
                        handleToggle(notificationType, 'in_app_enabled', inAppEnabled)
                      }
                      disabled={updatePreference.isPending}
                      className={`p-1.5 rounded-lg transition-colors ${
                        inAppEnabled
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                      }`}
                      title={t('notifications.channels.inApp') || 'In-App'}
                    >
                      <Bell size={16} />
                    </button>

                    {/* Email Toggle */}
                    <button
                      onClick={() =>
                        handleToggle(notificationType, 'email_enabled', emailEnabled)
                      }
                      disabled={updatePreference.isPending}
                      className={`p-1.5 rounded-lg transition-colors ${
                        emailEnabled
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                      }`}
                      title={t('notifications.channels.email') || 'Email'}
                    >
                      <Mail size={16} />
                    </button>

                    {/* Push Toggle */}
                    <button
                      onClick={() =>
                        handleToggle(notificationType, 'push_enabled', pushEnabled)
                      }
                      disabled={updatePreference.isPending}
                      className={`p-1.5 rounded-lg transition-colors ${
                        pushEnabled
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400'
                          : 'bg-slate-100 text-slate-400 dark:bg-slate-700 dark:text-slate-500'
                      }`}
                      title={t('notifications.channels.push') || 'Push'}
                    >
                      <Smartphone size={16} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {/* Note */}
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {t('notifications.note') ||
          'Note: Some critical notifications cannot be disabled for security reasons.'}
      </p>
    </div>
  );
}
