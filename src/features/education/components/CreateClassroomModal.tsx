import { useState, useCallback } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'
import { useCreateClassroom } from '../hooks/useClassrooms'

interface CreateClassroomModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

interface ClassroomFormData {
  name: string
  capacity: string
  description: string
}

const initialFormData: ClassroomFormData = {
  name: '',
  capacity: '',
  description: '',
}

export default function CreateClassroomModal({ isOpen, onClose, onSave }: CreateClassroomModalProps) {
  const { t } = useTranslation(['classroom', 'common'])
  const { currentOrganizationId } = useOrganization()
  const createClassroom = useCreateClassroom()
  const [formData, setFormData] = useState<ClassroomFormData>(initialFormData)
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
      alert('Classroom name is required')
      return
    }

    try {
      const classroomData = {
        name: formData.name,
        capacity: formData.capacity ? parseInt(formData.capacity) : null,
        description: formData.description || null,
        organization_id: currentOrganizationId!,
      }

      console.log('Creating classroom:', classroomData) // DEBUG

      await createClassroom.mutateAsync(classroomData)

      // Reset form
      setFormData(initialFormData)

      onSave()
      onClose()
    } catch (error) {
      console.error('Error creating classroom:', error)
      // Error je već handlean od hook-a via toast
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('createClassroom') || 'New Classroom'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
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
              disabled={createClassroom.isPending}
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {createClassroom.isPending ? (t('saving', { ns: 'common' }) || 'Saving...') : (t('save', { ns: 'common' }) || 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
