import { useState, useEffect } from 'react'
import { DollarSign, Calendar, Receipt } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'

interface Donation {
  id: string
  amount: number
  payment_method: string | null
  donation_date: string | null
  created_at: string
  funds: {
    id: string
    name: string
  } | null
}

interface DonationsSummary {
  totalDonations: number
  totalZakat: number
  totalSadaqah: number
  donationCount: number
}

interface DonationsTabProps {
  memberId: string
}

export function DonationsTab({ memberId }: DonationsTabProps) {
  const { currentOrganization } = useOrganization()
  const [donations, setDonations] = useState<Donation[]>([])
  const [loading, setLoading] = useState(true)
  const [summary, setSummary] = useState<DonationsSummary>({
    totalDonations: 0,
    totalZakat: 0,
    totalSadaqah: 0,
    donationCount: 0,
  })

  useEffect(() => {
    if (memberId && currentOrganization) {
      fetchDonations()
    }
  }, [memberId, currentOrganization])

  const fetchDonations = async () => {
    if (!currentOrganization) return

    try {
      setLoading(true)

      const { data: member, error: memberError } = await supabase
        .from('members')
        .select('household_id')
        .eq('id', memberId)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle()

      if (memberError) {
        console.error('Error fetching member:', memberError)
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const householdId = (member && typeof member === 'object') ? (member as any).household_id as string | null : null

      let query = supabase
        .from('donations')
        .select(`
          *,
          funds:fund_id (
            id,
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('member_id', memberId)

      if (householdId) {
        query = supabase
          .from('donations')
          .select(`
            *,
            funds:fund_id (
              id,
              name
            )
          `)
          .eq('organization_id', currentOrganization.id)
          .or(`member_id.eq.${memberId},household_id.eq.${householdId}`)
      }

      const { data, error } = await query

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const uniqueDonations = (data as any[] || []).filter(
        (donation: any, index: number, self: any[]) => index === self.findIndex((d: any) => d.id === donation.id)
      )

      const sortedDonations = uniqueDonations.sort((a: any, b: any) => {
        const dateA = a.donation_date ? new Date(a.donation_date) : new Date(a.created_at || 0)
        const dateB = b.donation_date ? new Date(b.donation_date) : new Date(b.created_at || 0)
        return dateB.getTime() - dateA.getTime()
      })

      setDonations(sortedDonations as Donation[])

      const total = uniqueDonations.reduce((sum: number, donation: any) => sum + (parseFloat(String(donation.amount)) || 0), 0)
      const zakat = uniqueDonations
        .filter((d: any) => d.funds?.name?.toLowerCase().includes('zakat'))
        .reduce((sum: number, donation: any) => sum + (parseFloat(String(donation.amount)) || 0), 0)
      const sadaqah = uniqueDonations
        .filter((d: any) => d.funds?.name?.toLowerCase().includes('sadaqah'))
        .reduce((sum: number, donation: any) => sum + (parseFloat(String(donation.amount)) || 0), 0)

      setSummary({
        totalDonations: total,
        totalZakat: zakat,
        totalSadaqah: sadaqah,
        donationCount: uniqueDonations.length,
      })
    } catch (err) {
      console.error('Error fetching donations:', err)
      setDonations([])
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0.00'
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

  if (loading) {
    return (
      <div className="p-6 text-center text-slate-600 dark:text-slate-400">Loading donations...</div>
    )
  }

  return (
    <div className="p-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800">
          <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 mb-1">
            <DollarSign size={18} />
            <span className="text-sm font-medium">Total Contributions</span>
          </div>
          <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-100">
            {formatCurrency(summary.totalDonations)}
          </div>
        </div>
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
          <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 mb-1">
            <Receipt size={18} />
            <span className="text-sm font-medium">Zakat</span>
          </div>
          <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(summary.totalZakat)}
          </div>
        </div>
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 mb-1">
            <Receipt size={18} />
            <span className="text-sm font-medium">Sadaqah</span>
          </div>
          <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
            {formatCurrency(summary.totalSadaqah)}
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 mb-1">
            <Calendar size={18} />
            <span className="text-sm font-medium">Total Donations</span>
          </div>
          <div className="text-2xl font-bold text-slate-900 dark:text-slate-100">{summary.donationCount}</div>
        </div>
      </div>

      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Donation History</h3>
        <p className="text-sm text-slate-600 dark:text-slate-400">Complete history of all donations</p>
      </div>

      {/* Donations List */}
      {donations.length === 0 ? (
        <div className="bg-slate-50 dark:bg-slate-900/20 rounded-lg p-12 text-center border border-slate-200 dark:border-slate-700">
          <DollarSign className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">No donations yet</h3>
          <p className="text-slate-600 dark:text-slate-400">Your donation history will appear here</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Fund
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    Payment Method
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {donations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100">
                      {formatDate(donation.donation_date || donation.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {donation.funds?.name || 'General Fund'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(donation.amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                      {donation.payment_method || 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
