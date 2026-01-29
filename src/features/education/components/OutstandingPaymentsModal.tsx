import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X, Calendar, DollarSign, User, AlertCircle, Download } from 'lucide-react'
import { exportToExcel } from '../utils/excelExport'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'

interface OutstandingPaymentsModalProps {
  isOpen: boolean
  onClose: () => void
  type: 'outstanding' | 'collected'
}

interface PaymentRecord {
  enrollmentId: string
  memberId: string
  studentName: string
  month: number
  year: number
  amountDue: number
  amountPaid: number
  outstanding?: number
  paymentStatus: string
  isPastMonth: boolean
  isFutureMonth: boolean
  paymentDate?: string | null
}

export default function OutstandingPaymentsModal({
  isOpen,
  onClose,
  type,
}: OutstandingPaymentsModalProps) {
  const { t, i18n } = useTranslation()
  const currentLanguage = i18n.language || 'en'
  const [unpaidPayments, setUnpaidPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEscapeKey(onClose, { enabled: isOpen })

  useEffect(() => {
    if (isOpen) {
      fetchOutstandingPayments()
    }
  }, [isOpen, type])

  const fetchOutstandingPayments = async () => {
    try {
      setLoading(true)

      // Fetch all enrollments with member info
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('enrollments')
        .select(`
          id,
          member_id,
          monthly_fee,
          start_date,
          end_date,
          organization_members:member_id (
            id,
            first_name,
            last_name
          )
        `)

      if (enrollmentsError) throw enrollmentsError

      // Fetch all monthly payments (handle case where table doesn't exist)
      let allPayments: any[] = []
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('tuition_monthly_payments')
        .select('*')
        .order('year', { ascending: false })
        .order('month', { ascending: false })

      if (paymentsError) {
        // If table doesn't exist, just use empty array
        if (paymentsError.code === 'PGRST205' || paymentsError.message?.includes('Could not find the table')) {
          console.warn('tuition_monthly_payments table not found, showing unpaid based on enrollments only')
          allPayments = []
        } else {
          throw paymentsError
        }
      } else {
        allPayments = paymentsData || []
      }

      // Process payments
      const today = new Date()
      const unpaidList: PaymentRecord[] = []

      enrollments?.forEach((enrollment: any) => {
        const monthlyFee = parseFloat(enrollment.monthly_fee) || 0
        const enrollmentStartDate = enrollment.start_date ? new Date(enrollment.start_date) : null
        const enrollmentEndDate = enrollment.end_date ? new Date(enrollment.end_date) : null

        // If no dates but has existing payments, check those payments
        if (!enrollmentStartDate || !enrollmentEndDate) {
          if (type === 'outstanding') {
            const enrollmentPayments = allPayments?.filter((p) => p.enrollment_id === enrollment.id) || []
            enrollmentPayments.forEach((payment) => {
              const amountPaid = parseFloat(payment.amount_paid) || 0
              const amountDue = parseFloat(payment.amount_due) || monthlyFee
              if (amountPaid < amountDue) {
                const monthDate = new Date(payment.year, payment.month - 1, 1)
                const lastDayOfMonth = new Date(payment.year, payment.month, 0)
                const isPastMonth = lastDayOfMonth < today
                unpaidList.push({
                  enrollmentId: enrollment.id,
                  memberId: enrollment.member_id,
                  studentName: enrollment.organization_members
                    ? `${enrollment.organization_members.first_name} ${enrollment.organization_members.last_name}`
                    : t('education.defaultStudent') || 'Student',
                  month: payment.month,
                  year: payment.year,
                  amountDue,
                  amountPaid,
                  outstanding: amountDue - amountPaid,
                  paymentStatus: payment.payment_status || 'Unpaid',
                  isPastMonth,
                  isFutureMonth: monthDate > today,
                  paymentDate: payment.payment_date || null,
                })
              }
            })
          }
          return
        }

        // Skip if no monthly fee and no existing payments
        if (monthlyFee === 0) {
          // Still check existing payments
          if (type === 'outstanding') {
            const enrollmentPayments = allPayments?.filter((p) => p.enrollment_id === enrollment.id) || []
            enrollmentPayments.forEach((payment) => {
              const amountPaid = parseFloat(payment.amount_paid) || 0
              const amountDue = parseFloat(payment.amount_due) || 0
              if (amountPaid < amountDue) {
                const monthDate = new Date(payment.year, payment.month - 1, 1)
                const lastDayOfMonth = new Date(payment.year, payment.month, 0)
                const isPastMonth = lastDayOfMonth < today
                unpaidList.push({
                  enrollmentId: enrollment.id,
                  memberId: enrollment.member_id,
                  studentName: enrollment.organization_members
                    ? `${enrollment.organization_members.first_name} ${enrollment.organization_members.last_name}`
                    : t('education.defaultStudent') || 'Student',
                  month: payment.month,
                  year: payment.year,
                  amountDue,
                  amountPaid,
                  outstanding: amountDue - amountPaid,
                  paymentStatus: payment.payment_status || 'Unpaid',
                  isPastMonth,
                  isFutureMonth: monthDate > today,
                  paymentDate: payment.payment_date || null,
                })
              }
            })
          }
          return
        }

        // Generate all months between start and end date
        let currentMonth = new Date(enrollmentStartDate.getFullYear(), enrollmentStartDate.getMonth(), 1)
        const endMonth = new Date(enrollmentEndDate.getFullYear(), enrollmentEndDate.getMonth(), 1)
        const todayMonth = new Date(today.getFullYear(), today.getMonth(), 1)

        // For outstanding payments, only show up to today (overdue payments only)
        const limitMonth = type === 'outstanding' ? new Date(Math.min(endMonth.getTime(), todayMonth.getTime())) : endMonth

        while (currentMonth <= limitMonth) {
          const month = currentMonth.getMonth() + 1
          const year = currentMonth.getFullYear()

          // Find payment for this month
          const payment = allPayments?.find((p) => p.enrollment_id === enrollment.id && p.month === month && p.year === year)

          const monthDate = new Date(year, month - 1, 1)
          const lastDayOfMonth = new Date(year, month, 0)
          const isPastMonth = lastDayOfMonth < today
          const isFutureMonth = monthDate > today

          if (type === 'outstanding') {
            // Show only overdue payments (past months only, no future months)
            const amountPaid = payment ? parseFloat(payment.amount_paid) || 0 : 0
            const amountDue = payment ? parseFloat(payment.amount_due) || monthlyFee : monthlyFee

            // Only include overdue months (past months with unpaid amounts)
            if (amountPaid < amountDue && isPastMonth) {
              unpaidList.push({
                enrollmentId: enrollment.id,
                memberId: enrollment.member_id,
                studentName: enrollment.organization_members
                  ? `${enrollment.organization_members.first_name} ${enrollment.organization_members.last_name}`
                  : t('education.defaultStudent') || 'Student',
                month,
                year,
                amountDue,
                amountPaid,
                outstanding: amountDue - amountPaid,
                paymentStatus: payment?.payment_status || 'Unpaid',
                isPastMonth: true,
                isFutureMonth: false,
                paymentDate: payment?.payment_date || null,
              })
            }
          } else if (type === 'collected') {
            // Show only paid months (only within enrollment period)
            if (payment && payment.payment_status === 'Paid') {
              unpaidList.push({
                enrollmentId: enrollment.id,
                memberId: enrollment.member_id,
                studentName: enrollment.organization_members
                  ? `${enrollment.organization_members.first_name} ${enrollment.organization_members.last_name}`
                  : t('education.defaultStudent') || 'Student',
                month,
                year,
                amountDue: parseFloat(payment.amount_due) || monthlyFee,
                amountPaid: parseFloat(payment.amount_paid) || 0,
                paymentStatus: payment.payment_status,
                isPastMonth,
                isFutureMonth,
                paymentDate: payment.payment_date || null,
              })
            }
          }

          currentMonth.setMonth(currentMonth.getMonth() + 1)
        }
      })

      // Sort: past months first (most overdue first), then current month, then future months
      unpaidList.sort((a, b) => {
        // Past months come first
        if (a.isPastMonth && !b.isPastMonth) return -1
        if (!a.isPastMonth && b.isPastMonth) return 1

        // Within same category (past/current/future), sort by year/month descending (newest first)
        if (a.year !== b.year) {
          return b.year - a.year
        }
        return b.month - a.month
      })

      console.log('Outstanding payments found:', unpaidList.length)
      console.log('Enrollments processed:', enrollments?.length || 0)
      console.log('All payments found:', allPayments?.length || 0)

      setUnpaidPayments(unpaidList)
    } catch (error) {
      console.error('Error fetching outstanding payments:', error)
      setUnpaidPayments([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return t('common.notAvailable') || 'N/A'
    return new Intl.NumberFormat(currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-'
    return new Date(dateString).toLocaleDateString(
      currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )
  }

  const getMonthName = (month: number) => {
    const monthNames = [
      'january',
      'february',
      'march',
      'april',
      'may',
      'june',
      'july',
      'august',
      'september',
      'october',
      'november',
      'december',
    ]
    const monthIndex = month - 1
    return t(`common.months.${monthNames[monthIndex]}`) || monthNames[monthIndex]
  }

  const getStatusBadge = (payment: PaymentRecord) => {
    if (type === 'collected') {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 flex items-center gap-1">
          <span className="w-2 h-2 bg-emerald-600 rounded-full"></span>
          {t('common.paid') || 'Paid'}
        </span>
      )
    }

    if (payment.isPastMonth) {
      return (
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 flex items-center gap-1">
          <AlertCircle size={14} className="text-red-600 dark:text-red-400" />
          {t('education.overdue') || 'Overdue'}
        </span>
      )
    }

    return (
      <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 flex items-center gap-1">
        <span className="w-2 h-2 bg-yellow-600 rounded-full"></span>
        {t('education.unpaid') || 'Unpaid'}
      </span>
    )
  }

  const totalAmount = unpaidPayments.reduce((sum, p) => {
    return sum + (type === 'collected' ? p.amountPaid : p.outstanding || p.amountDue - p.amountPaid)
  }, 0)

  const handleExportToExcel = () => {
    if (unpaidPayments.length === 0) {
      return
    }

    const monthNames = [
      t('common.months.january'),
      t('common.months.february'),
      t('common.months.march'),
      t('common.months.april'),
      t('common.months.may'),
      t('common.months.june'),
      t('common.months.july'),
      t('common.months.august'),
      t('common.months.september'),
      t('common.months.october'),
      t('common.months.november'),
      t('common.months.december'),
    ]

    const columns = [
      { key: 'studentName', label: t('education.student') || 'Student' },
      { key: 'monthYear', label: t('education.month') || 'Month' },
      { key: 'amountDue', label: t('education.amountDue') || 'Amount Due' },
      { key: 'amountPaid', label: t('education.amountPaid') || 'Amount Paid' },
      { key: 'status', label: t('education.status') || 'Status' },
      { key: 'paymentDate', label: t('education.paymentDate') || 'Payment Date' },
    ]

    const exportData = unpaidPayments.map((payment) => ({
      studentName: payment.studentName || '',
      monthYear: `${monthNames[payment.month - 1]} ${payment.year}`,
      amountDue: formatCurrency(payment.amountDue),
      amountPaid: formatCurrency(payment.amountPaid),
      status: payment.isPastMonth
        ? t('education.overdue') || 'Overdue'
        : parseFloat(String(payment.amountPaid)) >= parseFloat(String(payment.amountDue))
          ? t('education.paid') || 'Paid'
          : t('education.unpaid') || 'Unpaid',
      paymentDate: payment.paymentDate ? formatDate(payment.paymentDate) : '',
    }))

    const filename = type === 'outstanding' ? 'outstanding_payments' : 'collected_payments'

    exportToExcel(exportData, columns, filename)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100">
              {type === 'outstanding'
                ? t('education.outstandingPayments') || 'Outstanding Payments'
                : t('education.collectedPayments') || 'Collected Payments'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">
              {type === 'outstanding'
                ? t('education.outstandingPaymentsDescription') || 'View all overdue tuition payments'
                : t('education.collectedPaymentsDescription') || 'View all collected tuition payments'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-600 dark:text-gray-400">
              {t('common.loading') || 'Loading'}...
            </div>
          ) : (
            <>
              {/* Summary */}
              <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-4 mb-6 border border-slate-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {type === 'outstanding'
                        ? t('education.totalOutstanding') || 'Total Outstanding'
                        : t('education.totalCollected') || 'Total Collected'}
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        type === 'outstanding' ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {formatCurrency(totalAmount)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-slate-600 dark:text-gray-400">
                      {t('education.totalRecords') || 'Total Records'}
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">{unpaidPayments.length}</p>
                  </div>
                </div>
              </div>

              {/* Payments Table */}
              {unpaidPayments.length === 0 ? (
                <div className="text-center py-8">
                  <DollarSign className="mx-auto text-slate-400 dark:text-gray-500 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">
                    {type === 'outstanding'
                      ? t('education.noOutstandingPayments') || 'No Outstanding Payments'
                      : t('education.noCollectedPayments') || 'No Collected Payments'}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    {type === 'outstanding'
                      ? t('education.noOutstandingPaymentsDescription') || 'All tuition payments are up to date'
                      : t('education.noCollectedPaymentsDescription') || 'No payments have been collected yet'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-center justify-end mb-4">
                    <button
                      onClick={handleExportToExcel}
                      className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
                      title={t('common.exportToExcel') || 'Export to Excel'}
                    >
                      <Download size={18} className="text-slate-700 dark:text-gray-300" />
                      {t('common.exportToExcel') || 'Export to Excel'}
                    </button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.student') || 'Student'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.month') || 'Month'}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.amountDue') || 'Amount Due'}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.amountPaid') || 'Amount Paid'}
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.outstanding') || 'Outstanding'}
                        </th>
                        <th className="text-center py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.status') || 'Status'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {unpaidPayments.map((payment, index) => (
                        <tr
                          key={`${payment.enrollmentId}-${payment.month}-${payment.year}-${index}`}
                          className="border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <User className="text-slate-400 dark:text-gray-500" size={16} />
                              <span className="font-medium text-slate-900 dark:text-gray-100">{payment.studentName}</span>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-slate-400 dark:text-gray-500" size={16} />
                              <span className="text-slate-700 dark:text-gray-300">
                                {getMonthName(payment.month)} {payment.year}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-right text-slate-700 dark:text-gray-300">
                            {formatCurrency(payment.amountDue)}
                          </td>
                          <td className="py-4 px-4 text-right text-slate-700 dark:text-gray-300">
                            {formatCurrency(payment.amountPaid)}
                          </td>
                          <td className="py-4 px-4 text-right font-semibold text-red-600 dark:text-red-400">
                            {formatCurrency(payment.outstanding || payment.amountDue - payment.amountPaid)}
                          </td>
                          <td className="py-4 px-4 text-center">{getStatusBadge(payment)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
