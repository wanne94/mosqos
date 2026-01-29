import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface AddTeacherToClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classroomId: number
}

interface ScheduledClass {
  id: number
  name: string
  teacher_ids: number[] | null
}

interface Member {
  id: number
  first_name: string
  last_name: string
  role: string | null
  teacher_color: string | null
}

const initialFormData = { selectedTeacherIds: [] }

export default function AddTeacherToClassroomModal({
  isOpen,
  onClose,
  onSave,
  classroomId
}: AddTeacherToClassroomModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const { currentOrganizationId } = useOrganization()
  const [classes, setClasses] = useState<ScheduledClass[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [selectedTeacherIds, setSelectedTeacherIds] = useState<number[]>([])
  const isDirty = useFormDirty({ selectedTeacherIds }, initialFormData)

  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm(t('unsavedChanges', { ns: 'common' }) || 'You have unsaved changes. Are you sure you want to close?')
      if (confirmClose) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  useEscapeKey(handleClose, false, '', isOpen)

  useEffect(() => {
    if (isOpen && classroomId) {
      fetchClasses()
      fetchTeachers()
      setSelectedTeacherIds([])
    }
  }, [isOpen, classroomId])

  const fetchClasses = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select('id, name, teacher_ids')
        .eq('classroom_id', classroomId)
        .order('name', { ascending: true })

      if (error) throw error
      setClasses(data || [])
    } catch (error) {
      console.error('Error fetching classes:', error)
    } finally {
      setFetching(false)
    }
  }

  const fetchTeachers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, first_name, last_name, role, teacher_color')
        .eq('organization_id', currentOrganizationId)
        .not('teacher_color', 'is', null)
        .order('first_name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching teachers:', error)
      setMembers([])
    }
  }

  const handleTeacherToggle = (teacherId: number) => {
    setSelectedTeacherIds((prev) => {
      if (prev.includes(teacherId)) {
        return prev.filter(id => id !== teacherId)
      } else {
        return [...prev, teacherId]
      }
    })
  }

  const handleSelectAllTeachers = () => {
    if (selectedTeacherIds.length === members.length) {
      setSelectedTeacherIds([])
    } else {
      setSelectedTeacherIds(members.map(m => m.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedTeacherIds.length === 0) {
      alert(t('selectAtLeastOneTeacher') || 'Please select at least one teacher')
      return
    }

    if (classes.length === 0) {
      alert(t('noClassesInClassroom') || 'No classes found in this classroom. Please create a class first.')
      return
    }

    setLoading(true)

    try {
      const updatePromises: Promise<void>[] = []

      selectedTeacherIds.forEach(teacherId => {
        classes.forEach(classItem => {
          updatePromises.push(
            (async () => {
              const { data: classData, error: fetchError } = await supabase
                .from('scheduled_classes')
                .select('teacher_ids, teacher_id')
                .eq('id', classItem.id)
                .single()

              if (fetchError) throw fetchError

              const currentTeacherIds = Array.isArray(classData.teacher_ids)
                ? classData.teacher_ids
                : []

              if (!currentTeacherIds.includes(teacherId)) {
                const updatedTeacherIds = [...currentTeacherIds, teacherId]

                const updateData: any = {
                  teacher_ids: updatedTeacherIds,
                }

                if (!classData.teacher_id) {
                  updateData.teacher_id = teacherId
                }

                const { error: updateError } = await supabase
                  .from('scheduled_classes')
                  .update(updateData)
                  .eq('id', classItem.id)

                if (updateError) throw updateError
              }
            })()
          )
        })
      })

      await Promise.all(updatePromises)

      onSave()
      onClose()

      alert(t('teachersAssignedSuccess', { ns: 'common' }) || `${selectedTeacherIds.length} teacher(s) assigned to all classes in this classroom successfully!`)
    } catch (error) {
      console.error('Error adding teachers:', error)
      alert(t('failedToAddTeacher', { ns: 'common' }) || 'Failed to add teachers. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('addTeacher') || 'Add Teacher to Classroom'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {fetching ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">{t('loading', { ns: 'common' }) || 'Loading...'}</p>
            </div>
          ) : classes.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">
                {t('noClassesInClassroom') || 'No classes found in this classroom. Please create a class first.'}
              </p>
            </div>
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('teachers') || 'Teachers'} {t('multipleSelection') || '(Multiple Selection)'} <span className="text-red-500">*</span>
                  </label>
                  {members.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAllTeachers}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {selectedTeacherIds.length === members.length
                        ? t('deselectAll', { ns: 'common' }) || 'Deselect All'
                        : t('selectAll', { ns: 'common' }) || 'Select All'}
                    </button>
                  )}
                </div>
                <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-3 max-h-60 overflow-y-auto bg-white dark:bg-slate-700">
                  {members.length === 0 ? (
                    <p className="text-slate-500 dark:text-slate-400 text-sm text-center py-4">
                      {t('noTeachersAssigned') || 'No teachers assigned. Please add teachers from the Teachers tab first.'}
                    </p>
                  ) : (
                    <div className="space-y-1">
                      {members.map((member) => {
                        const isSelected = selectedTeacherIds.includes(member.id)
                        return (
                          <label
                            key={member.id}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                              isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-600'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleTeacherToggle(member.id)}
                              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
                            />
                            <div
                              className="w-3 h-3 rounded-full border border-slate-300 dark:border-slate-600 flex-shrink-0"
                              style={{ backgroundColor: member.teacher_color || '#3B82F6' }}
                            />
                            <div className="flex-1">
                              <span className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {member.first_name} {member.last_name}
                              </span>
                              {member.role && (
                                <span className="text-xs text-slate-500 dark:text-slate-400 ml-2">({member.role})</span>
                              )}
                            </div>
                          </label>
                        )
                      })}
                    </div>
                  )}
                </div>
                {selectedTeacherIds.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {selectedTeacherIds.length} {t('teacherSelected', { ns: 'common' }) || 'teacher(s) selected'}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('cancel', { ns: 'common' }) || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading || selectedTeacherIds.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('saving', { ns: 'common' }) || 'Saving...' : `${t('add', { ns: 'common' }) || 'Add'} (${selectedTeacherIds.length})`}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
