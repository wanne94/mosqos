import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'

interface Member {
  id: string
  first_name: string
  last_name: string
  teacher_color?: string
}

interface Course {
  id: string
  name: string
  description?: string | null
}

interface TimeSlot {
  time: string
}

interface AddClassFromScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classroomId: string
  day: Date | null
  timeSlot: TimeSlot | null
  period: number
}

interface ClassFormData {
  name: string
  teacher_ids: string[]
  class_time: string
  description: string
  repeatUntil: string
}

export default function AddClassFromScheduleModal({
  isOpen,
  onClose,
  onSave,
  classroomId,
  day,
  timeSlot,
  period
}: AddClassFromScheduleModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const [members, setMembers] = useState<Member[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false)

  const initialFormData: ClassFormData = {
    name: '',
    teacher_ids: [],
    class_time: timeSlot?.time || '',
    description: '',
    repeatUntil: '',
  }

  const [formData, setFormData] = useState<ClassFormData>(initialFormData)

  // Track if form has unsaved changes
  const isDirty = useFormDirty(formData, initialFormData)

  // Block body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isOpen])

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select(`
          id,
          teacher_color,
          organization_members:member_id (
            id,
            first_name,
            last_name,
            role
          )
        `)
        .order('members(first_name)', { ascending: true })

      if (error) throw error

      // Transform data to flat structure
      const teachers = (data || []).map((teacher: any) => ({
        id: teacher.organization_members?.id,
        first_name: teacher.organization_members?.first_name || '',
        last_name: teacher.organization_members?.last_name || '',
        teacher_color: teacher.teacher_color
      })).filter((t: Member) => t.id && t.first_name && t.last_name)

      setMembers(teachers)
    } catch (error) {
      console.error('Error fetching teachers:', error)
      setMembers([])
    }
  }, [])

  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      setCourses(data || [])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    }
  }, [])

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
      fetchCourses()
    }
  }, [isOpen, fetchMembers, fetchCourses])

  useEffect(() => {
    if (isOpen && timeSlot) {
      setFormData(prev => ({
        ...prev,
        class_time: timeSlot.time || ''
      }))
    }
  }, [isOpen, timeSlot])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (teacherDropdownOpen && !(event.target as Element).closest('.teacher-dropdown-container')) {
        setTeacherDropdownOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [teacherDropdownOpen])

  // ESC key handler for dropdown
  useEscapeKey(
    () => setTeacherDropdownOpen(false),
    false,
    '',
    isOpen && teacherDropdownOpen
  )

  // ESC key handler for modal
  useEscapeKey(
    onClose,
    isDirty,
    t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?',
    isOpen && !teacherDropdownOpen
  )

  // Handle close with confirmation if form is dirty
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm(t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose, t])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }, [])

  const getDayName = useCallback(() => {
    if (!day) return ''
    return day.toLocaleDateString('en-US', { weekday: 'long' })
  }, [day])

  const handleTeacherToggle = useCallback((teacherId: string) => {
    setFormData((prev) => {
      const teacherIds = prev.teacher_ids || []
      if (teacherIds.includes(teacherId)) {
        return {
          ...prev,
          teacher_ids: teacherIds.filter(id => id !== teacherId)
        }
      } else {
        return {
          ...prev,
          teacher_ids: [...teacherIds, teacherId]
        }
      }
    })
  }, [])

  const getSelectedTeacherNames = useCallback(() => {
    if (!formData.teacher_ids || formData.teacher_ids.length === 0) {
      return t('selectTeachers') || 'Select teachers...'
    }
    const selectedTeachers = members.filter(m => formData.teacher_ids.includes(m.id))
    return selectedTeachers.map(t => `${t.first_name} ${t.last_name}`).join(', ')
  }, [formData.teacher_ids, members, t])

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert('Class name is required')
      return
    }

    setLoading(true)

    try {
      const teacherIds = formData.teacher_ids.length > 0 ? formData.teacher_ids : []
      const dayOfWeek = day ? day.getDay() : null
      const adjustedDayOfWeek = dayOfWeek === 0 ? 7 : dayOfWeek

      let classesToInsert = []

      if (formData.repeatUntil && day) {
        const endDate = new Date(formData.repeatUntil)
        const currentDate = new Date(day)

        while (currentDate <= endDate) {
          const currentDayOfWeek = currentDate.getDay()
          const adjustedCurrentDayOfWeek = currentDayOfWeek === 0 ? 7 : currentDayOfWeek

          if (adjustedCurrentDayOfWeek === adjustedDayOfWeek) {
            classesToInsert.push({
              name: formData.name,
              teacher_id: teacherIds.length > 0 ? teacherIds[0] : null,
              teacher_ids: teacherIds,
              classroom_id: classroomId,
              class_time: formData.class_time,
              class_date: currentDate.toISOString().split('T')[0],
              schedule: null,
              tuition_fee: 0,
              description: formData.description || null,
            })
          }

          currentDate.setDate(currentDate.getDate() + 1)
        }
      } else {
        const classDate = day ? day.toISOString().split('T')[0] : null
        classesToInsert.push({
          name: formData.name,
          teacher_id: teacherIds.length > 0 ? teacherIds[0] : null,
          teacher_ids: teacherIds,
          classroom_id: classroomId,
          class_time: formData.class_time,
          class_date: classDate,
          schedule: null,
          tuition_fee: 0,
          description: formData.description || null,
        })
      }

      if (classesToInsert.length > 0) {
        const selectedCourse = courses.find(c => c.name === formData.name)
        const courseId = selectedCourse?.id || null

        const scheduledClassesToInsert = classesToInsert.map(cls => ({
          course_id: courseId,
          name: cls.name,
          classroom_id: cls.classroom_id,
          teacher_id: cls.teacher_id,
          teacher_ids: cls.teacher_ids,
          class_time: cls.class_time,
          class_date: cls.class_date,
          description: cls.description,
        }))

        const { error } = await supabase.from('scheduled_classes').insert(scheduledClassesToInsert)
        if (error) throw error
      }

      setFormData({
        name: '',
        teacher_ids: [],
        class_time: timeSlot?.time || '',
        description: '',
        repeatUntil: '',
      })

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error creating class:', error)
      alert(`Failed to create class: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }, [formData, day, courses, classroomId, timeSlot, onSave, onClose])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 dark:bg-opacity-70">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('addClass') || 'Add Class'}
          </h2>
          <button
            onClick={handleClose}
            type="button"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg border border-slate-200 dark:border-slate-600">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">{t('scheduleDetails') || 'Schedule Details'}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('period') || 'Period'}</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">#{period}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('day') || 'Day'}</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{getDayName()}</p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('date', { ns: 'common' }) || 'Date'}</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {day ? day.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : ''}
                </p>
              </div>
              <div className="space-y-1">
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">{t('time', { ns: 'common' }) || 'Time'}</span>
                <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{formData.class_time}</p>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('className', { ns: 'common' }) || 'Class Name'} <span className="text-red-500">*</span>
            </label>
            <select
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            >
              <option value="">{t('selectCourse') || 'Select a course...'}</option>
              {courses.map((course, idx) => (
                <option key={course.id || `course-${idx}`} value={course.name}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          <div className="relative teacher-dropdown-container">
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('teachers') || 'Teachers'}
            </label>
            <button
              type="button"
              onClick={() => setTeacherDropdownOpen(!teacherDropdownOpen)}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-left flex items-center justify-between"
            >
              <span className={formData.teacher_ids.length === 0 ? 'text-slate-400' : 'text-slate-900 dark:text-slate-100'}>
                {getSelectedTeacherNames()}
              </span>
              <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {teacherDropdownOpen && (
              <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                {members.length === 0 ? (
                  <div className="px-3 py-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                    {t('noTeachersAssigned') || 'No teachers assigned.'}
                  </div>
                ) : (
                  <div className="py-1">
                    {members.map((member) => {
                      const isSelected = formData.teacher_ids?.includes(member.id) || false
                      return (
                        <label
                          key={member.id}
                          className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${
                            isSelected ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleTeacherToggle(member.id)}
                            className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                          />
                          <div
                            className="w-3 h-3 rounded-full border border-slate-300 flex-shrink-0"
                            style={{ backgroundColor: member.teacher_color || '#3B82F6' }}
                          />
                          <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                            {member.first_name} {member.last_name}
                          </span>
                        </label>
                      )
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('repeatUntil') || 'Repeat Until (Optional)'}
            </label>
            <input
              type="date"
              name="repeatUntil"
              value={formData.repeatUntil}
              onChange={handleChange}
              min={day ? day.toISOString().split('T')[0] : undefined}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              {t('description', { ns: 'common' }) || 'Description'}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              placeholder={t('descriptionPlaceholder') || 'Optional description...'}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleClose}
              className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
            >
              {t('cancel', { ns: 'common' }) || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (t('saving', { ns: 'common' }) || 'Saving...') : (t('save', { ns: 'common' }) || 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
