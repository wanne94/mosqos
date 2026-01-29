import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'

interface Member {
  id: string
  first_name: string
  last_name: string
}

interface EnrollStudentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

interface EnrollmentFormData {
  member_id: string
  monthly_fee: string
  start_date: string
  end_date: string
}

const initialFormData: EnrollmentFormData = {
  member_id: '',
  monthly_fee: '',
  start_date: '',
  end_date: '',
}

export default function EnrollStudentModal({ isOpen, onClose, onSave }: EnrollStudentModalProps) {
  const { t } = useTranslation()
  const [members, setMembers] = useState<Member[]>([])
  const [enrolledMemberIds, setEnrolledMemberIds] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<EnrollmentFormData>(initialFormData)
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
    if (isOpen) {
      fetchMembers()
      fetchEnrolledStudents()
      setFormData(initialFormData)
      setSelectedStudentName('')
    }
  }, [isOpen])

  const fetchEnrolledStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select('member_id')

      if (error) {
        // If table doesn't exist, just use empty array
        if (error.code === 'PGRST205' || error.message?.includes('Could not find the table')) {
          setEnrolledMemberIds([])
          return
        }
        throw error
      }

      setEnrolledMemberIds((data || []).map((e: any) => e.member_id))
    } catch (error) {
      console.error('Error fetching enrolled students:', error)
      setEnrolledMemberIds([])
    }
  }

  const fetchMembers = async () => {
    try {
      // Fetch all existing teachers to exclude them
      const { data: existingTeachers, error: teachersError } = await supabase
        .from('teachers')
        .select('member_id')

      if (teachersError) {
        console.warn('Error fetching teachers:', teachersError)
      }

      const teacherMemberIds = (existingTeachers || []).map((t: any) => t.member_id)

      // Fetch all members, excluding those who are teachers
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, first_name, last_name')
        .order('first_name', { ascending: true })

      if (error) throw error

      // Filter out teachers
      const availableMembers = (data || []).filter((member: Member) =>
        !teacherMemberIds.includes(member.id)
      )

      setMembers(availableMembers)
    } catch (error) {
      console.error('Error fetching organization_members:', error)
      setMembers([])
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
      // Double-check: Verify the member is not a teacher
      const { data: teacherData, error: teacherError } = await supabase
        .from('teachers')
        .select('id, organization_members:member_id (id, first_name, last_name)')
        .eq('member_id', formData.member_id)
        .maybeSingle()

      if (teacherError) {
        console.error('Error checking teacher:', teacherError)
        // Continue - might be table doesn't exist yet
      } else if (teacherData) {
        const teacherName = (teacherData as any).organization_members
          ? `${(teacherData as any).organization_members.first_name} ${(teacherData as any).organization_members.last_name}`
          : 'This person'
        alert(t('education.cannotEnrollTeacher') || `${teacherName} is a teacher and cannot be enrolled as a student. Please remove their teacher status first.`)
        setLoading(false)
        return
      }

      // Check if student is already enrolled
      const { data: existingEnrollments, error: checkError } = await supabase
        .from('enrollments')
        .select('id')
        .eq('member_id', formData.member_id)

      if (checkError) {
        console.error('Error checking existing enrollments:', checkError)
        // Continue anyway - might be table doesn't exist yet
      } else if (existingEnrollments && existingEnrollments.length > 0) {
        const selectedMember = members.find(m => m.id === formData.member_id)
        const studentName = selectedMember
          ? `${selectedMember.first_name} ${selectedMember.last_name}`
          : 'This student'
        alert(t('common.alreadyEnrolledSpecific', { name: studentName }) || `${studentName} is already enrolled. Please edit the existing enrollment instead.`)
        setLoading(false)
        return
      }

      const enrollmentStartDate = formData.start_date || null
      const enrollmentEndDate = formData.end_date || null
      const monthlyFee = parseFloat(formData.monthly_fee) || 0

      const { data: enrollmentData, error } = await supabase.from('enrollments').insert({
          member_id: formData.member_id,
          monthly_fee: monthlyFee > 0 ? monthlyFee : null,
          start_date: enrollmentStartDate,
          end_date: enrollmentEndDate,
        } as any).select().single()

      if (error) {
        console.error('Enrollment insert error:', error)
        throw error
      }

      if (!enrollmentData) {
        throw new Error('Enrollment was created but no data was returned')
      }

      // Create monthly payment records if monthly fee is provided and dates are set
      // This is optional - if it fails, enrollment still succeeds
      if (monthlyFee > 0 && enrollmentStartDate && enrollmentEndDate) {
        const startDate = new Date(enrollmentStartDate)
        const endDate = new Date(enrollmentEndDate)

        // Create monthly payment records for all months between start and end date
        const monthlyPayments = []

        // Start from the first month of the enrollment
        let currentMonth = new Date(startDate.getFullYear(), startDate.getMonth(), 1)

        // Create records for each month until end date
        while (currentMonth <= endDate) {
          const month = currentMonth.getMonth() + 1
          const year = currentMonth.getFullYear()

          monthlyPayments.push({
            enrollment_id: (enrollmentData as any).id,
            member_id: formData.member_id,
            month: month,
            year: year,
            amount_due: monthlyFee,
            amount_paid: 0,
            payment_status: 'Unpaid',
          })

          // Move to next month
          currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
        }

        if (monthlyPayments.length > 0) {
          const { error: paymentsError } = await supabase
            .from('tuition_monthly_payments')
            .insert(monthlyPayments as any)

          if (paymentsError) {
            console.error('Error creating monthly payments:', paymentsError)
            // Don't throw - enrollment was successful, payments are optional
            alert('Enrollment saved, but monthly payments could not be created. You can add them manually later.')
          }
        }
      } else if (monthlyFee > 0) {
        // If fee is provided but no dates, create for current month and next 2 months
        const currentDate = new Date()
        const currentMonth = currentDate.getMonth() + 1
        const currentYear = currentDate.getFullYear()

        const monthlyPayments = []

        for (let i = 0; i < 3; i++) {
          const targetDate = new Date(currentYear, currentMonth - 1 + i, 1)
          const month = targetDate.getMonth() + 1
          const year = targetDate.getFullYear()

          monthlyPayments.push({
            enrollment_id: (enrollmentData as any).id,
            member_id: formData.member_id,
            month: month,
            year: year,
            amount_due: monthlyFee,
            amount_paid: 0,
            payment_status: 'Unpaid',
          })
        }

        if (monthlyPayments.length > 0) {
          const { error: paymentsError } = await supabase
            .from('tuition_monthly_payments')
            .insert(monthlyPayments as any)

          if (paymentsError) {
            console.error('Error creating monthly payments:', paymentsError)
            // Don't throw - enrollment was successful, payments are optional
            alert('Enrollment saved, but monthly payments could not be created. You can add them manually later.')
          }
        }
      }

      alert(t('education.enrollmentSuccess') || 'Student enrolled successfully!')
      onSave()
      onClose()
    } catch (error: any) {
      console.error('Error enrolling student:', error)
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint
      })

      if (error.code === '23505') {
        alert(t('common.alreadyEnrolled') || 'This student is already enrolled.')
      } else if (error.code === 'PGRST205' || error.message?.includes('Could not find the table') || error.message?.includes('does not exist')) {
        alert(
          t('education.enrollmentsTableNotFound') ||
          'Enrollments table not found. Please run the migration: migrations/create_enrollments_table.sql'
        )
      } else {
        const errorMsg = error.message || error.details || t('common.failedToSave') || 'Failed to save enrollment. Please try again.'
        alert(errorMsg)
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
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">{t('education.enrollStudent')}</h2>
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
              {members
                .filter(member => !enrolledMemberIds.includes(member.id) || member.id === formData.member_id)
                .map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.first_name} {member.last_name}
                    {enrolledMemberIds.includes(member.id) && ' (Already Enrolled)'}
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
              {loading ? t('common.loading') : t('education.enrollStudent')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
