import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormDirty } from '../../../shared/hooks/useFormDirty'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface CreateClassInClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  classroomId: string
}

interface ClassFormData {
  name: string
  description: string
}

const initialFormData: ClassFormData = {
  name: '',
  description: '',
}

export default function CreateClassInClassroomModal({
  isOpen,
  onClose,
  onSave,
  classroomId,
}: CreateClassInClassroomModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const { currentOrganizationId } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<ClassFormData>(initialFormData)
  const isDirty = useFormDirty(formData, initialFormData)

  const handleClose = () => {
    if (isDirty) {
      const confirmClose = window.confirm(
        t('unsavedChanges', { ns: 'common' }) || 'You have unsaved changes. Are you sure you want to close?'
      )
      if (confirmClose) {
        onClose()
      }
    } else {
      onClose()
    }
  }

  useEscapeKey(handleClose, { enabled: isOpen })

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData)
    }
  }, [isOpen])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert(t('fillAllFields', { ns: 'common' }) || 'Please enter a class name')
      return
    }

    setLoading(true)

    try {
      // Use scheduled_classes table
      const { error } = await supabase.from('scheduled_classes').insert([
        {
          name: formData.name.trim(),
          description: formData.description || null,
          classroom_id: classroomId,
          organization_id: currentOrganizationId,
          course_id: '', // Required - should be selected from courses
          start_date: new Date().toISOString().split('T')[0],
          end_date: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        },
      ])

      if (error) {
        console.error('Error creating class:', error)
        throw error
      }

      onSave()
      onClose()

      alert(t('classCreatedSuccess', { ns: 'common' }) || 'Class created successfully!')
    } catch (error) {
      console.error('Error creating class:', error)
      alert(t('failedToCreate', { ns: 'common' }) || 'Failed to create class. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100">
            {t('createClass') || 'Create Class'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              {t('className', { ns: 'common' }) || 'Class Name'} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder={t('classNamePlaceholder') || 'e.g., Quran Class, Arabic 101'}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-2">
              {t('description', { ns: 'common' }) || 'Description'}
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-slate-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-slate-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder={t('classDescriptionPlaceholder') || 'Enter class description...'}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-gray-300 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-700 transition-colors"
            >
              {t('cancel', { ns: 'common' }) || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving', { ns: 'common' }) || 'Saving...' : t('create', { ns: 'common' }) || 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
