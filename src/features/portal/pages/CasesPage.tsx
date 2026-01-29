import { useState, useEffect } from 'react'
import { Plus, FileText, X, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/app/providers/AuthProvider'
import { CaseStatus } from '@/features/cases/types/cases.types'

interface Case {
  id: string
  category: string
  case_type: string | null
  requested_amount: number | null
  status: string
  notes: string | null
  notes_thread: NotesThreadItem[]
  created_at: string
  assistance_date: string | null
}

interface NotesThreadItem {
  message: string
  created_at: string
  created_by: string
  created_by_name: string
  created_by_type: 'admin' | 'member'
}

interface FormData {
  category: string
  notes: string
  assistance_date: string
}

const categories = [
  'Financial Assistance (Zakat)',
  'Food Pantry',
  'Housing',
  'Medical',
  'Marriage (Nikkah)',
  'Funeral (Janazah)',
  'Education',
  'Counseling',
]

export default function CasesPage() {
  const { currentOrganizationId } = useOrganization()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [cases, setCases] = useState<Case[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [memberId, setMemberId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    category: 'Financial Assistance (Zakat)',
    notes: '',
    assistance_date: new Date().toISOString().split('T')[0],
  })

  useEffect(() => {
    if (user && currentOrganizationId) {
      fetchCases()
    }
  }, [user, currentOrganizationId])

  const fetchCases = async () => {
    try {
      setLoading(true)

      if (!user || !currentOrganizationId) return

      // Get current member
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('id')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (memberError) throw memberError
      if (!member) return

      setMemberId(member.id)

      // Fetch member's cases
      const { data, error } = await supabase
        .from('service_cases')
        .select('*')
        .eq('member_id', member.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      setCases((data || []) as Case[])
    } catch (error) {
      console.error('Error fetching cases:', error)
      setCases([])
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setFormData({
      category: 'Financial Assistance (Zakat)',
      notes: '',
      assistance_date: new Date().toISOString().split('T')[0],
    })
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!memberId || !currentOrganizationId || !user) return

    setSubmitting(true)

    try {
      // Get member's household_id
      const { data: member, error: memberError } = await supabase
        .from('organization_members')
        .select('household_id, first_name, last_name')
        .eq('id', memberId)
        .single()

      if (memberError || !member) {
        throw new Error('Could not find member information.')
      }

      // Initialize notes thread with member's message
      let initialNotesThread: NotesThreadItem[] = []

      if (formData.notes) {
        const authorName = `${member.first_name} ${member.last_name}`

        initialNotesThread = [
          {
            message: formData.notes,
            created_at: new Date().toISOString(),
            created_by: user.id,
            created_by_name: authorName,
            created_by_type: 'member',
          },
        ]
      }

      const caseData = {
        member_id: memberId,
        organization_id: currentOrganizationId,
        category: formData.category,
        case_type: null,
        requested_amount: null,
        status: CaseStatus.OPEN,
        notes: formData.notes || null,
        notes_thread: initialNotesThread,
        assistance_date: formData.assistance_date || new Date().toISOString().split('T')[0],
        household_id: member.household_id,
      }

      const { error } = await supabase.from('service_cases').insert([caseData])

      if (error) throw error

      setIsModalOpen(false)
      fetchCases()
    } catch (error) {
      console.error('Error creating case:', error)
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatCurrency = (amount: number | null) => {
    if (!amount) return 'N/A'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      'Financial Assistance (Zakat)': 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
      'Food Pantry': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
      Housing: 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
      Medical: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
      'Marriage (Nikkah)': 'bg-pink-100 dark:bg-pink-900/30 text-pink-800 dark:text-pink-400',
      'Funeral (Janazah)': 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300',
      Education: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      Counseling: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
    }
    return colors[category] || 'bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-300'
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      [CaseStatus.OPEN]: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400',
      [CaseStatus.IN_PROGRESS]: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      [CaseStatus.PENDING]: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      [CaseStatus.RESOLVED]: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400',
      [CaseStatus.CLOSED]: 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-300',
      [CaseStatus.CANCELLED]: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400',
    }
    return colors[status] || 'bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-300'
  }

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      [CaseStatus.OPEN]: 'Open',
      [CaseStatus.IN_PROGRESS]: 'In Progress',
      [CaseStatus.PENDING]: 'Pending',
      [CaseStatus.RESOLVED]: 'Resolved',
      [CaseStatus.CLOSED]: 'Closed',
      [CaseStatus.CANCELLED]: 'Cancelled',
    }
    return labels[status] || status
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
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-2">My Cases</h1>
          <p className="text-slate-600 dark:text-slate-400 text-sm sm:text-base">
            Request assistance and view your submitted cases
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
        >
          <Plus size={18} />
          Create New Case
        </button>
      </div>

      {cases.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
          <FileText className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={48} />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No Cases Yet</h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6">
            You haven&apos;t submitted any assistance requests yet. Click the button below to get started.
          </p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
          >
            <Plus size={18} />
            Create Your First Case
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {cases.map((caseItem) => (
            <div
              key={caseItem.id}
              className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-6"
            >
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {caseItem.category}
                    </h3>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getCategoryColor(caseItem.category)}`}>
                      {caseItem.category}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(caseItem.status)}`}>
                      {getStatusLabel(caseItem.status)}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    {caseItem.requested_amount && (
                      <div>
                        <p className="text-slate-500 dark:text-slate-400">Amount</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {formatCurrency(caseItem.requested_amount)}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Type</p>
                      <p className="font-medium text-slate-900 dark:text-white capitalize">
                        {caseItem.case_type || 'Assistance'}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Date</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(caseItem.assistance_date || caseItem.created_at)}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500 dark:text-slate-400">Created</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {formatDate(caseItem.created_at)}
                      </p>
                    </div>
                  </div>

                  {/* Display Notes Thread */}
                  {caseItem.notes_thread && Array.isArray(caseItem.notes_thread) && caseItem.notes_thread.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-2 font-medium">Conversation</p>
                      <div className="space-y-2 max-h-48 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                        {caseItem.notes_thread.map((note, index) => (
                          <div
                            key={index}
                            className={`p-2 rounded text-sm ${
                              note.created_by_type === 'admin'
                                ? 'bg-blue-50 dark:bg-blue-900/30 border-l-2 border-blue-400 dark:border-blue-500'
                                : 'bg-emerald-50 dark:bg-emerald-900/30 border-l-2 border-emerald-400 dark:border-emerald-500'
                            }`}
                          >
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                                {note.created_by_name} ({note.created_by_type === 'admin' ? 'Admin' : 'You'})
                              </span>
                              <span className="text-xs text-slate-500 dark:text-slate-400">
                                {new Date(note.created_at).toLocaleString('en-US')}
                              </span>
                            </div>
                            <p className="text-slate-900 dark:text-white whitespace-pre-wrap">{note.message}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Fallback to old notes field */}
                  {(!caseItem.notes_thread || !Array.isArray(caseItem.notes_thread) || caseItem.notes_thread.length === 0) &&
                    caseItem.notes && (
                      <div className="mt-4">
                        <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Notes</p>
                        <p className="text-sm text-slate-900 dark:text-white whitespace-pre-wrap">{caseItem.notes}</p>
                      </div>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Case Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Create New Case</h2>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                  disabled={submitting}
                >
                  <X size={24} />
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Category <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData((prev) => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                  disabled={submitting}
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.assistance_date}
                  onChange={(e) => setFormData((prev) => ({ ...prev, assistance_date: e.target.value }))}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-900 dark:text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
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
                  rows={4}
                  placeholder="Describe your situation and assistance needs..."
                  disabled={submitting}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
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
                      Submitting...
                    </>
                  ) : (
                    'Submit Case'
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
