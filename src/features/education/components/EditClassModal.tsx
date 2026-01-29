import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface EditClassModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classId: string
}

interface ClassFormData {
  name: string
  description: string
}

export default function EditClassModal({ isOpen, onClose, onSave, classId }: EditClassModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [initialFormData, setInitialFormData] = useState<ClassFormData | null>(null)
  const [formData, setFormData] = useState<ClassFormData>({
    name: '',
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
    if (isOpen && classId) {
      fetchClassData()
    }
  }, [isOpen, classId])

  const fetchClassData = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', classId)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (error) throw error

      if (data) {
        const initial = {
          name: (data as any).name || '',
          description: (data as any).description || '',
        }
        setInitialFormData(initial)
        setFormData(initial)
      }
    } catch (error: any) {
      console.error('Error fetching course data:', error)
      alert(t('common.failedToLoad') || 'Failed to load course data')
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
      const classData = {
        name: formData.name,
        description: formData.description || null,
      }

      const { error } = await supabase
        .from('courses')
        .update(classData as any)
        .eq('id', classId)
        .eq('organization_id', currentOrganizationId)

      if (error) throw error

      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error updating course:', error)
      const errorMessage = error.message || t('common.failedToUpdate') || 'Failed to update course'
      alert(`${t('common.failedToUpdate') || 'Failed to update'}\n\n${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit Course</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400">
            {t('common.loading') || 'Loading course data...'}
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('common.className') || 'Course Name'} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="e.g., Quran Class, Arabic 101"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('common.description') || 'Description'}
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
                placeholder="Enter course description, topics covered, prerequisites, etc."
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel') || 'Cancel'}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
