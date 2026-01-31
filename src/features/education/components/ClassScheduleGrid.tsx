import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react'
import { useOrganization } from '../../../hooks/useOrganization'

interface ClassScheduleGridProps {
  classroomId: string | number
  weekStartDate?: Date
}

interface ScheduledClassData {
  id: number
  name: string
  class_time: string | null
  class_date: string | null
  teacher_id: number | null
  teacher_ids: number[] | null
  teachers?: {
    id: number
    first_name: string
    last_name: string
  } | null
  multipleTeachers?: Array<{
    id: number
    first_name: string
    last_name: string
  }>
}

interface Member {
  id: number
  first_name: string
  last_name: string
}

interface TimeSlot {
  period: number
  time: string
  hour: number
}

export default function ClassScheduleGrid({ classroomId, weekStartDate }: ClassScheduleGridProps) {
  const { t, i18n } = useTranslation(['classroom', 'common'])
  const navigate = useNavigate()
  const { currentOrganizationId } = useOrganization()
  const currentLanguage = i18n.language || 'en'

  const [classes, setClasses] = useState<ScheduledClassData[]>([])
  const [loading, setLoading] = useState(true)
  const [members, setMembers] = useState<Member[]>([])
  const [currentWeek, setCurrentWeek] = useState<Date>(
    weekStartDate ? new Date(weekStartDate) : getMondayOfCurrentWeek()
  )

  // Get Monday of current week
  function getMondayOfCurrentWeek(): Date {
    const today = new Date()
    const day = today.getDay()
    const diff = today.getDate() - day + (day === 0 ? -6 : 1)
    return new Date(today.setDate(diff))
  }

  useEffect(() => {
    if (classroomId) {
      fetchClasses()
      fetchMembers()
    }
  }, [classroomId, currentWeek])

  const fetchClasses = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select(`
          *,
          teachers:teacher_id (
            id,
            first_name,
            last_name
          )
        `)
        .eq('classroom_id', classroomId)
        .order('class_time', { ascending: true })

      if (error) throw error

      // Fetch teacher details for classes with multiple teachers
      const classesWithTeachers = await Promise.all(
        (data || []).map(async (classItem) => {
          if (classItem.teacher_ids && Array.isArray(classItem.teacher_ids) && classItem.teacher_ids.length > 0) {
            const { data: teachersData, error: teachersError } = await supabase
              .from('teachers')
              .select('id, first_name, last_name')
              .eq('organization_id', currentOrganizationId)
              .in('id', classItem.teacher_ids)

            if (!teachersError && teachersData) {
              return {
                ...classItem,
                multipleTeachers: teachersData
              }
            }
          }
          return classItem
        })
      )

      setClasses(classesWithTeachers)
    } catch (error) {
      console.error('Error fetching classes:', error)
      setClasses([])
    } finally {
      setLoading(false)
    }
  }

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('organization_id', currentOrganizationId)
        .order('first_name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    }
  }

  const handleClassCreated = () => {
    fetchClasses()
  }

  // Generate week days (Monday to Friday only)
  const getWeekDays = (): Date[] => {
    const days: Date[] = []
    const monday = new Date(currentWeek)

    for (let i = 0; i < 5; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      days.push(date)
    }
    return days
  }

  // Generate time slots (periods)
  const getTimeSlots = (): TimeSlot[] => {
    const slots: TimeSlot[] = []
    for (let period = 1; period <= 8; period++) {
      slots.push({
        period,
        time: `${(period + 7).toString().padStart(2, '0')}:00`,
        hour: period + 7
      })
    }
    return slots
  }

  // Get classes for a specific day and time
  const getClassesForSlot = (day: Date, timeSlot: TimeSlot): ScheduledClassData[] => {
    const dayKey = day.toISOString().split('T')[0]

    return classes.filter(classItem => {
      if (classItem.class_time) {
        const classTime = classItem.class_time.substring(0, 5)
        if (classTime !== timeSlot.time.substring(0, 5)) {
          return false
        }
      }

      if (classItem.class_date) {
        const classDate = new Date(classItem.class_date).toISOString().split('T')[0]
        return classDate === dayKey
      }

      return false
    })
  }

  // Get color for class
  const getClassColor = (classItem: ScheduledClassData, index: number): string => {
    const colors = [
      'bg-blue-100 dark:bg-blue-900/50 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-100 hover:bg-blue-200 dark:hover:bg-blue-900/70',
      'bg-emerald-100 dark:bg-emerald-900/50 border-emerald-300 dark:border-emerald-700 text-emerald-900 dark:text-emerald-100 hover:bg-emerald-200 dark:hover:bg-emerald-900/70',
      'bg-purple-100 dark:bg-purple-900/50 border-purple-300 dark:border-purple-700 text-purple-900 dark:text-purple-100 hover:bg-purple-200 dark:hover:bg-purple-900/70',
      'bg-yellow-100 dark:bg-yellow-900/50 border-yellow-300 dark:border-yellow-700 text-yellow-900 dark:text-yellow-100 hover:bg-yellow-200 dark:hover:bg-yellow-900/70',
      'bg-pink-100 dark:bg-pink-900/50 border-pink-300 dark:border-pink-700 text-pink-900 dark:text-pink-100 hover:bg-pink-200 dark:hover:bg-pink-900/70',
      'bg-indigo-100 dark:bg-indigo-900/50 border-indigo-300 dark:border-indigo-700 text-indigo-900 dark:text-indigo-100 hover:bg-indigo-200 dark:hover:bg-indigo-900/70',
      'bg-orange-100 dark:bg-orange-900/50 border-orange-300 dark:border-orange-700 text-orange-900 dark:text-orange-100 hover:bg-orange-200 dark:hover:bg-orange-900/70',
    ]
    return colors[index % colors.length]
  }

  const formatTime = (timeString: string): string => {
    if (!timeString) return ''
    const [hours, minutes] = timeString.split(':')
    const date = new Date()
    date.setHours(parseInt(hours), parseInt(minutes))
    return date.toLocaleTimeString(currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: false
    })
  }

  const navigateWeek = (direction: number) => {
    const newWeek = new Date(currentWeek)
    newWeek.setDate(newWeek.getDate() + (direction * 7))
    setCurrentWeek(newWeek)
  }

  const handleCellClick = (classItem: ScheduledClassData) => {
    if (classItem) {
      navigate(`/admin/education/classrooms/${classroomId}/classes/${classItem.id}`)
    }
  }

  const weekDays = getWeekDays()
  const timeSlots = getTimeSlots()

  if (loading) {
    return (
      <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
        <div className="text-slate-600 dark:text-slate-400">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Week Navigation Header */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateWeek(-1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-900 dark:text-slate-100"
          >
            <ChevronLeft size={20} />
            {t('previousWeek') || 'Previous Week'}
          </button>

          <div className="flex items-center gap-4">
            <Calendar className="text-slate-600 dark:text-slate-400" size={20} />
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              {weekDays[0].toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
                month: 'long',
                day: 'numeric'
              })} - {weekDays[4].toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
            </h3>
          </div>

          <button
            onClick={() => navigateWeek(1)}
            className="flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg transition-colors text-slate-900 dark:text-slate-100"
          >
            {t('nextWeek') || 'Next Week'}
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {/* Schedule Grid */}
      <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse table-fixed">
            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b-2 border-slate-300 dark:border-slate-700">
              <tr>
                <th className="px-2 py-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase border-r border-slate-300 dark:border-slate-700 w-16">
                  Time / Day
                </th>
                {weekDays.map((day, index) => (
                  <th
                    key={index}
                    className="px-4 py-3 text-center text-xs font-bold text-slate-700 dark:text-slate-300 uppercase border-r border-slate-300 dark:border-slate-700 last:border-r-0"
                  >
                    <div className="font-semibold">
                      {day.toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
                        weekday: 'long'
                      })}
                    </div>
                    <div className="text-xs font-normal text-slate-500 dark:text-slate-400 mt-1">
                      {day.toLocaleDateString(currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
                        month: 'short',
                        day: 'numeric'
                      })}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {timeSlots.map((slot) => (
                <tr key={slot.hour} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50">
                  {/* Time Column */}
                  <td className="px-2 py-3 text-center text-sm font-semibold text-slate-900 dark:text-slate-100 border-r border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 align-top w-16">
                    {slot.period}
                  </td>

                  {/* Day Columns */}
                  {weekDays.map((day, dayIndex) => {
                    const classesAtSlot = getClassesForSlot(day, slot)

                    return (
                      <td
                        key={dayIndex}
                        className="px-2 py-2 align-top border-r border-slate-200 dark:border-slate-700 last:border-r-0 min-h-[80px]"
                      >
                        {classesAtSlot.length > 0 ? (
                          <div className="space-y-1">
                            {classesAtSlot.map((classItem, idx) => {
                              const allTeachers = classItem.multipleTeachers || (classItem.teachers ? [classItem.teachers] : [])
                              const teacherNames = allTeachers.length > 0
                                ? allTeachers.map(t => `${t.first_name.charAt(0)}.${t.last_name}`).join(', ')
                                : 'No teacher'

                              return (
                                <div
                                  key={classItem.id}
                                  onClick={() => handleCellClick(classItem)}
                                  className={`p-2 rounded border-2 cursor-pointer hover:shadow-md transition-all ${getClassColor(classItem, idx)}`}
                                  title={`${classItem.name} - ${allTeachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')} (Click to edit)`}
                                >
                                  <div className="font-semibold text-xs mb-1 truncate">
                                    {classItem.name}
                                  </div>
                                  {teacherNames !== 'No teacher' && (
                                    <div className="text-xs opacity-90 truncate">
                                      {teacherNames}
                                    </div>
                                  )}
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <div className="h-full min-h-[60px] flex items-center justify-center">
                            {/* Empty cell */}
                          </div>
                        )}
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{t('legend') || 'Legend'}:</span>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 dark:bg-blue-900/50 border border-blue-300 dark:border-blue-700 rounded"></div>
            <span className="text-xs text-slate-600 dark:text-slate-400">{t('clickToViewDetails') || 'Click to view details'}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
