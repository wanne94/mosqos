import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../../../lib/supabase/client'
import { X, Calendar, DollarSign, CheckCircle, XCircle, Clock, Edit, Download } from 'lucide-react'
// import EditPaymentModal from './EditPaymentModal' // TODO: Migrate EditPaymentModal.jsx from MosqOS
import { exportToExcel } from '../utils/excelExport'
import { useEscapeKey } from '../../../shared/hooks/useEscapeKey'
import { useOrganization } from '../../../hooks/useOrganization'

interface StudentPaymentHistoryModalProps {
  isOpen: boolean
  onClose: () => void
  enrollmentId: string
  memberId: string
  classId?: string
  studentName: string
  className?: string
}

// Interface matching actual database schema
interface TuitionPaymentRecord {
  id: string
  enrollment_id: string
  payment_month: string // Format: "2024-01"
  amount: number
  final_amount: number | null
  payment_date: string | null
  status: string | null
  due_date: string
}

// UI-friendly interface for display
interface PaymentRecord {
  id: string
  enrollment_id: string
  month: number
  year: number
  amount_due: number
  amount_paid: number
  payment_status: string
  payment_date: string | null
  isPastMonth?: boolean
  isFutureMonth?: boolean
}

interface EnrollmentInfo {
  monthly_fee: number
  start_date: string
  end_date: string
}

// Helper to parse payment_month string to month/year
function parsePaymentMonth(paymentMonth: string): { month: number; year: number } {
  const [yearStr, monthStr] = paymentMonth.split('-')
  return {
    year: parseInt(yearStr, 10),
    month: parseInt(monthStr, 10),
  }
}

// Helper to convert DB record to UI record
function toPaymentRecord(dbRecord: TuitionPaymentRecord): PaymentRecord {
  const { month, year } = parsePaymentMonth(dbRecord.payment_month)
  return {
    id: dbRecord.id,
    enrollment_id: dbRecord.enrollment_id,
    month,
    year,
    amount_due: dbRecord.amount,
    amount_paid: dbRecord.final_amount ?? 0,
    payment_status: dbRecord.status || 'pending',
    payment_date: dbRecord.payment_date,
  }
}

