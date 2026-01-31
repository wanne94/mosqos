import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFormDirty } from '@/hooks/useFormDirty'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useOrganization } from '@/hooks/useOrganization'
import type { CaseStatus, CasePriority } from '../types/cases.types'

interface CaseModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  caseId?: string | null
  memberId?: string | null
  showAmountField?: boolean
}

interface CaseFormData {
  member_id: string
  category: string
  case_type: string
  title: string
  description: string
  amount: string
  status: CaseStatus
  priority: CasePriority
  notes: string
  assistance_date: string
}

const initialFormDataTemplate: CaseFormData = {
  member_id: '',
  category: 'Financial Assistance',
  case_type: 'Assistance',
  title: '',
  description: '',
  amount: '',
  status: 'open' as CaseStatus,
  priority: 'medium' as CasePriority,
  notes: '',
  assistance_date: new Date().toISOString().split('T')[0],
}

const categories = [
  'Financial Assistance',
  'Food Pantry',
  'Housing',
  'Medical',
  'Marriage',
  'Funeral',
  'Education',
  'Counseling',
]

const statuses = ['open', 'in_progress', 'resolved', 'closed', 'cancelled'] as const
const priorities = ['low', 'medium', 'high', 'urgent'] as const

export default function CaseModal({
  isOpen,
  onClose,
  onSave,
  caseId,
  memberId: initialMemberId,
  showAmountField = true,
}: CaseModalProps) {
  const { currentOrganizationId } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(false)
  const [members, setMembers] = useState<Array<{ id: string; first_name: string; last_name: string }>>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [showMemberDropdown, setShowMemberDropdown] = useState(false)
  const [initialFormData, setInitialFormData] = useState<CaseFormData | null>(null)
  const [formData, setFormData] = useState<CaseFormData>(initialFormDataTemplate)
  const isDirty = useFormDirty(formData, initialFormData)

  useEscapeKey(
    onClose,
    isDirty,
    'You have unsaved changes. Are you sure you want to close?',
    isOpen
  )

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  useEffect(() => {
    if (isOpen) {
      fetchMembers()
      if (caseId) {
        fetchCaseData()
      } else {
        const initial = {
          ...initialFormDataTemplate,
          member_id: initialMemberId || '',
        }
        setInitialFormData(initial)
        setFormData(initial)
        setSearchQuery('')
      }
    }
  }, [isOpen, caseId, initialMemberId])

  const fetchMembers = async () => {
    try {
      const { data, error } = await supabase
        .from('members')
        .select('id, first_name, last_name')
        .eq('organization_id', currentOrganizationId)
        .order('first_name')

      if (error) throw error
      setMembers(data || [])
    } catch (error) {
      console.error('Error fetching members:', error)
      setMembers([])
    }
  }

  const fetchCaseData = async () => {
    if (!caseId) return

    try {
      setFetching(true)
      const { data, error } = await supabase
        .from('service_cases')
        .select('*')
        .eq('id', caseId)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (error) throw error

      if (data) {
        const assistanceDate = (data as any).assistance_date
          ? new Date((data as any).assistance_date).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0]

        const initial: CaseFormData = {
          member_id: (data as any).member_id || '',
          category: (data as any).category || 'Financial Assistance',
          case_type: (data as any).case_type || 'Assistance',
          title: (data as any).title || '',
          description: (data as any).description || '',
          amount: (data as any).requested_amount ? (data as any).requested_amount.toString() : '',
          status: (data as any).status || 'open',
          priority: (data as any).priority || 'medium',
          notes: (data as any).resolution_notes || '',
          assistance_date: assistanceDate,
        }
        setInitialFormData(initial)
        setFormData(initial)
      }
    } catch (error) {
      console.error('Error fetching case data:', error)
      alert('Failed to load case data')
    } finally {
      setFetching(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleMemberSelect = (member: { id: string; first_name: string; last_name: string }) => {
    setFormData((prev) => ({
      ...prev,
      member_id: member.id,
    }))
    setSearchQuery(`${member.first_name} ${member.last_name}`)
    setShowMemberDropdown(false)
  }

  const filteredMembers = members.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const query = searchQuery.toLowerCase()
    return fullName.includes(query)
  })

  const selectedMember = members.find((m) => m.id === formData.member_id)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const caseData = {
        member_id: formData.member_id || null,
        category: formData.category,
        case_type: formData.case_type,
        title: formData.title,
        description: formData.description || null,
        requested_amount: formData.amount ? parseFloat(formData.amount) : null,
        status: formData.status,
        priority: formData.priority,
        resolution_notes: formData.notes || null,
        assistance_date: formData.assistance_date || new Date().toISOString().split('T')[0],
        organization_id: currentOrganizationId,
      }

      if (caseId) {
        const { error } = await supabase
          .from('service_cases')
          .update(caseData as any)
          .eq('id', caseId)

        if (error) throw error
      } else {
        const { error } = await supabase
          .from('service_cases')
          .insert([caseData as any])

        if (error) throw error
      }

      onSave()
      onClose()
    } catch (error) {
      console.error('Error saving case:', error)
      alert('Failed to save case')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {caseId ? 'Edit Case' : 'New Case'}
          </h2>
          <button
            onClick={handleClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {fetching ? (
          <div className="p-6 text-center text-slate-600 dark:text-slate-400">Loading case data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {/* Member Selection */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Member
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value)
                    setShowMemberDropdown(true)
                  }}
                  onFocus={() => setShowMemberDropdown(true)}
                  onBlur={() => setTimeout(() => setShowMemberDropdown(false), 200)}
                  placeholder="Search member"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {showMemberDropdown && filteredMembers.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredMembers.map((member) => (
                      <button
                        key={member.id}
                        type="button"
                        onClick={() => handleMemberSelect(member)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white"
                      >
                        {member.first_name} {member.last_name}
                      </button>
                    ))}
                  </div>
                )}
                {selectedMember && (
                  <div className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                    Selected: {selectedMember.first_name} {selectedMember.last_name}
                  </div>
                )}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Title *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Brief case description"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Category *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            {/* Case Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Case Type *
              </label>
              <select
                name="case_type"
                value={formData.case_type || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="">Select case type</option>
                <option value="Assistance">Assistance (Money Out)</option>
                <option value="Collection">Collection (Money In)</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Priority *
              </label>
              <select
                name="priority"
                value={formData.priority}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {priorities.map((priority) => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            {/* Amount */}
            {showAmountField && (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Amount
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="0.00"
                />
              </div>
            )}

            {/* Assistance Date */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Assistance Date *
              </label>
              <input
                type="date"
                name="assistance_date"
                value={formData.assistance_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Status *
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {statuses.map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Description
              </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Case details"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Notes
              </label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Additional notes"
              />
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
                {loading ? 'Saving...' : caseId ? 'Save Changes' : 'Create Case'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
