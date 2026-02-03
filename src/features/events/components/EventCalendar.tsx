import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Event, EventWithStats } from '../types';
import { EVENT_TYPE_COLORS } from '../types';

interface EventCalendarProps {
  events: (Event | EventWithStats)[];
  onEventClick?: (event: Event | EventWithStats) => void;
  onDateClick?: (date: Date) => void;
  isLoading?: boolean;
}

export default function EventCalendar({
  events,
  onEventClick,
  onDateClick,
  isLoading,
}: EventCalendarProps) {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());

  const isRTL = i18n.language === 'ar';

  // Get calendar data
  const calendarData = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    // Day of week for first day (0 = Sunday)
    const startDayOfWeek = firstDay.getDay();
    // Total days in month
    const daysInMonth = lastDay.getDate();

    // Create calendar grid
    const days: Array<{
      date: Date;
      isCurrentMonth: boolean;
      isToday: boolean;
      events: (Event | EventWithStats)[];
    }> = [];

    // Add previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }

    // Add current month days
    const today = new Date();
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const isToday =
        date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();

      // Find events for this day
      const dayEvents = events.filter((event) => {
        const eventDate = new Date(event.start_datetime);
        return (
          eventDate.getDate() === day &&
          eventDate.getMonth() === month &&
          eventDate.getFullYear() === year
        );
      });

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        events: dayEvents,
      });
    }

    // Add next month days to complete the grid (6 rows)
    const remainingDays = 42 - days.length;
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(year, month + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        events: [],
      });
    }

    return days;
  }, [currentDate, events]);

  const monthName = currentDate.toLocaleDateString(i18n.language, {
    month: 'long',
    year: 'numeric',
  });

  const weekDays = useMemo(() => {
    const days = [];
    const baseDate = new Date(2024, 0, 7); // A Sunday
    for (let i = 0; i < 7; i++) {
      const date = new Date(baseDate);
      date.setDate(date.getDate() + i);
      days.push(
        date.toLocaleDateString(i18n.language, { weekday: 'short' })
      );
    }
    return days;
  }, [i18n.language]);

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <button
            onClick={isRTL ? goToNextMonth : goToPreviousMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <ChevronLeft size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
          <button
            onClick={isRTL ? goToPreviousMonth : goToNextMonth}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
          >
            <ChevronRight size={20} className="text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
          {monthName}
        </h2>

        <button
          onClick={goToToday}
          className="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg"
        >
          {t('events.today') || 'Today'}
        </button>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Week day headers */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-slate-500 dark:text-slate-400 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Calendar days */}
            <div className="grid grid-cols-7 gap-1">
              {calendarData.map((day, index) => (
                <div
                  key={index}
                  onClick={() => onDateClick?.(day.date)}
                  className={`min-h-[100px] p-1 border rounded-lg cursor-pointer transition-colors ${
                    day.isCurrentMonth
                      ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                      : 'bg-slate-50 dark:bg-slate-900 border-slate-100 dark:border-slate-800'
                  } ${
                    day.isToday
                      ? 'ring-2 ring-blue-500'
                      : ''
                  }`}
                >
                  {/* Day number */}
                  <div
                    className={`text-sm font-medium mb-1 ${
                      day.isCurrentMonth
                        ? day.isToday
                          ? 'text-blue-600 dark:text-blue-400'
                          : 'text-slate-900 dark:text-white'
                        : 'text-slate-400 dark:text-slate-600'
                    }`}
                  >
                    {day.date.getDate()}
                  </div>

                  {/* Events */}
                  <div className="space-y-1">
                    {day.events.slice(0, 3).map((event) => (
                      <div
                        key={event.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onEventClick?.(event);
                        }}
                        className={`text-xs px-1.5 py-0.5 rounded truncate cursor-pointer hover:opacity-80 ${EVENT_TYPE_COLORS[event.event_type]}`}
                        title={event.title}
                      >
                        {event.title}
                      </div>
                    ))}
                    {day.events.length > 3 && (
                      <div className="text-xs text-slate-500 dark:text-slate-400 px-1.5">
                        +{day.events.length - 3} {t('events.more') || 'more'}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
