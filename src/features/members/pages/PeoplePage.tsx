'use client'

import { useState, useMemo, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import type { SupabaseClient } from '@supabase/supabase-js'

// Type assertion for tables not in generated types
const db = supabase as SupabaseClient<any>
import {
  Search,
  UserPlus,
  Plus,
  Filter,
  Download,
  BarChart3,
  Mail,
  MessageSquare,
  Users,
  X
} from 'lucide-react'
import { AddMemberModal } from '../components/AddMemberModal'
import { InviteMemberModal } from '../components/InviteMemberModal'
import { NewHouseholdModal } from '@/features/households/components/NewHouseholdModal'
import type { Member, Household } from '../types'

interface Filters {
  status: string
  role: string
  household_id: string
  tags: string
}

interface CommunicationLog {
  id: string
  communication_type: string
  subject: string | null
  content: string | null
  status: string | null
  created_at: string
  member_id: string | null
  household_id: string | null
  recipient?: {
    id: string
    first_name: string
    last_name: string
    email: string
  } | null
  household?: {
    id: string
    name: string
  } | null
}

interface Recipient {
  id: string
  name: string
  contact_email?: string
  type: 'individual' | 'household'
}

export default function PeoplePage() {
  const { currentOrganization } = useOrganization()
  const [searchTerm, setSearchTerm] = useState('')
  const [activeTab, setActiveTab] = useState<'directory' | 'communicate'>('directory')
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<Filters>({
    status: '',
    role: '',
    household_id: '',
    tags: '',
  })

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)
  const [isHouseholdModalOpen, setIsHouseholdModalOpen] = useState(false)
  const [householdRefreshTrigger, setHouseholdRefreshTrigger] = useState(0)

  // Communication states
  const [recipientMode, setRecipientMode] = useState<'individual' | 'household'>('individual')
  const [selectedRecipients, setSelectedRecipients] = useState<Recipient[]>([])
  const [recipientSearch, setRecipientSearch] = useState('')
  const [showRecipientDropdown, setShowRecipientDropdown] = useState(false)
  const [communicationType, setCommunicationType] = useState<'email' | 'sms'>('email')
  const [subject, setSubject] = useState('')
  const [body, setBody] = useState('')
  const [sending, setSending] = useState(false)

  // Fetch members
  const { data: members = [], isLoading: loadingMembers, refetch: refetchMembers } = useQuery({
    queryKey: ['members', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return []
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          household:households (
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('first_name', { ascending: true })

      if (error) throw error
      return data as unknown as (Member & { household?: Pick<Household, 'name'> })[]
    },
    enabled: !!currentOrganization?.id,
  })

  // Fetch households
  const { data: households = [] } = useQuery({
    queryKey: ['households', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return []
      const { data, error } = await supabase
        .from('households')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('name', { ascending: true })

      if (error) throw error
      return data as Household[]
    },
    enabled: !!currentOrganization?.id,
  })

  // Fetch communication logs
  const { data: communicationLogs = [], isLoading: loadingLogs, refetch: refetchLogs } = useQuery({
    queryKey: ['communication-logs', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return []
      const { data, error } = await db
        .from('communication_logs')
        .select(`
          *,
          recipient:member_id (
            id,
            first_name,
            last_name,
            email
          ),
          household:household_id (
            id,
            name
          )
        `)
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      return (data ?? []) as CommunicationLog[]
    },
    enabled: !!currentOrganization?.id && activeTab === 'communicate',
  })

  // Filter members
  const filteredMembers = useMemo(() => {
    let filtered = [...members]

    // Text search
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter((member) => {
        const firstName = (member.first_name || '').toLowerCase()
        const lastName = (member.last_name || '').toLowerCase()
        const fullName = `${firstName} ${lastName}`.trim()
        const householdName = (member.household?.name || '').toLowerCase()
        const email = (member.email || '').toLowerCase()

        return (
          firstName.includes(query) ||
          lastName.includes(query) ||
          fullName.includes(query) ||
          householdName.includes(query) ||
          email.includes(query)
        )
      })
    }

    // Advanced filters
    if (filters.role) {
      filtered = filtered.filter((member) => member.membership_type === filters.role)
    }
    if (filters.household_id) {
      filtered = filtered.filter((member) => member.household_id === filters.household_id)
    }

    return filtered
  }, [members, searchTerm, filters])

  // Export CSV
  const handleExportCSV = useCallback(() => {
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Role',
      'Family Name',
      'Date of Birth',
      'Status',
      'Notes'
    ]

    const rows = members.map((member) => [
      member.first_name || '',
      member.last_name || '',
      member.email || '',
      member.phone || '',
      member.membership_type || '',
      member.household?.name || '',
      member.date_of_birth || '',
      member.membership_status || '',
      member.notes || '',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `members_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [members])

  // Get available recipients
  const getAvailableRecipients = useMemo(() => {
    if (recipientMode === 'household') {
      return households.map(h => ({
        id: h.id,
        name: h.name,
        type: 'household' as const
      }))
    } else {
      return members.map(m => ({
        id: m.id,
        name: `${m.first_name} ${m.last_name}`.trim() || 'Unnamed',
        contact_email: m.email || undefined,
        type: 'individual' as const
      }))
    }
  }, [recipientMode, households, members])

  const filteredRecipients = useMemo(() => {
    return getAvailableRecipients.filter(r => {
      if (!recipientSearch.trim()) return true
      const query = recipientSearch.toLowerCase()
      return r.name.toLowerCase().includes(query)
    })
  }, [getAvailableRecipients, recipientSearch])

  const handleAddRecipient = useCallback((recipient: Recipient) => {
    setSelectedRecipients(prev => {
      if (prev.find(r => r.id === recipient.id && r.type === recipient.type)) {
        return prev
      }
      return [...prev, recipient]
    })
    setRecipientSearch('')
    setShowRecipientDropdown(false)
  }, [])

  const handleRemoveRecipient = useCallback((recipientId: string, type: 'individual' | 'household') => {
    setSelectedRecipients(prev => prev.filter(r => !(r.id === recipientId && r.type === type)))
  }, [])

  const handleSendMessage = useCallback(async () => {
    if (!body.trim() || selectedRecipients.length === 0) {
      return
    }

    if (communicationType === 'email' && !subject.trim()) {
      return
    }

    setSending(true)

    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('User not authenticated')

      const logEntries = selectedRecipients.map(recipient => ({
        communication_type: communicationType,
        subject: communicationType === 'email' ? subject : null,
        content: body,
        status: 'sent',
        direction: 'outbound' as const,
        created_by: user.id,
        organization_id: currentOrganization?.id,
        ...(recipient.type === 'household'
          ? { household_id: recipient.id }
          : { member_id: recipient.id }
        ),
      }))

      const { error } = await db
        .from('communication_logs')
        .insert(logEntries)

      if (error) throw error

      // Reset form
      setSelectedRecipients([])
      setSubject('')
      setBody('')
      setRecipientSearch('')

      // Refresh logs
      refetchLogs()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setSending(false)
    }
  }, [selectedRecipients, communicationType, body, subject, currentOrganization?.id, refetchLogs])

  if (loadingMembers) {
    return (
      <div className="p-4 sm:p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 dark:text-slate-400">Loading community directory...</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">People Management</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">Manage your community members</p>
        </div>
        {members.length > 0 && (
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/${currentOrganization?.slug}/admin/people/analytics`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              <BarChart3 size={18} />
              Analytics
            </Link>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              <UserPlus size={20} />
              Add Member
            </button>
            <button
              onClick={() => setIsHouseholdModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm"
            >
              <Plus size={20} />
              Add Family
            </button>
            <button
              onClick={() => setIsInviteModalOpen(true)}
              className="flex items-center gap-2 px-6 py-3 border-2 border-emerald-600 text-emerald-600 bg-transparent rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors font-medium shadow-sm"
            >
              <Mail size={20} />
              Invite Member
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white dark:bg-slate-800 rounded-lg mb-6 shadow-sm">
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('directory')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'directory'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <Users size={18} />
            Directory
          </button>
          <button
            onClick={() => setActiveTab('communicate')}
            className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'communicate'
                ? 'text-emerald-600 border-b-2 border-emerald-600'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare size={18} />
            Communicate
          </button>
        </div>
      </div>

      {/* Directory Tab */}
      {activeTab === 'directory' && (
        <>
          {members.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
              <div className="max-w-md mx-auto">
                <div className="bg-slate-100 dark:bg-slate-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <UserPlus className="text-slate-400" size={32} />
                </div>
                <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">No members yet</h2>
                <p className="text-slate-600 dark:text-slate-400 mb-6">
                  Start building your community directory by adding the first member.
                </p>
                <button
                  onClick={() => setIsInviteModalOpen(true)}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium flex items-center gap-2 mx-auto"
                >
                  <Mail size={20} />
                  Invite First Member
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Search Bar and Filters */}
              <div className="mb-6 space-y-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Search members..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                      showFilters
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-300 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    <Filter size={18} />
                    Filters
                  </button>
                  <button
                    onClick={handleExportCSV}
                    className="flex items-center justify-center px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                    title="Export to CSV"
                  >
                    <Download size={18} />
                  </button>
                  {(filters.role || filters.household_id) && (
                    <button
                      onClick={() => setFilters({ status: '', role: '', household_id: '', tags: '' })}
                      className="text-sm text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>

                {showFilters && (
                  <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                      <select
                        value={filters.role}
                        onChange={(e) => setFilters(prev => ({ ...prev, role: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All</option>
                        <option value="individual">Individual</option>
                        <option value="family">Family</option>
                        <option value="student">Student</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Family</label>
                      <select
                        value={filters.household_id}
                        onChange={(e) => setFilters(prev => ({ ...prev, household_id: e.target.value }))}
                        className="w-full px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">All</option>
                        {households.map((household) => (
                          <option key={household.id} value={household.id}>
                            {household.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                )}
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                      <tr>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                          Family
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                          Phone
                        </th>
                        <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
                          Email
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                      {filteredMembers.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-slate-700 dark:text-slate-400">
                            No members found
                          </td>
                        </tr>
                      ) : (
                        filteredMembers.map((member) => (
                          <tr key={member.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                              <Link
                                to={`/${currentOrganization?.slug}/admin/people/${member.id}`}
                                className="text-emerald-600 hover:text-emerald-700 font-medium hover:underline"
                              >
                                {[member.first_name, member.last_name].filter(Boolean).join(' ') || '—'}
                              </Link>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              {member.household?.name || '—'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white">
                                {member.membership_type || 'Member'}
                              </span>
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              {member.phone || '—'}
                            </td>
                            <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                              {member.email ? (
                                <a
                                  href={`mailto:${member.email}`}
                                  className="text-emerald-600 hover:text-emerald-700 hover:underline"
                                >
                                  {member.email}
                                </a>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Results count */}
              {searchTerm && (
                <div className="mt-4 text-sm font-medium text-slate-900 dark:text-white">
                  Showing {filteredMembers.length} of {members.length} members
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Communicate Tab */}
      {activeTab === 'communicate' && (
        <div className="space-y-6">
          {/* Send Message Form */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">Send Message</h2>

            {/* Recipient Mode Toggle */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Recipient Mode</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    value="individual"
                    checked={recipientMode === 'individual'}
                    onChange={(e) => {
                      setRecipientMode(e.target.value as 'individual' | 'household')
                      setSelectedRecipients([])
                      setRecipientSearch('')
                    }}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">By Individual</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="recipientMode"
                    value="household"
                    checked={recipientMode === 'household'}
                    onChange={(e) => {
                      setRecipientMode(e.target.value as 'individual' | 'household')
                      setSelectedRecipients([])
                      setRecipientSearch('')
                    }}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-slate-700 dark:text-slate-300">By Household</span>
                </label>
              </div>
            </div>

            {/* Recipient Select */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Recipients {selectedRecipients.length > 0 && `(${selectedRecipients.length} selected)`}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={recipientSearch}
                  onChange={(e) => {
                    setRecipientSearch(e.target.value)
                    setShowRecipientDropdown(true)
                  }}
                  onFocus={() => setShowRecipientDropdown(true)}
                  onBlur={() => setTimeout(() => setShowRecipientDropdown(false), 200)}
                  placeholder={`Search ${recipientMode === 'household' ? 'households' : 'members'}...`}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                {showRecipientDropdown && filteredRecipients.length > 0 && (
                  <div className="absolute z-10 w-full mt-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredRecipients.map((recipient) => (
                      <button
                        key={`${recipient.type}-${recipient.id}`}
                        type="button"
                        onClick={() => handleAddRecipient(recipient)}
                        className="w-full text-left px-4 py-2 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors text-slate-900 dark:text-white"
                        onMouseDown={(e) => e.preventDefault()}
                      >
                        {recipient.name}
                        {'contact_email' in recipient && recipient.contact_email && (
                          <span className="text-xs text-slate-500 ml-2">({recipient.contact_email})</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Recipients */}
              {selectedRecipients.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {selectedRecipients.map((recipient) => (
                    <span
                      key={`${recipient.type}-${recipient.id}`}
                      className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200 rounded-full text-sm"
                    >
                      {recipient.name}
                      <button
                        type="button"
                        onClick={() => handleRemoveRecipient(recipient.id, recipient.type)}
                        className="hover:text-emerald-900 dark:hover:text-emerald-100"
                      >
                        <X size={14} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Channel Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Channel</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="communicationType"
                    value="email"
                    checked={communicationType === 'email'}
                    onChange={(e) => setCommunicationType(e.target.value as 'email' | 'sms')}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <Mail size={18} className="text-slate-600 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">Email</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="communicationType"
                    value="sms"
                    checked={communicationType === 'sms'}
                    onChange={(e) => setCommunicationType(e.target.value as 'email' | 'sms')}
                    className="w-4 h-4 text-emerald-600 border-slate-300 focus:ring-emerald-500"
                  />
                  <MessageSquare size={18} className="text-slate-600 dark:text-slate-400" />
                  <span className="text-sm text-slate-700 dark:text-slate-300">SMS</span>
                </label>
              </div>
            </div>

            {/* Subject (Email only) */}
            {communicationType === 'email' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="Email subject"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            )}

            {/* Message Body */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Message Body *
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Enter your message..."
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={sending || !body.trim() || selectedRecipients.length === 0 || (communicationType === 'email' && !subject.trim())}
              className="w-full px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>

          {/* Communication History */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Recent Communication History</h2>
            {loadingLogs ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">Loading history...</div>
            ) : communicationLogs.length === 0 ? (
              <div className="text-center py-8 text-slate-500 dark:text-slate-400">No communication history yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Recipient
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {communicationLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {new Date(log.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                          {log.recipient
                            ? `${log.recipient.first_name} ${log.recipient.last_name}`.trim() || 'Unnamed'
                            : log.household
                            ? log.household.name
                            : 'N/A'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.communication_type === 'email'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200'
                              : 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200'
                          }`}>
                            {(log.communication_type || 'unknown').toUpperCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-slate-900 dark:text-white">
                          {log.subject || '—'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            log.status === 'sent'
                              ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200'
                              : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                          }`}>
                            {log.status || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      <AddMemberModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={() => refetchMembers()}
        householdRefreshTrigger={householdRefreshTrigger}
      />

      <NewHouseholdModal
        isOpen={isHouseholdModalOpen}
        onClose={() => setIsHouseholdModalOpen(false)}
        onSave={() => {
          setHouseholdRefreshTrigger((prev) => prev + 1)
        }}
      />

      <InviteMemberModal
        isOpen={isInviteModalOpen}
        onClose={() => setIsInviteModalOpen(false)}
        organizationSlug={currentOrganization?.slug || ''}
      />
    </div>
  )
}
