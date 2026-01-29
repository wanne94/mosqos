import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface Member {
  id: string
  first_name: string
  last_name: string
}

interface EditEnrollmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  enrollmentId: string
}

interface EnrollmentFormData {
  member_id: string
  monthly_fee: string
  start_date: string
  end_date: string
}

export default function EditEnrollmentModal({ isOpen, onClose, onSave, enrollmentId }: EditEnrollmentModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [initialFormData, setInitialFormData] = useState<EnrollmentFormData | null>(null)
  const [formData, setFormData] = useState<EnrollmentFormData>({
    member_id: '',
    monthly_fee: '',
    start_date: '',
    end_date: '',
  })
  const [selectedStudentName, setSelectedStudentName] = useState('')
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
    if (isOpen && enrollmentId) {
      fetchMembers().then(() => {
        fetchEnrollmentData()
      })
    }
  }, [isOpen, enrollmentId])

  const fetchEnrollmentData = async () => {
    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('enrollments')
        .select('*')
        .eq('id', enrollmentId)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (error) throw error

      if (data) {
        const initial = {
          member_id: (data as any).member_id?.toString() || '',
          monthly_fee: (data as any).monthly_fee?.toString() || '',
          start_date: (data as any).start_date || '',
          end_date: (data as any).end_date || '',
        }
        setInitialFormData(initial)
        setFormData(initial)

        // Set selected student name after members are loaded
        if ((data as any).member_id && members.length > 0) {
          const selectedMember = members.find(m => m.id === (data as any).member_id)
          if (selectedMember) {
            setSelectedStudentName(`${selectedMember.first_name} ${selectedMember.last_name}`)
          }
        }
      }
    } catch (error: any) {
      console.error('Error fetching enrollment data:', error)
      alert('Failed to load enrollment data. Please try again.')
    } finally {
      setFetching(false)
    }
  }

  // Update student name when members or formData.member_id changes
  useEffect(() => {
    if (formData.member_id && members.length > 0) {
      const selectedMember = members.find(m => m.id === formData.member_id)
      if (selectedMember) {
        setSelectedStudentName(`${selectedMember.first_name} ${selectedMember.last_name}`)
      } else {
        setSelectedStudentName('')
      }
    }
  }, [formData.member_id, members])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, first_name, last_name')
        .eq('organization_id', currentOrganizationId)
        .order('first_name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
      return data || []
    } catch (error) {
      console.error('Error fetching members:', error)
      return []
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))

    // Update selected student name when member is selected
    if (name === 'member_id' && value) {
      const selectedMember = members.find(m => m.id === value)
      if (selectedMember) {
        setSelectedStudentName(`${selectedMember.first_name} ${selectedMember.last_name}`)
      } else {
        setSelectedStudentName('')
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const monthlyFee = parseFloat(formData.monthly_fee) || null

      const { error } = await supabase
        .from('enrollments')
        .update({
          member_id: formData.member_id,
          monthly_fee: monthlyFee,
          start_date: formData.start_date || null,
          end_date: formData.end_date || null,
        } as any)
        .eq('id', enrollmentId)

      if (error) {
        console.error('Update error:', error)
        throw error
      }

      alert(t('education.enrollmentUpdated') || 'Enrollment updated successfully!')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error updating enrollment:', error)
      if (error.code === '23505') {
        alert(t('common.alreadyEnrolled') || 'This student is already enrolled.')
      } else {
        alert(t('common.failedToUpdateEnrollment') || 'Failed to update enrollment. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Edit Enrollment</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400">Loading enrollment data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('education.student')} *
              </label>
              <select
                name="member_id"
                value={formData.member_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              >
                <option value="">{t('common.selectStudent') || 'Select a student'}</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                  </option>
                ))}
              </select>
              {selectedStudentName && (
                <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400 font-medium">
                  {t('education.selectedStudent') || 'Selected:'} {selectedStudentName}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('education.monthlyFee') || 'Monthly Fee'} (USD)
              </label>
              <input
                type="number"
                name="monthly_fee"
                value={formData.monthly_fee}
                onChange={handleChange}
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('education.startDate') || 'Start Date'} *
              </label>
              <input
                type="date"
                name="start_date"
                value={formData.start_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                {t('education.endDate') || 'End Date'} *
              </label>
              <input
                type="date"
                name="end_date"
                value={formData.end_date}
                onChange={handleChange}
                required
                min={formData.start_date || undefined}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100"
              />
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                {t('common.cancel')}
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('common.loading') : t('common.saveChanges') || 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
