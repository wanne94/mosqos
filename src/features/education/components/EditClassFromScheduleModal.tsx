import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface TeacherMember {
  id: string
  first_name: string
  last_name: string
  teacher_color?: string | null
}

interface Course {
  id: string
  name: string
  description?: string | null
}

interface TimeSlot {
  time: string
}

interface ClassItem {
  id: string
  name: string
  start_time: string
  description?: string | null
  teacher_id?: string | null
}

interface EditClassFromScheduleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classItem: ClassItem | null
  day: Date | null
  timeSlot: TimeSlot | null
  period: number
}

interface ClassFormData {
  name: string
  teacher_ids: string[]
  class_time: string
  description: string
}

export default function EditClassFromScheduleModal({
  isOpen,
  onClose,
  onSave,
  classItem,
  day,
  timeSlot,
  period
}: EditClassFromScheduleModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const { currentOrganizationId } = useOrganization()
  const [members, setMembers] = useState<TeacherMember[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(false)
  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false)

  const initialFormData: ClassFormData = {
    name: '',
    teacher_ids: [],
    class_time: timeSlot?.time || '',
    description: '',
  }

  const [formData, setFormData] = useState<ClassFormData>(initialFormData)

  // Track if form has unsaved changes
  const isDirty = useFormDirty(formData, initialFormData)

  const fetchMembers = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .eq('organization_id', currentOrganizationId)
        .eq('is_active', true)
        .order('first_name', { ascending: true })

      if (error) throw error

      setMembers((data || []) as TeacherMember[])
    } catch (error) {
      console.error('Error fetching teachers:', error)
      setMembers([])
    }
  }, [currentOrganizationId])

  const fetchCourses = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, description')
        .eq('organization_id', currentOrganizationId)
        .order('name', { ascending: true })

      if (error) throw error

      setCourses((data || []) as Course[])
    } catch (error) {
      console.error('Error fetching courses:', error)
      setCourses([])
    }
  }, [currentOrganizationId])

  useEffect(() => {
    if (isOpen && classItem) {
      fetchMembers()
      fetchCourses()
      // Load existing class data
      const teacherIds = classItem.teacher_id ? [classItem.teacher_id] : []

      setFormData({
        name: classItem.name || '',
        teacher_ids: teacherIds,
        class_time: classItem.start_time || timeSlot?.time || '',
        description: classItem.description || '',
      })
    }
  }, [isOpen, classItem, timeSlot, fetchMembers, fetchCourses])

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

  const getDayName = useCallback(() => {
    if (!day) return ''
    return day.toLocaleDateString('en-US', { weekday: 'long' })
  }, [day])

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
      // Get the specific date for this class (one-time class, not recurring)
      const classDate = day ? day.toISOString().split('T')[0] : null

      // Find course_id for the selected course name
      const selectedCourse = courses.find(c => c.name === formData.name)
      const courseId = selectedCourse?.id || null

      // Update class
      const classData: Record<string, unknown> = {
        course_id: courseId,
        name: formData.name,
        teacher_id: formData.teacher_ids.length > 0 ? formData.teacher_ids[0] : null,
        start_time: formData.class_time,
        start_date: classDate,
        description: formData.description || null,
      }

      const { error } = await supabase
        .from('scheduled_classes')
        .update(classData)
        .eq('id', classItem!.id)

      if (error) throw error

      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating class:', error)
      alert(`Failed to update class: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [formData, day, courses, classItem, onSave, onClose])

  const handleDelete = useCallback(async () => {
    if (!confirm('Are you sure you want to delete this class?')) {
      return
    }

    setLoading(true)
    try {
      const { error } = await supabase
        .from('scheduled_classes')
        .delete()
        .eq('id', classItem!.id)

      if (error) throw error

      onSave()
      onClose()
    } catch (error) {
      console.error('Error deleting class:', error)
      alert(`Failed to delete class: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }, [classItem, onSave, onClose])

  if (!isOpen) return null

  if (!classItem) {
    return (
      <div className="fixed inset-0 bg-slate-900 bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl p-6">
          <p className="text-slate-600 dark:text-slate-400">Loading class data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-slate-900 bg-opacity-30 dark:bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto" style={{ padding: '1rem' }}>
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl my-8 flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('editClass') || 'Edit Class'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1" style={{ overscrollBehavior: 'contain' }}>
          {/* Schedule Info */}
          <div className="bg-slate-50 dark:bg-slate-700 p-4 rounded-lg">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Period:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">#{period}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Day:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{getDayName()}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Date:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">
                  {day ? day.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  }) : ''}
                </span>
              </div>
              <div>
                <span className="font-medium text-slate-700 dark:text-slate-300">Time:</span>
                <span className="ml-2 text-slate-900 dark:text-slate-100">{formData.class_time}</span>
              </div>
            </div>
          </div>

          {/* Class Name - Select from Courses */}
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
              {courses.map((course) => (
                <option key={course.id} value={course.name}>
                  {course.name}
                </option>
              ))}
            </select>
            {courses.length === 0 && (
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                {t('noCoursesAvailable') || 'No courses available. Please add courses from the Courses tab first.'}
              </p>
            )}
          </div>

          {/* Multiple Teachers Selection */}
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

          {/* Description */}
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

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={handleDelete}
              disabled={loading}
              className="px-4 py-2 text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('delete', { ns: 'common' }) || 'Delete'}
            </button>
            <div className="flex items-center gap-3">
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
          </div>
        </form>
      </div>
    </div>
  )
}
