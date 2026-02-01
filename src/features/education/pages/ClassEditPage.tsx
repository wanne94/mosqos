import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../../../lib/supabase/client'
import { toast } from 'sonner'
import type { ScheduledClass, Course } from '../types/education.types'

interface FormData {
  name: string
  teacher_ids: string[]
  class_time: string
  description: string
}

interface TeacherDisplay {
  id: string
  first_name: string
  last_name: string
  teacher_color: string | null
}

export default function ClassEditPage() {
  const { classroomId, classId } = useParams<{ classroomId: string; classId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation(['classroom', 'common'])
  const queryClient = useQueryClient()

  const [teacherDropdownOpen, setTeacherDropdownOpen] = useState(false)
  const [initialFormData, setInitialFormData] = useState<FormData | null>(null)
  const [formData, setFormData] = useState<FormData>({
    name: '',
    teacher_ids: [],
    class_time: '',
    description: '',
  })

  // Fetch class data
  const { data: classItem, isLoading: classLoading } = useQuery({
    queryKey: ['scheduled_class', classId],
    queryFn: async () => {
      if (!classId) throw new Error('Class ID is required')
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select('*')
        .eq('id', classId)
        .single()

      if (error) throw error
      return data as ScheduledClass
    },
    enabled: !!classId,
  })

  // Fetch teachers
  const { data: teachers = [] } = useQuery<TeacherDisplay[]>({
    queryKey: ['teachers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teachers')
        .select('id, first_name, last_name')
        .order('created_at', { ascending: true })

      if (error) throw error

      return ((data || []) as Array<{ id: string; first_name: string; last_name: string }>)
        .map((teacher) => ({
          id: teacher.id,
          first_name: teacher.first_name,
          last_name: teacher.last_name,
          teacher_color: null,
        }))
        .filter((t) => t.id && t.first_name && t.last_name)
    },
  })

  // Fetch courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['courses'],
    queryFn: async () => {
      const { data, error } = await supabase.from('courses').select('*').order('name', { ascending: true })

      if (error) throw error
      return data as unknown as Course[]
    },
  })

  // Update form data when class data loads
  useEffect(() => {
    if (classItem) {
      const teacherIds = classItem.teacher_id ? [classItem.teacher_id] : []
      const initial: FormData = {
        name: classItem.name || '',
        teacher_ids: teacherIds,
        class_time: classItem.start_time || '',
        description: classItem.description || '',
      }

      setInitialFormData(initial)
      setFormData(initial)
    }
  }, [classItem])

  // Check if form is dirty
  const isDirty = JSON.stringify(formData) !== JSON.stringify(initialFormData)

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (data: FormData) => {
      if (!classId) throw new Error('Class ID is required')

      const selectedCourse = courses.find((c) => c.name === data.name)
      const courseId = selectedCourse?.id || null

      const classData = {
        course_id: courseId,
        name: data.name,
        teacher_id: data.teacher_ids.length > 0 ? data.teacher_ids[0] : null,
        start_time: data.class_time,
        description: data.description || null,
      }

      const { error } = await supabase.from('scheduled_classes').update(classData as Record<string, unknown>).eq('id', classId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled_class'] })
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      toast.success(t('common.success'), { description: t('classroom.classUpdated') })
      navigate(`/admin/education/classrooms/${classroomId}`)
    },
    onError: (error: Error) => {
      toast.error(t('common.error'), { description: error.message })
    },
  })

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!classId) throw new Error('Class ID is required')
      const { error } = await supabase.from('scheduled_classes').delete().eq('id', classId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classrooms'] })
      toast.success(t('common.success'), { description: t('classroom.classDeleted') })
      navigate(`/admin/education/classrooms/${classroomId}`)
    },
    onError: (error: Error) => {
      toast.error(t('common.error'), { description: error.message })
    },
  })

  // Handlers
  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm(t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?')) {
        navigate(`/admin/education/classrooms/${classroomId}`)
      }
    } else {
      navigate(`/admin/education/classrooms/${classroomId}`)
    }
  }, [isDirty, navigate, classroomId, t])

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
          teacher_ids: teacherIds.filter((id) => id !== teacherId),
        }
      } else {
        return {
          ...prev,
          teacher_ids: [...teacherIds, teacherId],
        }
      }
    })
  }, [])

  const getSelectedTeacherNames = useCallback(() => {
    if (!formData.teacher_ids || formData.teacher_ids.length === 0) {
      return t('selectTeachers') || 'Select teachers...'
    }
    const selectedTeachers = teachers.filter((m) => formData.teacher_ids.includes(m.id))
    return selectedTeachers.map((t) => `${t.first_name} ${t.last_name}`).join(', ')
  }, [formData.teacher_ids, teachers, t])

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault()

      if (!formData.name.trim()) {
        toast.error(t('common.error'), { description: 'Class name is required' })
        return
      }

      updateMutation.mutate(formData)
    },
    [formData, updateMutation, t]
  )

  const handleDelete = useCallback(() => {
    if (!confirm('Are you sure you want to delete this class?')) {
      return
    }
    deleteMutation.mutate()
  }, [deleteMutation])

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

  // ESC key handler
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        if (teacherDropdownOpen) {
          setTeacherDropdownOpen(false)
        } else {
          handleClose()
        }
      }
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [teacherDropdownOpen, handleClose])

  if (classLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <p className="text-slate-600 dark:text-slate-400">Loading class data...</p>
      </div>
    )
  }

  if (!classItem) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-slate-600 dark:text-slate-400 mb-4">Class not found</p>
          <button
            onClick={() => navigate(`/admin/education/classrooms/${classroomId}`)}
            className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-500"
          >
            Go back to classroom
          </button>
        </div>
      </div>
    )
  }

  const getDayName = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { weekday: 'long' })
  }

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return ''
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center gap-4">
            <button
              onClick={handleClose}
              className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
            >
              <ArrowLeft size={24} />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">{t('editClass') || 'Edit Class'}</h1>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{classItem.name || 'Untitled Class'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {/* Schedule Info */}
            <div className="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-3">
                {t('scheduleDetails') || 'Schedule Details'}
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('day') || 'Day'}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {getDayName(classItem.start_date)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('date', { ns: 'common' }) || 'Date'}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">
                    {formatDate(classItem.start_date)}
                  </p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    {t('time', { ns: 'common' }) || 'Time'}
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">{classItem.start_time}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                    Classroom ID
                  </span>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 mt-1">#{classItem.classroom_id}</p>
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-left flex items-center justify-between focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
              >
                <span
                  className={
                    formData.teacher_ids.length === 0
                      ? 'text-slate-400 dark:text-slate-500'
                      : 'text-slate-900 dark:text-slate-100'
                  }
                >
                  {getSelectedTeacherNames()}
                </span>
                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {teacherDropdownOpen && (
                <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  {teachers.length === 0 ? (
                    <div className="px-3 py-4 text-center text-slate-500 dark:text-slate-400 text-sm">
                      {t('noTeachersAssigned') || 'No teachers assigned.'}
                    </div>
                  ) : (
                    <div className="py-1">
                      {teachers.map((member) => {
                        const isSelected = formData.teacher_ids?.includes(member.id) || false
                        return (
                          <label
                            key={member.id}
                            className={`flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 ${
                              isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : ''
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
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent"
                placeholder={t('descriptionPlaceholder') || 'Optional description...'}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-6 border-t border-slate-200 dark:border-slate-700">
              <button
                type="button"
                onClick={handleDelete}
                disabled={deleteMutation.isPending}
                className="flex items-center gap-2 px-4 py-2 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Trash2 size={18} />
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
                  disabled={updateMutation.isPending}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updateMutation.isPending
                    ? t('saving', { ns: 'common' }) || 'Saving...'
                    : t('save', { ns: 'common' }) || 'Save'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
