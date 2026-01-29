import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Plus, Heart, FileText, User, DollarSign, Briefcase, Receipt, Repeat, HelpCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/app/providers/AuthProvider'
import { DonateModal } from '@/features/donations/components/DonateModal'

interface DashboardStats {
  memberName: string
  totalContributions: number
  activePledges: number
}

export default function DashboardPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentOrganizationId } = useOrganization()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    memberName: '',
    totalContributions: 0,
    activePledges: 0,
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)

  useEffect(() => {
    if (user && currentOrganizationId) {
      fetchMemberDashboardData()
    }
  }, [user, currentOrganizationId])

  // Handle payment success callback
  useEffect(() => {
    const paymentStatus = searchParams.get('payment')
    const sessionId = searchParams.get('session_id')

    if (paymentStatus === 'success' && sessionId) {
      handlePaymentSuccess(sessionId)
      navigate('/portal/dashboard', { replace: true })
    } else if (paymentStatus === 'cancelled') {
      navigate('/portal/dashboard', { replace: true })
    }
  }, [searchParams, navigate])

  const handlePaymentSuccess = async (sessionId: string) => {
    try {
      // Verify payment - this would need to be implemented
      console.log('Payment verified:', sessionId)
      fetchMemberDashboardData()
    } catch (error) {
      console.error('Error verifying payment:', error)
    }
  }

  const fetchMemberDashboardData = async () => {
    try {
      setLoading(true)

      if (!user || !currentOrganizationId) return

      // Get current member based on user
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('id, first_name, last_name')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (memberError) throw memberError
      if (!member) return

      setMemberId(member.id)
      setStats((prev) => ({
        ...prev,
        memberName: `${member.first_name} ${member.last_name}`,
      }))

      // Fetch member's donations
      const { data: donations, error: donationsError } = await supabase
        .from('donations')
        .select('amount')
        .eq('member_id', member.id)

      if (!donationsError && donations) {
        const total = donations.reduce((sum, d) => sum + (parseFloat(String(d.amount)) || 0), 0)
        setStats((prev) => ({ ...prev, totalContributions: total }))
      }

      // For now, set pledges to 0 (can be implemented later)
      setStats((prev) => ({ ...prev, activePledges: 0 }))
    } catch (error) {
      console.error('Error fetching member dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
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
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">
          Salaam, {stats.memberName || 'Member'}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
          Welcome to your member portal
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
        {/* My Total Contributions */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Total Contributions
            </h3>
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
              <Heart className="text-emerald-600 dark:text-emerald-400" size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(stats.totalContributions)}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Lifetime giving</p>
        </div>

        {/* My Active Pledges */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-slate-900 dark:text-white">
              Active Pledges
            </h3>
            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg">
              <FileText className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-blue-600 dark:text-blue-400">
            {formatCurrency(stats.activePledges)}
          </p>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2">Outstanding commitments</p>
        </div>
      </div>

      {/* New Donation Button */}
      <div className="flex justify-center mb-6 sm:mb-8">
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-semibold text-base sm:text-lg shadow-lg hover:shadow-xl"
        >
          <Plus size={20} />
          <span>New Donation</span>
        </button>
      </div>

      {/* Quick Navigation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <button
          onClick={() => navigate('/portal/profile')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg group-hover:bg-emerald-200 dark:group-hover:bg-emerald-900/50 transition-colors">
              <User className="text-emerald-600 dark:text-emerald-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                My Profile
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">View & edit profile</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/portal/profile?tab=donations')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
              <DollarSign className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                My Contributions
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">View donation history</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/portal/recurring-donations')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
              <Repeat className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Recurring Donations
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Manage monthly/yearly donations</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/portal/documents')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-amber-100 dark:bg-amber-900/30 p-3 rounded-lg group-hover:bg-amber-200 dark:group-hover:bg-amber-900/50 transition-colors">
              <Receipt className="text-amber-600 dark:text-amber-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Tax Receipts
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Download receipts & documents</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/portal/cases')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-3 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
              <Briefcase className="text-orange-600 dark:text-orange-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                My Cases
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Request assistance & view cases</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => navigate('/portal/contact')}
          className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6 hover:shadow-md hover:border-emerald-300 dark:hover:border-emerald-600 transition-all text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="bg-indigo-100 dark:bg-indigo-900/30 p-3 rounded-lg group-hover:bg-indigo-200 dark:group-hover:bg-indigo-900/50 transition-colors">
              <HelpCircle className="text-indigo-600 dark:text-indigo-400" size={24} />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                Contact & Support
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400">Contact admin, submit feedback</p>
            </div>
          </div>
        </button>
      </div>

      {memberId && (
        <DonateModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => {
            fetchMemberDashboardData()
            setIsModalOpen(false)
          }}
          prefillMemberId={memberId}
        />
      )}
    </div>
  )
}
