import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X, DollarSign } from 'lucide-react'
import { useFormDirty } from '../../../hooks/useFormDirty'
import { useEscapeKey } from '../../../hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface LogTuitionPaymentModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  enrollment: {
    id: string
    member_id: string
    class_id: string
    amount_paid?: number
    classes?: {
      name: string
      tuition_fee?: number
    }
    organization_members?: {
      first_name: string
      last_name: string
    }
  }
  selectedMonth?: number
  selectedYear?: number
}

interface Fund {
  id: string
  name: string
}

interface PaymentFormData {
  amount: string
  payment_date: string
  payment_method: string
}

const initialFormData: PaymentFormData = {
  amount: '',
  payment_date: new Date().toISOString().split('T')[0],
  payment_method: 'Cash',
}

export default function LogTuitionPaymentModal({
  isOpen,
  onClose,
  onSave,
  enrollment,
  selectedMonth,
  selectedYear,
}: LogTuitionPaymentModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const [educationFund, setEducationFund] = useState<Fund | null>(null)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState<PaymentFormData>(initialFormData)
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
      if (
        window.confirm(
          t('unsavedChangesWarning') || 'You have unsaved changes. Are you sure you want to close?'
        )
      ) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose, t])

  useEffect(() => {
    if (isOpen && enrollment) {
      fetchFunds()

      // Set default payment date to the last day of the selected month
      const month = selectedMonth || new Date().getMonth() + 1
      const year = selectedYear || new Date().getFullYear()
      const lastDayOfMonth = new Date(year, month, 0).toISOString().split('T')[0]

      // Reset form when modal opens with tuition fee as default amount
      const tuitionFee = parseFloat(enrollment.classes?.tuition_fee?.toString() || '0') || 0
      setFormData({
        amount: tuitionFee > 0 ? tuitionFee.toString() : '',
        payment_date: lastDayOfMonth,
        payment_method: 'Cash',
      })
    }
  }, [isOpen, enrollment, selectedMonth, selectedYear])

  const fetchFunds = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_funds')
        .select('*')
        .eq('organization_id', currentOrganizationId)

      if (error) throw error
      await findOrCreateEducationFund(data || [])
    } catch (error) {
      console.error('Error fetching funds:', error)
    }
  }

  const findOrCreateEducationFund = async (availableFunds: Fund[]) => {
    try {
      // Find Education fund (try multiple name variations)
      let fund = availableFunds.find((f) => {
        const name = f.name?.toLowerCase() || ''
        return name === 'education' || name === 'education fund' || name.includes('education')
      })

      if (!fund) {
        // Create Education fund if it doesn't exist
        const { data: newFund, error: createError } = await (supabase
          .from('organization_funds') as any)
          .insert([{ name: 'Education', organization_id: currentOrganizationId }])
          .select()
          .single()

        if (createError) {
          console.error('Error creating Education fund:', createError)
          // Try to fetch again in case it was created by another process
          const { data: retryData } = await supabase
            .from('organization_funds')
            .select('*')
            .eq('organization_id', currentOrganizationId)
            .ilike('name', '%education%')
            .limit(1)
            .single()

          if (retryData) {
            fund = retryData
          } else {
            // Last resort: use first available fund or show error
            console.warn('Could not find or create Education fund. Using first available fund or null.')
            fund = availableFunds[0] || null
          }
        } else {
          fund = newFund
        }
      }

      // Ensure we have a fund before proceeding
      if (!fund) {
        console.error('No Education fund available. Tuition payments may not be categorized correctly.')
      }

      setEducationFund(fund || null)
    } catch (error) {
      console.error('Error finding or creating Education fund:', error)
      setEducationFund(null)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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
      if (!enrollment?.member_id || !enrollment?.classes) {
        alert(t('common.missingEnrollmentInfo'))
        return
      }

      // Get household_id from members table
      const { data: memberData, error: memberError } = await supabase
        .from('members')
        .select('household_id')
        .eq('id', enrollment.member_id)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (memberError || !(memberData as any)?.household_id) {
        alert(t('common.couldNotFindHousehold'))
        return
      }

      const paymentAmount = parseFloat(formData.amount)
      if (isNaN(paymentAmount) || paymentAmount <= 0) {
        alert(t('common.enterValidPaymentAmount'))
        return
      }

      const paymentDate = new Date(formData.payment_date || new Date().toISOString().split('T')[0])
      const paymentMonth = paymentDate.getMonth() + 1
      const paymentYear = paymentDate.getFullYear()

      // Calculate last day of the payment month (payment due date)
      const lastDayOfMonth = new Date(paymentYear, paymentMonth, 0)
      const paymentDueDate = lastDayOfMonth.toISOString().split('T')[0]

      // Get or create monthly payment record for the payment month
      const tuitionFee = parseFloat(enrollment.classes?.tuition_fee?.toString() || '0') || 0

      const { data: existingMonthlyPayment, error: fetchError } = await supabase
        .from('tuition_monthly_payments')
        .select('*')
        .eq('enrollment_id', enrollment.id)
        .eq('month', paymentMonth)
        .eq('year', paymentYear)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // Record doesn't exist, create it
        const { error: createError } = await (supabase.from('tuition_monthly_payments') as any).insert([
          {
            enrollment_id: enrollment.id,
            class_id: enrollment.class_id,
            member_id: enrollment.member_id,
            month: paymentMonth,
            year: paymentYear,
            amount_due: tuitionFee,
            amount_paid: paymentAmount,
            payment_status: paymentAmount >= tuitionFee ? 'Paid' : 'Unpaid',
            payment_date: paymentDueDate, // Set to last day of month
          },
        ])

        if (createError) throw createError
      } else if (fetchError) {
        // Some other error occurred
        throw fetchError
      } else {
        // Record exists, update it
        const newMonthlyAmountPaid = (parseFloat((existingMonthlyPayment as any).amount_paid?.toString() || '0') || 0) + paymentAmount
        const monthlyAmountDue = parseFloat((existingMonthlyPayment as any).amount_due?.toString() || '0') || tuitionFee
        const newMonthlyStatus = newMonthlyAmountPaid >= monthlyAmountDue ? 'Paid' : 'Unpaid'

        const { error: updateMonthlyError } = await (supabase
          .from('tuition_monthly_payments') as any)
          .update({
            amount_paid: newMonthlyAmountPaid,
            payment_status: newMonthlyStatus,
            payment_date:
              newMonthlyStatus === 'Paid'
                ? paymentDueDate
                : formData.payment_date || new Date().toISOString().split('T')[0],
          })
          .eq('id', (existingMonthlyPayment as any).id)

        if (updateMonthlyError) throw updateMonthlyError
      }

      // Update total enrollment payment
      const currentAmountPaid = parseFloat(enrollment.amount_paid?.toString() || '0') || 0
      const newAmountPaid = currentAmountPaid + paymentAmount

      // Ensure Education fund exists before inserting donation
      let currentEducationFund = educationFund
      if (!currentEducationFund) {
        // Try to fetch Education fund one more time
        const { data: fundData, error: fundError } = await supabase
          .from('organization_funds')
          .select('*')
          .eq('organization_id', currentOrganizationId)
          .ilike('name', '%education%')
          .limit(1)
          .single()

        if (fundError || !fundData) {
          // Create Education fund if it still doesn't exist
          const { data: newFund, error: createError } = await (supabase
            .from('organization_funds') as any)
            .insert([{ name: 'Education', organization_id: currentOrganizationId }])
            .select()
            .single()

          if (createError) {
            throw new Error(
              'Could not find or create Education fund. Please create an Education fund in Settings first.'
            )
          }
          currentEducationFund = newFund
          setEducationFund(newFund)
        } else {
          currentEducationFund = fundData
          setEducationFund(fundData)
        }
      }

      // Insert into donations table
      const studentName = enrollment.organization_members
        ? `${enrollment.organization_members.first_name} ${enrollment.organization_members.last_name}`
        : 'Student'

      const donationData = {
        household_id: (memberData as any).household_id,
        member_id: enrollment.member_id,
        fund_id: currentEducationFund?.id || null,
        amount: paymentAmount,
        payment_method: formData.payment_method,
        donation_date: formData.payment_date || new Date().toISOString().split('T')[0],
        notes: `Tuition for ${studentName} - ${enrollment.classes?.name || 'Class'} (${paymentMonth}/${paymentYear})`,
        organization_id: currentOrganizationId,
      }

      // Validate fund_id is set
      if (!donationData.fund_id) {
        throw new Error('Education fund not found. Please create an Education fund in Settings first.')
      }

      const { error: donationError } = await (supabase.from('donations') as any).insert([donationData])

      if (donationError) throw donationError

      // Update payment status in enrollments
      let newPaymentStatus = 'Partial'
      if (newAmountPaid >= tuitionFee && tuitionFee > 0) {
        newPaymentStatus = 'Paid'
      } else if (newAmountPaid > 0) {
        newPaymentStatus = 'Partial'
      } else {
        newPaymentStatus = 'Unpaid'
      }

      const { error: updateError } = await (supabase
        .from('enrollments') as any)
        .update({
          amount_paid: newAmountPaid,
          payment_status: newPaymentStatus,
        })
        .eq('id', enrollment.id)

      if (updateError) throw updateError

      // Wait a bit to ensure database update is complete before refreshing
      await new Promise((resolve) => setTimeout(resolve, 500))

      alert(t('common.tuitionPaymentLoggedSuccess'))
      onSave()
      onClose()
    } catch (error) {
      console.error('Error logging tuition payment:', error)
      const errorMessage = error instanceof Error ? error.message : 'Please try again.'
      alert(`Failed to log payment: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const tuitionFee = parseFloat(enrollment?.classes?.tuition_fee?.toString() || '0') || 0
  const amountPaid = parseFloat(enrollment?.amount_paid?.toString() || '0') || 0
  const remaining = tuitionFee - amountPaid

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Log Tuition Payment</h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {enrollment && (
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Student:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {enrollment.organization_members
                      ? `${enrollment.organization_members.first_name} ${enrollment.organization_members.last_name}`
                      : t('common.notAvailable')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">{t('education.class')}:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {enrollment.classes?.name || t('common.notAvailable')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Tuition Fee:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(tuitionFee)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600 dark:text-slate-400">Paid So Far:</span>
                  <span className="font-medium text-slate-900 dark:text-white">
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(amountPaid)}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-200 dark:border-slate-600">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Remaining:</span>
                  <span
                    className={`font-bold ${
                      remaining > 0
                        ? 'text-red-600 dark:text-red-400'
                        : 'text-emerald-600 dark:text-emerald-400'
                    }`}
                  >
                    {new Intl.NumberFormat('en-US', {
                      style: 'currency',
                      currency: 'USD',
                    }).format(remaining)}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Payment Amount ($) *
            </label>
            <div className="relative">
              <DollarSign
                className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                size={18}
              />
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0.01"
                required
                className="w-full pl-10 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                placeholder="0.00"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Payment Date *
            </label>
            <input
              type="date"
              name="payment_date"
              value={formData.payment_date}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Payment Method *
            </label>
            <select
              name="payment_method"
              value={formData.payment_method}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="Cash">Cash</option>
              <option value="Check">Check</option>
              <option value="Credit Card">Credit Card</option>
              <option value="Debit Card">Debit Card</option>
              <option value="Bank Transfer">Bank Transfer</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : 'Log Payment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
