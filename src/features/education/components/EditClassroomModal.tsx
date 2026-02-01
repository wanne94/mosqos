import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface EditClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classroomId: string
}

interface ClassroomFormData {
  name: string
  capacity: string
  description: string
}

export default function EditClassroomModal({ isOpen, onClose, onSave, classroomId }: EditClassroomModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const { currentOrganizationId } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [initialFormData, setInitialFormData] = useState<ClassroomFormData | null>(null)
  const [formData, setFormData] = useState<ClassroomFormData>({
    name: '',
    capacity: '',
    description: '',
  })
  const isDirty = useFormDirty(formData, initialFormData)

  useEscapeKey(
    onClose,
    isDirty,
    t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?',
    isOpen
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

  useEffect(() => {
    if (isOpen && classroomId) {
      fetchClassroom()
    }
  }, [isOpen, classroomId])

  const fetchClassroom = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('classrooms')
        .select('*')
        .eq('id', classroomId)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (error) throw error

      if (data) {
        const classroomData = data as { name: string; capacity: number | null; description: string | null }
        const initial: ClassroomFormData = {
          name: classroomData.name || '',
          capacity: classroomData.capacity?.toString() || '',
          description: classroomData.description || '',
        }
        setInitialFormData(initial)
        setFormData(initial)
      }
    } catch (error) {
      console.error('Error fetching classroom:', error)
      alert(t('failedToLoad', { ns: 'common' }) || 'Failed to load classroom data')
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const classroomData = {
        name: formData.name,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        description: formData.description || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('classrooms')
        .update(classroomData)
        .eq('id', classroomId)
        .eq('organization_id', currentOrganizationId)

      if (error) throw error

      onSave()
      onClose()
    } catch (error) {
      console.error('Error updating classroom:', error)
      alert(t('failedToUpdate', { ns: 'common' }) || `Failed to update classroom: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('editClassroom') || 'Edit'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {fetching ? (
            <div className="text-center py-8">
              <p className="text-slate-600 dark:text-slate-400">
                {t('loading', { ns: 'common' }) || 'Loading...'}
              </p>
            </div>
          ) : (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('name') || 'Classroom Name'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder={t('namePlaceholder') || 'e.g., Main Hall'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('capacity') || 'Capacity'}
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  min="1"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                  placeholder={t('capacityPlaceholder') || 'e.g., 50'}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  {t('description') || 'Description'}
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

              <div className="flex items-center justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  {t('cancel', { ns: 'common' }) || 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={loading || fetching}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (t('saving', { ns: 'common' }) || 'Saving...') : (t('save', { ns: 'common' }) || 'Save')}
                </button>
              </div>
            </>
          )}
        </form>
      </div>
    </div>
  )
}
