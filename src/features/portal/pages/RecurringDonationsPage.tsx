import { useState, useEffect } from 'react'
import { Plus, Edit, X, DollarSign, Pause, Play, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/app/providers/AuthProvider'
import { useFunds } from '@/features/donations/hooks/useFunds'

interface RecurringDonation {
  id: string
  fund_id: string | null
  amount: number
  frequency: 'monthly' | 'yearly'
  start_date: string
  end_date: string | null
  payment_method: string
  notes: string | null
  status: 'active' | 'paused' | 'cancelled' | 'completed'
  next_payment_date: string | null
  total_payments: number
  stripe_subscription_id: string | null
  funds?: { id: string; name: string }
}

interface FormData {
  fund_id: string
  amount: string
  frequency: 'monthly' | 'yearly'
  start_date: string
  end_date: string
  payment_method: string
  notes: string
}

export default function RecurringDonationsPage() {
  const { currentOrganizationId } = useOrganization()
  const { user } = useAuth()
  const { funds } = useFunds({ organizationId: currentOrganizationId })
  const [loading, setLoading] = useState(true)
  const [recurringDonations, setRecurringDonations] = useState<RecurringDonation[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDonation, setSelectedDonation] = useState<RecurringDonation | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    fund_id: '',
    amount: '',
    frequency: 'monthly',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    payment_method: 'Credit Card',
    notes: '',
  })

  useEffect(() => {
    if (user && currentOrganizationId) {
      fetchMemberAndDonations()
    }
  }, [user, currentOrganizationId])

  const fetchMemberAndDonations = async () => {
    try {
      setLoading(true)

      if (!user || !currentOrganizationId) return

      // Get current member via organization_members -> member_id join
      const { data: orgMember, error: memberError } = await supabase
        .from('organization_members')
        .select('id, member_id')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (memberError) throw memberError
      if (!orgMember || !orgMember.member_id) return

      setMemberId(orgMember.member_id)

      // Fetch recurring donations
      const { data, error } = await supabase
        .from('recurring_donations')
        .select(`
          *,
          funds:fund_id (id, name)
        `)
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

      if (error) {
        // Check if table doesn't exist
        const errorMessage = error.message || ''
        const isTableMissing =
          error.code === '42P01' ||
          error.code === 'PGRST116' ||
          errorMessage.toLowerCase().includes('does not exist')

        if (isTableMissing) {
          console.warn('Recurring donations table does not exist.')
          setRecurringDonations([])
          return
        }
        throw error
      }

      setRecurringDonations((data || []) as RecurringDonation[])
    } catch (error) {
      console.error('Error fetching recurring donations:', error)
      setRecurringDonations([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      fund_id: '',
      amount: '',
      frequency: 'monthly',
      start_date: new Date().toISOString().split('T')[0],
      end_date: '',
      payment_method: 'Credit Card',
      notes: '',
    })
    setIsModalOpen(true)
  }

  const handleEdit = (donation: RecurringDonation) => {
    setSelectedDonation(donation)
    setFormData({
      fund_id: donation.fund_id || '',
      amount: donation.amount?.toString() || '',
      frequency: donation.frequency || 'monthly',
      start_date: donation.start_date || new Date().toISOString().split('T')[0],
      end_date: donation.end_date || '',
      payment_method: donation.payment_method || 'Credit Card',
      notes: donation.notes || '',
    })
    setIsEditModalOpen(true)
  }

  const calculateNextPaymentDate = (startDate: string, frequency: 'monthly' | 'yearly', lastPaymentDate: string | null = null) => {
    const start = new Date(startDate)
    const last = lastPaymentDate ? new Date(lastPaymentDate) : start
    const next = new Date(last)

    if (frequency === 'monthly') {
      next.setMonth(next.getMonth() + 1)
    } else if (frequency === 'yearly') {
      next.setFullYear(next.getFullYear() + 1)
    }

    return next.toISOString().split('T')[0]
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!memberId || !currentOrganizationId) return

    setSubmitting(true)

    try {
      // Get member's household_id from members table
      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('household_id')
        .eq('id', memberId)
        .single()

      if (memberError || !member) {
        throw new Error('Could not find member information.')
      }

      const nextPaymentDate = calculateNextPaymentDate(formData.start_date, formData.frequency)

      const donationData = {
        member_id: memberId,
        household_id: member.household_id,
        organization_id: currentOrganizationId,
        fund_id: formData.fund_id || null,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        status: 'active',
        next_payment_date: nextPaymentDate,
        total_payments: 0,
      }

      const { error } = await supabase
        .from('recurring_donations')
        .insert([donationData])

      if (error) throw error

      setIsModalOpen(false)
      fetchMemberAndDonations()
    } catch (error) {
      console.error('Error creating recurring donation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedDonation) return

    setSubmitting(true)

    try {
      const updateData = {
        fund_id: formData.fund_id || null,
        amount: parseFloat(formData.amount),
        frequency: formData.frequency,
        start_date: formData.start_date,
        end_date: formData.end_date || null,
        payment_method: formData.payment_method,
        notes: formData.notes || null,
        updated_at: new Date().toISOString(),
      }

      const { error } = await supabase
        .from('recurring_donations')
        .update(updateData)
        .eq('id', selectedDonation.id)

      if (error) throw error

      setIsEditModalOpen(false)
      setSelectedDonation(null)
      fetchMemberAndDonations()
    } catch (error) {
      console.error('Error updating recurring donation:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleStatus = async (donation: RecurringDonation) => {
    try {
      const newStatus = donation.status === 'active' ? 'paused' : 'active'

      const { error } = await supabase
        .from('recurring_donations')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', donation.id)

      if (error) throw error

      fetchMemberAndDonations()
    } catch (error) {
      console.error('Error updating status:', error)
    }
  }

  const handleCancel = async (donation: RecurringDonation) => {
    if (!confirm('Are you sure you want to cancel this recurring donation?')) {
      return
    }

    try {
      const { error } = await supabase
        .from('recurring_donations')
        .update({ status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', donation.id)

      if (error) throw error

      fetchMemberAndDonations()
    } catch (error) {
      console.error('Error cancelling donation:', error)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      active: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
      paused: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      cancelled: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
      completed: 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300',
    }
    return badges[status as keyof typeof badges] || badges.active
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600 dark:text-slate-400">Loading...</div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
            Recurring Donations
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Set up and manage your monthly or yearly recurring donations
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={18} />
          Set Up Recurring Donation
        </button>
      </div>

      {recurringDonations.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
          <DollarSign className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Recurring Donations</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            Set up a recurring donation to automatically contribute to your mosque.
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            Set Up Your First Recurring Donation
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {recurringDonations.map((donation) => (
            <div
              key={donation.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(donation.amount)}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadge(donation.status)}`}>
                      {donation.status.charAt(0).toUpperCase() + donation.status.slice(1)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Frequency</p>
                      <p className="font-medium text-slate-900 dark:text-white capitalize">
                        {donation.frequency}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Fund</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {donation.funds?.name || 'General Fund'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Next Payment</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(donation.next_payment_date)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Total Payments</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {donation.total_payments || 0}
                      </p>
                    </div>
                  </div>

                  {donation.notes && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-3 italic">&quot;{donation.notes}&quot;</p>
                  )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2">
                  {(donation.status === 'active' || donation.status === 'paused') && (
                    <button
                      onClick={() => handleToggleStatus(donation)}
                      className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      title={donation.status === 'active' ? 'Pause' : 'Resume'}
                    >
                      {donation.status === 'active' ? (
                        <>
                          <Pause size={18} />
                          <span className="hidden sm:inline">Pause</span>
                        </>
                      ) : (
                        <>
                          <Play size={18} />
                          <span className="hidden sm:inline">Resume</span>
                        </>
                      )}
                    </button>
                  )}
                  {donation.status !== 'cancelled' && donation.status !== 'completed' && (
                    <>
                      <button
                        onClick={() => handleEdit(donation)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                      >
                        <Edit size={18} />
                        <span className="hidden sm:inline">Edit</span>
                      </button>
                      <button
                        onClick={() => handleCancel(donation)}
                        className="flex items-center justify-center gap-2 px-4 py-2 border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                      >
                        <X size={18} />
                        <span className="hidden sm:inline">Cancel</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {(isModalOpen || isEditModalOpen) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                  {isEditModalOpen ? 'Edit' : 'Set Up'} Recurring Donation
                </h2>
                <button
                  onClick={() => {
                    setIsModalOpen(false)
                    setIsEditModalOpen(false)
                    setSelectedDonation(null)
                  }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  disabled={submitting}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={isEditModalOpen ? handleUpdate : handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Fund <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.fund_id}
                  onChange={(e) => setFormData((prev) => ({ ...prev, fund_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={submitting}
                >
                  <option value="">Select a fund</option>
                  {funds.map((fund) => (
                    <option key={fund.id} value={fund.id}>
                      {fund.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-slate-500 dark:text-slate-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    value={formData.amount}
                    onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    placeholder="0.00"
                    required
                    disabled={submitting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Frequency <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.frequency}
                  onChange={(e) => setFormData((prev) => ({ ...prev, frequency: e.target.value as 'monthly' | 'yearly' }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={submitting}
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Start Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, start_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  End Date (Optional)
                </label>
                <input
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, end_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  disabled={submitting}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={3}
                  placeholder="Any additional notes..."
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsModalOpen(false)
                    setIsEditModalOpen(false)
                    setSelectedDonation(null)
                  }}
                  className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors font-medium"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Processing...
                    </>
                  ) : (
                    (isEditModalOpen ? 'Update' : 'Create') + ' Recurring Donation'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
