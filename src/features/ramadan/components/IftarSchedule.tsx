/**
 * Iftar Schedule Component
 * Shows upcoming Iftar events
 */

import { Clock, MapPin, Users, Calendar } from 'lucide-react'
import type { IftarEvent } from '../types'

interface IftarScheduleProps {
  events: IftarEvent[]
  isLoading?: boolean
}

export function IftarSchedule({ events, isLoading }: IftarScheduleProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatTime = (timeString: string) => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm animate-pulse">
        <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded w-1/3 mb-4" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-700 rounded" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
          <Calendar size={20} className="text-amber-600 dark:text-amber-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Upcoming Iftars
        </h3>
      </div>

      {events.length === 0 ? (
        <div className="text-center py-8">
          <Calendar size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-3" />
          <p className="text-slate-500 dark:text-slate-400">No upcoming Iftar events</p>
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event) => (
            <div
              key={event.id}
              className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg border border-amber-200/50 dark:border-amber-800/50"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-1">
                    {event.title}
                  </h4>
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Calendar size={14} />
                      {formatDate(event.date)}
                    </span>
                    {event.time && (
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatTime(event.time)}
                      </span>
                    )}
                    {event.location && (
                      <span className="flex items-center gap-1">
                        <MapPin size={14} />
                        {event.location}
                      </span>
                    )}
                  </div>
                </div>
                {event.capacity && (
                  <div className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
                    <Users size={14} />
                    <span>
                      {event.rsvp_count}/{event.capacity}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