export default function StudentPaymentHistoryModal({
  isOpen,
  onClose,
  enrollmentId,
  memberId: _memberId,
  classId: _classId,
  studentName,
  className: _className,
}: StudentPaymentHistoryModalProps) {
  const { t, i18n } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const currentLanguage = i18n.language || 'en'
  const [payments, setPayments] = useState<PaymentRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [enrollmentInfo, setEnrollmentInfo] = useState<EnrollmentInfo | null>(null)
  const [isEditPaymentModalOpen, setIsEditPaymentModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)

  useEscapeKey(onClose, { enabled: isOpen })

  useEffect(() => {
    if (isOpen && enrollmentId) {
      fetchPaymentHistory()
      fetchEnrollmentInfo()
    }
  }, [isOpen, enrollmentId])

  const fetchEnrollmentInfo = async () => {
    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          scheduled_class:scheduled_class_id (
            tuition_fee,
            start_date,
            end_date
          )
        `)
        .eq('id', enrollmentId)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (error) throw error

      type ScheduledClassData = {
        tuition_fee: number | null
        start_date: string | null
        end_date: string | null
      }

      const classData = (data as { scheduled_class: ScheduledClassData | null })?.scheduled_class
      setEnrollmentInfo({
        monthly_fee: classData?.tuition_fee || 0,
        start_date: classData?.start_date || new Date().toISOString().split('T')[0],
        end_date: classData?.end_date || new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      })
    } catch (error) {
      console.error('Error fetching enrollment info:', error)
    }
  }

  const fetchPaymentHistory = async () => {
    try {
      setLoading(true)

      // Fetch existing monthly payments using the correct schema
      const { data: existingPayments, error: paymentsError } = await supabase
        .from('tuition_monthly_payments')
        .select('id, enrollment_id, payment_month, amount, final_amount, payment_date, status, due_date')
        .eq('enrollment_id', enrollmentId)
        .eq('organization_id', currentOrganizationId)
        .order('payment_month', { ascending: false })

      if (paymentsError) throw paymentsError

      // Convert DB records to UI records
      const paymentRecords: PaymentRecord[] = (existingPayments || []).map(toPaymentRecord)

      // Sort by year and month descending
      paymentRecords.sort((a, b) => {
        if (a.year !== b.year) {
          return b.year - a.year
        }
        return b.month - a.month
      })

      setPayments(paymentRecords)
    } catch (error) {
      console.error('Error fetching payment history:', error)
      setPayments([])
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return t('common.notAvailable') || 'N/A'
    return new Date(dateString).toLocaleDateString(
      currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )
  }

  const formatCurrency = (amount: number | undefined) => {
    if (!amount && amount !== 0) return t('common.notAvailable') || 'N/A'
    return new Intl.NumberFormat(currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
    const monthIndex = month - 1 // month is 1-12, array index is 0-11
    return t(`common.months.${monthNames[monthIndex]}`) || monthNames[monthIndex]
  }

  const getPaymentStatusDisplay = (payment: PaymentRecord) => {
    const today = new Date()
    const paymentMonthDate = new Date(payment.year, payment.month - 1, 1)
    const lastDayOfMonth = new Date(payment.year, payment.month, 0)
    const isPastMonth = lastDayOfMonth < today
    const amountPaid = parseFloat(String(payment.amount_paid)) || 0
    const amountDue = parseFloat(String(payment.amount_due)) || 0
    const isFullyPaid = amountPaid >= amountDue

    if (isFullyPaid || payment.payment_status === 'paid') {
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200 flex items-center gap-1">
            <CheckCircle size={14} className="text-emerald-600 dark:text-emerald-400" />
            {t('common.paid') || 'Paid'}
          </span>
        </div>
      )
    }

    if (isPastMonth && amountPaid < amountDue) {
      return (
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 flex items-center gap-1">
            <XCircle size={14} className="text-red-600 dark:text-red-400" />
            {t('education.overdue') || 'Overdue'}
          </span>
        </div>
      )
    }

    return (
      <div className="flex items-center gap-2">
        <span className="px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200 flex items-center gap-1">
          <Clock size={14} className="text-yellow-600 dark:text-yellow-400" />
          {t('education.unpaid') || 'Unpaid'}
        </span>
      </div>
    )
  }

  const totalDue = payments.reduce((sum, p) => sum + (parseFloat(String(p.amount_due)) || 0), 0)
  const totalPaid = payments.reduce((sum, p) => sum + (parseFloat(String(p.amount_paid)) || 0), 0)
  const totalOutstanding = totalDue - totalPaid

  const handleExportToExcel = () => {
    if (payments.length === 0) {
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

    const getStatusText = (payment: PaymentRecord) => {
      if (parseFloat(String(payment.amount_paid)) >= parseFloat(String(payment.amount_due))) {
        return t('education.paid') || 'Paid'
      }
      if (payment.isPastMonth) {
        return t('education.overdue') || 'Overdue'
      }
      return t('education.unpaid') || 'Unpaid'
    }

    const columns = [
      { key: 'month', label: t('education.month') || 'Month' },
      { key: 'amountDue', label: t('education.amountDue') || 'Amount Due' },
      { key: 'amountPaid', label: t('education.amountPaid') || 'Amount Paid' },
      { key: 'status', label: t('education.status') || 'Status' },
      { key: 'paymentDate', label: t('education.paymentDate') || 'Payment Date' },
    ]

    const exportData = payments.map((payment) => ({
      month: `${monthNames[payment.month - 1]} ${payment.year}`,
      amountDue: formatCurrency(payment.amount_due),
      amountPaid: formatCurrency(payment.amount_paid),
      status: getStatusText(payment),
      paymentDate: payment.payment_date ? formatDate(payment.payment_date) : '',
    }))

    const filename = `payment_history_${studentName?.replace(/\s+/g, '_') || 'student'}`

    exportToExcel(exportData, columns, filename)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800 z-10">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-gray-100">
              {t('education.paymentHistory') || 'Payment History'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-gray-400 mt-1">{studentName}</p>
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
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-slate-50 dark:bg-gray-700/50 rounded-lg p-4 border border-slate-200 dark:border-gray-600">
                  <div className="flex items-center gap-2 mb-2">
                    <DollarSign className="text-slate-600 dark:text-gray-400" size={20} />
                    <h3 className="text-sm font-medium text-slate-700 dark:text-gray-300">
                      {t('education.totalDue') || 'Total Due'}
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-gray-100">{formatCurrency(totalDue)}</p>
                </div>
                <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="text-emerald-600 dark:text-emerald-400" size={20} />
                    <h3 className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                      {t('education.totalPaid') || 'Total Paid'}
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">{formatCurrency(totalPaid)}</p>
                </div>
                <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="text-red-600 dark:text-red-400" size={20} />
                    <h3 className="text-sm font-medium text-red-700 dark:text-red-300">
                      {t('education.outstanding') || 'Outstanding'}
                    </h3>
                  </div>
                  <p className="text-2xl font-bold text-red-900 dark:text-red-100">{formatCurrency(totalOutstanding)}</p>
                </div>
              </div>

              {/* Payment History Table */}
              {payments.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="mx-auto text-slate-400 dark:text-gray-500 mb-4" size={48} />
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100 mb-2">
                    {t('education.noPayments') || 'No Payments'}
                  </h3>
                  <p className="text-slate-600 dark:text-gray-400">
                    {t('education.noPaymentsDescription') || 'No payment records found'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-gray-100">
                      {t('education.paymentsList') || 'Payment Records'}
                    </h3>
                    <button
                      onClick={handleExportToExcel}
                      className="p-2 bg-white dark:bg-gray-700 border border-slate-300 dark:border-gray-600 rounded-lg hover:bg-slate-50 dark:hover:bg-gray-600 transition-colors"
                      title={t('common.exportToExcel') || 'Export to Excel'}
                    >
                      <Download size={18} className="text-slate-700 dark:text-gray-300" />
                    </button>
                  </div>
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-200 dark:border-gray-700">
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.month') || 'Month'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.amountDue') || 'Amount Due'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.amountPaid') || 'Amount Paid'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.status') || 'Status'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('education.paymentDate') || 'Payment Date'}
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-slate-700 dark:text-gray-300">
                          {t('common.actions') || 'Actions'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((payment) => (
                        <tr
                          key={payment.id}
                          className="border-b border-slate-100 dark:border-gray-700 hover:bg-slate-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-2">
                              <Calendar className="text-slate-400 dark:text-gray-500" size={16} />
                              <span className="font-medium text-slate-900 dark:text-gray-100">
                                {getMonthName(payment.month)} {payment.year}
                              </span>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-slate-700 dark:text-gray-300">
                            {formatCurrency(payment.amount_due)}
                          </td>
                          <td className="py-4 px-4">
                            <span
                              className={`font-medium ${
                                parseFloat(String(payment.amount_paid)) > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-slate-400 dark:text-gray-500'
                              }`}
                            >
                              {formatCurrency(payment.amount_paid)}
                            </span>
                            {parseFloat(String(payment.amount_paid)) < parseFloat(String(payment.amount_due)) && (
                              <div className="text-xs text-red-600 dark:text-red-400 mt-1">
                                Outstanding:{' '}
                                {formatCurrency(
                                  parseFloat(String(payment.amount_due)) - parseFloat(String(payment.amount_paid))
                                )}
                              </div>
                            )}
                          </td>
                          <td className="py-4 px-4">{getPaymentStatusDisplay(payment)}</td>
                          <td className="py-4 px-4 text-sm text-slate-600 dark:text-gray-400">
                            {payment.payment_date ? formatDate(payment.payment_date) : '-'}
                          </td>
                          <td className="py-4 px-4">
                            <button
                              onClick={() => {
                                setSelectedPayment(payment)
                                setIsEditPaymentModalOpen(true)
                              }}
                              className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 flex items-center gap-1"
                              title={t('education.editPayment') || 'Edit Payment'}
                            >
                              <Edit size={16} />
                            </button>
                          </td>
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

      {/* TODO: Uncomment when EditPaymentModal is migrated */}
      {/* <EditPaymentModal
        isOpen={isEditPaymentModalOpen}
        onClose={() => {
          setIsEditPaymentModalOpen(false)
          setSelectedPayment(null)
        }}
        onSave={() => {
          fetchPaymentHistory()
        }}
        payment={selectedPayment}
        enrollmentId={enrollmentId}
        memberId={memberId}
        studentName={studentName}
      /> */}
    </div>
  )
}
