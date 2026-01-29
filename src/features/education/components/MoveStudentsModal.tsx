import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface Classroom {
  id: string
  name: string
}

interface MoveStudentsModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  currentClassroomId: string
  selectedStudentIds: string[]
}

const initialFormData = { selectedClassroomId: '' }

export default function MoveStudentsModal({
  isOpen,
  onClose,
  onSave,
  currentClassroomId,
  selectedStudentIds
}: MoveStudentsModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const { currentOrganizationId } = useOrganization()
  const [classrooms, setClassrooms] = useState<Classroom[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [selectedClassroomId, setSelectedClassroomId] = useState('')
  const isDirty = useFormDirty({ selectedClassroomId }, initialFormData)

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

  useEscapeKey(onClose, isDirty, '', isOpen)

  useEffect(() => {
    if (isOpen) {
      fetchClassrooms()
      setSelectedClassroomId('')
    }
  }, [isOpen, selectedStudentIds])

  const fetchClassrooms = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('classrooms')
        .select('id, name')
        .eq('organization_id', currentOrganizationId)
        .neq('id', currentClassroomId)
        .order('name', { ascending: true })

      if (error) throw error
      setClassrooms(data || [])
    } catch (error) {
      console.error('Error fetching classrooms:', error)
      setClassrooms([])
    } finally {
      setFetching(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!selectedClassroomId) {
      alert(t('selectClassroom', { ns: 'common' }) || 'Please select a classroom')
      return
    }

    if (selectedStudentIds.length === 0) {
      alert(t('selectAtLeastOneStudent', { ns: 'common' }) || 'Please select at least one student')
      return
    }

    setLoading(true)

    try {
      // Get all classes in the target classroom
      const { data: targetClasses, error: targetClassesError } = await supabase
        .from('scheduled_classes')
        .select('id')
        .eq('organization_id', currentOrganizationId)
        .eq('classroom_id', selectedClassroomId)

      if (targetClassesError) throw targetClassesError

      let targetClassId = null

      if (targetClasses && targetClasses.length > 0) {
        // Use the first class in the target classroom
        targetClassId = targetClasses[0].id
      } else {
        // Create a default class in the target classroom if none exists
        const defaultClassName = `Default Class - ${new Date().getFullYear()}`
        const { data: newClass, error: createClassError } = await supabase
          .from('scheduled_classes')
          .insert({
              name: defaultClassName,
              classroom_id: selectedClassroomId,
              teacher_ids: [],
              organization_id: currentOrganizationId,
            } as any)
          .select()
          .single()

        if (createClassError) throw createClassError
        targetClassId = (newClass as any).id
      }

      // Get all classes in the current classroom
      const { data: currentClasses, error: currentClassesError } = await supabase
        .from('scheduled_classes')
        .select('id')
        .eq('organization_id', currentOrganizationId)
        .eq('classroom_id', currentClassroomId)

      if (currentClassesError) throw currentClassesError

      if (currentClasses && currentClasses.length > 0) {
        const currentClassIds = currentClasses.map((c: any) => c.id)

        // Delete enrollments from current classroom
        const { error: deleteError } = await supabase
          .from('enrollments')
          .delete()
          .in('member_id', selectedStudentIds)
          .in('class_id', currentClassIds)
          .eq('organization_id', currentOrganizationId)

        if (deleteError) throw deleteError
      }

      // Create enrollments in the target classroom
      const enrollmentsToInsert = selectedStudentIds.map(studentId => ({
        class_id: targetClassId,
        member_id: studentId,
        organization_id: currentOrganizationId,
      }))

      const { error: insertError } = await supabase
        .from('enrollments')
        .insert(enrollmentsToInsert as any)

      if (insertError) throw insertError

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error moving students:', error)
      alert(t('failedToMove', { ns: 'common' }) || 'Failed to move students. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('moveStudents') || 'Move Students'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
              {t('movingStudents') || `Moving ${selectedStudentIds.length} student(s) to another classroom`}
            </p>
          </div>

          {fetching ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">{t('loading', { ns: 'common' }) || 'Loading...'}</p>
            </div>
          ) : classrooms.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">
                {t('noOtherClassrooms') || 'No other classrooms available'}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('selectTargetClassroom') || 'Select Target Classroom'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={selectedClassroomId}
                  onChange={(e) => setSelectedClassroomId(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                >
                  <option value="">{t('selectClassroom', { ns: 'common' }) || 'Select a classroom'}</option>
                  {classrooms.map((classroom) => (
                    <option key={classroom.id} value={classroom.id}>
                      {classroom.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                >
                  {t('cancel', { ns: 'common' }) || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading || !selectedClassroomId}
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('moving', { ns: 'common' }) || 'Moving...' : t('move') || 'Move'}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
