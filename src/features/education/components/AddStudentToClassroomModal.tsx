import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface AddStudentToClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classroomId: number
}

interface ScheduledClass {
  id: number
  name: string
  classroom_id: number | null
}

interface Member {
  id: number
  first_name: string
  last_name: string
  role: string | null
}

const initialFormData = { selectedStudentIds: [] }

export default function AddStudentToClassroomModal({
  isOpen,
  onClose,
  onSave,
  classroomId
}: AddStudentToClassroomModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const { currentOrganizationId } = useOrganization()
  const [classes, setClasses] = useState<ScheduledClass[]>([])
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [selectedStudentIds, setSelectedStudentIds] = useState<number[]>([])
  const isDirty = useFormDirty({ selectedStudentIds }, initialFormData)

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
      fetchAvailableStudents()
      setSelectedStudentIds([])
    }
  }, [isOpen, classroomId])

  const fetchClasses = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('scheduled_classes')
        .select('id, name')
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

  const fetchAvailableStudents = async () => {
    try {
      const { data: allEnrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select('member_id')
        .eq('organization_id', currentOrganizationId)

      if (enrollmentsError) throw enrollmentsError

      const { data: allClasses, error: classesError } = await supabase
        .from('scheduled_classes')
        .select('id, classroom_id')
        .not('classroom_id', 'is', null)

      if (classesError) throw classesError

      const classToClassroomMap = new Map<number, number>()
      if (allClasses) {
        allClasses.forEach(c => {
          if (c.classroom_id) {
            classToClassroomMap.set(c.id, c.classroom_id)
          }
        })
      }

      const enrolledStudentIds = new Set<number>()
      if (allEnrollments) {
        allEnrollments.forEach(enrollment => {
          enrolledStudentIds.add(enrollment.member_id)
        })
      }

      if (enrolledStudentIds.size === 0) {
        setMembers([])
        return
      }

      const { data: enrolledMembers, error: membersError } = await supabase
        .from('members')
        .select('id, first_name, last_name, membership_type')
        .eq('organization_id', currentOrganizationId)
        .in('id', Array.from(enrolledStudentIds))
        .order('first_name', { ascending: true })

      if (membersError) throw membersError

      const studentsInThisClassroom = new Set<number>()
      const studentsInOtherClassrooms = new Set<number>()

      const availableMembers = (enrolledMembers || []).filter(member => {
        if (studentsInThisClassroom.has(member.id)) {
          return true
        }
        if (studentsInOtherClassrooms.has(member.id)) {
          return false
        }
        return true
      })

      setMembers(availableMembers)
    } catch (error) {
      console.error('Error fetching available students:', error)
      setMembers([])
    }
  }

  const handleStudentToggle = (studentId: number) => {
    setSelectedStudentIds((prev) => {
      if (prev.includes(studentId)) {
        return prev.filter(id => id !== studentId)
      } else {
        return [...prev, studentId]
      }
    })
  }

  const handleSelectAll = () => {
    if (selectedStudentIds.length === members.length) {
      setSelectedStudentIds([])
    } else {
      setSelectedStudentIds(members.map(m => m.id))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (selectedStudentIds.length === 0) {
      alert(t('selectAtLeastOneStudent', { ns: 'common' }) || 'Please select at least one student')
      return
    }

    setLoading(true)

    try {
      let classIdToUse: number | null = null

      if (classes.length > 0) {
        classIdToUse = classes[0].id
      } else {
        const defaultClassName = `Default Class - ${new Date().getFullYear()}`
        const { data: newClass, error: createClassError } = await supabase
          .from('scheduled_classes')
          .insert([
            {
              name: defaultClassName,
              classroom_id: classroomId,
              teacher_ids: [],
            },
          ])
          .select()
          .single()

        if (createClassError) throw createClassError
        classIdToUse = newClass.id
      }

      console.log('Enrolling students:', {
        class_id: classIdToUse,
        student_ids: selectedStudentIds,
        classroom_id: classroomId
      })

      const { data: existingEnrollments, error: checkError } = await supabase
        .from('enrollments')
        .select('member_id')
        .eq('organization_id', currentOrganizationId)
        .in('member_id', selectedStudentIds)

      if (checkError) throw checkError

      const { data: allClasses, error: classesError } = await supabase
        .from('scheduled_classes')
        .select('id, classroom_id')
        .not('classroom_id', 'is', null)

      if (classesError) throw classesError

      const classToClassroomMap = new Map<number, number>()
      if (allClasses) {
        allClasses.forEach(c => {
          if (c.classroom_id) {
            classToClassroomMap.set(c.id, c.classroom_id)
          }
        })
      }

      const studentsInOtherClassrooms: Member[] = []
      if (existingEnrollments) {
        existingEnrollments.forEach(enrollment => {
          const studentClassroomId = classToClassroomMap.get((enrollment as any).class_id)
          if (studentClassroomId && studentClassroomId !== classroomId) {
            const student = members.find(m => m.id === enrollment.member_id)
            if (student && !studentsInOtherClassrooms.find(s => s.id === student.id)) {
              studentsInOtherClassrooms.push(student)
            }
          }
        })
      }

      if (studentsInOtherClassrooms.length > 0) {
        const studentNames = studentsInOtherClassrooms.map(s => `${s.first_name} ${s.last_name}`).join(', ')
        alert(t('studentsAlreadyInOtherClassroom') || `The following students are already enrolled in another classroom: ${studentNames}`)
        return
      }

      const studentsToEnroll = selectedStudentIds.filter(studentId => {
        if (!existingEnrollments) return true
        return !existingEnrollments.some(e => {
          if (!(e as any).class_id) return false
          const studentClassroomId = classToClassroomMap.get((e as any).class_id)
          return e.member_id === studentId && studentClassroomId === classroomId
        })
      })

      if (studentsToEnroll.length === 0) {
        alert(t('allStudentsAlreadyEnrolled') || 'All selected students are already enrolled in this classroom')
        return
      }

      const enrollmentsToInsert = studentsToEnroll.map(studentId => ({
        class_id: classIdToUse,
        member_id: studentId,
        organization_id: currentOrganizationId,
      }))

      const { data: enrollmentData, error } = await supabase
        .from('enrollments')
        .insert(enrollmentsToInsert)
        .select()

      if (error) {
        console.error('Enrollment error:', error)
        throw error
      }

      console.log('Enrollment successful:', enrollmentData)

      if (onSave) {
        onSave()
      }

      onClose()
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
            {t('addStudent') || 'Add Student to Classroom'}
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
          ) : (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('students') || 'Students'} {t('multipleSelection') || '(Multiple Selection)'} <span className="text-red-500">*</span>
                  </label>
                  {members.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                    >
                      {selectedStudentIds.length === members.length
                        ? t('deselectAll', { ns: 'common' }) || 'Deselect All'
                        : t('selectAll', { ns: 'common' }) || 'Select All'}
                    </button>
                  )}
                </div>
                {members.length === 0 ? (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    {t('noEnrolledStudents') || 'No enrolled students found.'}
                  </p>
                ) : (
                  <div className="border border-slate-300 dark:border-slate-600 rounded-lg p-4 max-h-60 overflow-y-auto">
                    <div className="space-y-2">
                      {members.map((member) => {
                        const isSelected = selectedStudentIds.includes(member.id)
                        return (
                          <label
                            key={member.id}
                            className={`flex items-center gap-3 p-2 rounded cursor-pointer ${
                              isSelected ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleStudentToggle(member.id)}
                              className="w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-emerald-500"
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
                  </div>
                )}
                {selectedStudentIds.length > 0 && (
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {selectedStudentIds.length} {t('studentSelected', { ns: 'common' }) || 'student(s) selected'}
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
                  disabled={loading || members.length === 0 || selectedStudentIds.length === 0}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('saving', { ns: 'common' }) || 'Saving...' : `${t('add', { ns: 'common' }) || 'Add'} (${selectedStudentIds.length})`}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
