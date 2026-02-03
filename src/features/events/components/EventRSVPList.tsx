import { useTranslation } from 'react-i18next';
import { CheckCircle, Circle, XCircle, Clock, User, Users, Check, X } from 'lucide-react';
import type { EventRSVPWithPerson, RSVPStatus } from '../types';
import { RSVP_STATUS_COLORS, RSVP_STATUS_LABELS } from '../types';

interface EventRSVPListProps {
  rsvps: EventRSVPWithPerson[];
  onCheckIn?: (rsvpId: string) => void;
  onUndoCheckIn?: (rsvpId: string) => void;
  isCheckingIn?: string;
  showCheckIn?: boolean;
}

const statusIcons: Record<RSVPStatus, React.ReactNode> = {
  attending: <CheckCircle size={14} className="text-green-500" />,
  maybe: <Clock size={14} className="text-yellow-500" />,
  declined: <XCircle size={14} className="text-red-500" />,
};

export default function EventRSVPList({
  rsvps,
  onCheckIn,
  onUndoCheckIn,
  isCheckingIn,
  showCheckIn = true,
}: EventRSVPListProps) {
  const { t, i18n } = useTranslation();

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(i18n.language, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Group RSVPs by status
  const groupedRSVPs = rsvps.reduce(
    (acc, rsvp) => {
      if (!acc[rsvp.status]) {
        acc[rsvp.status] = [];
      }
      acc[rsvp.status].push(rsvp);
      return acc;
    },
    {} as Record<RSVPStatus, EventRSVPWithPerson[]>
  );

  const statusOrder: RSVPStatus[] = ['attending', 'maybe', 'declined'];

  // Statistics
  const stats = {
    total: rsvps.length,
    attending: groupedRSVPs.attending?.length || 0,
    maybe: groupedRSVPs.maybe?.length || 0,
    declined: groupedRSVPs.declined?.length || 0,
    checkedIn: rsvps.filter((r) => r.checked_in).length,
    totalGuests: rsvps.reduce((sum, r) => sum + (r.guests_count || 0), 0),
  };

  if (rsvps.length === 0) {
    return (
      <div className="text-center py-8">
        <Users size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
        <p className="text-slate-500 dark:text-slate-400">
          {t('events.noRSVPs') || 'No RSVPs yet'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-700 dark:text-green-400">
            {stats.attending}
          </div>
          <div className="text-sm text-green-600 dark:text-green-500">
            {t('events.rsvp.attending') || 'Attending'}
          </div>
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
            {stats.maybe}
          </div>
          <div className="text-sm text-yellow-600 dark:text-yellow-500">
            {t('events.rsvp.maybe') || 'Maybe'}
          </div>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-red-700 dark:text-red-400">
            {stats.declined}
          </div>
          <div className="text-sm text-red-600 dark:text-red-500">
            {t('events.rsvp.declined') || 'Declined'}
          </div>
        </div>
        {showCheckIn && (
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
            <div className="text-2xl font-bold text-blue-700 dark:text-blue-400">
              {stats.checkedIn}
            </div>
            <div className="text-sm text-blue-600 dark:text-blue-500">
              {t('events.rsvp.checkedIn') || 'Checked In'}
            </div>
          </div>
        )}
      </div>

      {stats.totalGuests > 0 && (
        <div className="text-sm text-slate-600 dark:text-slate-400 text-center">
          +{stats.totalGuests} {t('events.additionalGuests') || 'additional guests'}
        </div>
      )}

      {/* RSVP List by Status */}
      {statusOrder.map((status) => {
        const statusRSVPs = groupedRSVPs[status];
        if (!statusRSVPs || statusRSVPs.length === 0) return null;

        return (
          <div key={status} className="space-y-2">
            <h4 className="flex items-center gap-2 text-sm font-medium text-slate-700 dark:text-slate-300">
              {statusIcons[status]}
              <span
                className={`px-2 py-0.5 rounded-full text-xs ${RSVP_STATUS_COLORS[status]}`}
              >
                {t(`events.rsvp.${status}`) || RSVP_STATUS_LABELS[status]}
              </span>
              <span className="text-slate-400">({statusRSVPs.length})</span>
            </h4>

            <div className="space-y-1">
              {statusRSVPs.map((rsvp) => (
                <div
                  key={rsvp.id}
                  className={`flex items-center justify-between p-3 rounded-lg border ${
                    rsvp.checked_in
                      ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <User size={20} className="text-slate-500 dark:text-slate-400" />
                    </div>

                    {/* Info */}
                    <div>
                      <div className="font-medium text-slate-900 dark:text-white">
                        {rsvp.person.first_name} {rsvp.person.last_name}
                      </div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        {rsvp.person.email || rsvp.person.phone}
                        {rsvp.guests_count > 0 && (
                          <span className="ms-2 text-blue-600 dark:text-blue-400">
                            +{rsvp.guests_count} {t('events.guests') || 'guests'}
                          </span>
                        )}
                      </div>
                      {rsvp.notes && (
                        <div className="text-xs text-slate-400 dark:text-slate-500 mt-1">
                          {t('events.note') || 'Note'}: {rsvp.notes}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Check-in Status & Action */}
                  <div className="flex items-center gap-2">
                    {rsvp.checked_in ? (
                      <>
                        <div className="flex items-center gap-1 text-sm text-green-600 dark:text-green-400">
                          <Check size={14} />
                          {t('events.checkedIn') || 'Checked In'}
                        </div>
                        {showCheckIn && onUndoCheckIn && (
                          <button
                            onClick={() => onUndoCheckIn(rsvp.id)}
                            disabled={isCheckingIn === rsvp.id}
                            className="p-1.5 text-slate-500 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded disabled:opacity-50"
                            title={t('events.undoCheckIn') || 'Undo Check-in'}
                          >
                            <X size={16} />
                          </button>
                        )}
                      </>
                    ) : (
                      <>
                        {rsvp.status === 'attending' && showCheckIn && onCheckIn && (
                          <button
                            onClick={() => onCheckIn(rsvp.id)}
                            disabled={isCheckingIn === rsvp.id}
                            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50"
                          >
                            {isCheckingIn === rsvp.id ? (
                              <Circle size={14} className="animate-spin" />
                            ) : (
                              <Check size={14} />
                            )}
                            {t('events.checkIn') || 'Check In'}
                          </button>
                        )}
                        {rsvp.checked_in_at && (
                          <div className="text-xs text-slate-400">
                            {formatDate(rsvp.checked_in_at)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
