'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { Settings as SettingsIcon, Users, Search, Building2 } from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { ManageRoleModal } from '../components/ManageRoleModal'

// Types
interface OrganizationSettings {
  organization_name: string
  contact_email: string
  contact_phone: string
  address: string
  city: string
  state: string
  zip_code: string
  website: string
}

interface OrganizationData {
  name?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address?: string | null
  city?: string | null
  state?: string | null
  zip_code?: string | null
  website?: string | null
}

interface OrganizationMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  system_role: string
  permissions: Record<string, boolean>
  user_id: string | null
  households?: {
    id: string
    name: string
  } | null
}

type TabType = 'general' | 'access'

export default function SettingsPage() {
  const { t } = useTranslation()
  const { currentOrganization } = useOrganization()
  const queryClient = useQueryClient()
  const [activeTab, setActiveTab] = useState<TabType>('general')
  const [searchQuery, setSearchQuery] = useState('')
  const [isManageRoleModalOpen, setIsManageRoleModalOpen] = useState(false)
  const [selectedMember, setSelectedMember] = useState<OrganizationMember | null>(null)

  // Fetch organization settings
  const { data: orgSettings, isLoading: loadingOrgSettings } = useQuery<OrganizationSettings>({
    queryKey: ['orgSettings', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) throw new Error('No organization')

      const { data, error } = await supabase
        .from('organizations')
        .select('name, contact_email, contact_phone, address_line1, city, state, postal_code, website')
        .eq('id', currentOrganization.id)
        .maybeSingle()

      if (error) throw error
      if (!data) throw new Error('Organization not found')

      const orgData = data as OrganizationData

      return {
        organization_name: orgData.name || '',
        contact_email: orgData.contact_email || '',
        contact_phone: orgData.contact_phone || '',
        address: (orgData as any).address_line1 || '',
        city: orgData.city || '',
        state: orgData.state || '',
        zip_code: (orgData as any).postal_code || '',
        website: orgData.website || '',
      }
    },
    enabled: !!currentOrganization?.id && activeTab === 'general'
  })

  // Fetch payment config - commented out for now as it's not used in this simplified version
  // const { data: paymentConfig } = useQuery<PaymentConfig>({
  //   queryKey: ['paymentConfig', currentOrganization?.id],
  //   queryFn: async () => {
  //     if (!currentOrganization?.id) throw new Error('No organization')
  //
  //     const { data, error } = await supabase
  //       .from('organization')
  //       .select('payment_provider, stripe_account_id, stripe_secret_key, stripe_publishable_key, iyzico_api_key, iyzico_secret_key, iyzico_merchant_id')
  //       .eq('id', currentOrganization.id)
  //       .maybeSingle()
  //
  //     if (error) throw error
  //     if (!data) throw new Error('Organization not found')
  //
  //     return {
  //       payment_provider: 'stripe' as const,
  //       stripe_account_id: '',
  //       stripe_secret_key: '',
  //       stripe_publishable_key: '',
  //       iyzico_api_key: '',
  //       iyzico_secret_key: '',
  //       iyzico_merchant_id: '',
  //     }
  //   },
  //   enabled: !!currentOrganization?.id && activeTab === 'payment'
  // })

  // Fetch users
  const { data: users = [], isLoading: loadingUsers } = useQuery<OrganizationMember[]>({
    queryKey: ['organizationMembers', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return []

      // Fetch members with their organization_members link
      const { data, error } = await supabase
        .from('organization_members')
        .select(`
          id,
          role,
          user_id,
          members:member_id (
            id,
            first_name,
            last_name,
            email,
            households:household_id (
              id,
              name
            )
          )
        `)
        .eq('organization_id', currentOrganization.id)

      if (error) throw error

      // Transform data to expected format
      return (data || []).map((om: any) => ({
        id: om.members?.id || om.id,
        first_name: om.members?.first_name || '',
        last_name: om.members?.last_name || '',
        email: om.members?.email || null,
        system_role: om.role || 'member',
        permissions: {},
        user_id: om.user_id,
        households: om.members?.households || null,
      }))
    },
    enabled: !!currentOrganization?.id && activeTab === 'access'
  })

  // Filter users based on search
  const filteredUsers = users.filter((user) => {
    if (!searchQuery.trim()) return true

    const query = searchQuery.toLowerCase().trim()
    const fullName = `${user.first_name} ${user.last_name}`.toLowerCase()
    const email = (user.email || '').toLowerCase()
    const householdName = (user.households?.name || '').toLowerCase()

    return fullName.includes(query) || email.includes(query) || householdName.includes(query)
  })

  // Save payment config mutation (commented out for now - payment config is read-only)
  // const savePaymentConfigMutation = useMutation({
  //   mutationFn: async (config: PaymentConfig) => {
  //     if (!currentOrganization?.id) throw new Error('No organization')
  //
  //     const provider = organizationCountry === 'TR' ? 'iyzico' : 'stripe'
  //
  //     const { error } = await supabase
  //       .from('organization')
  //       .update({
  //         payment_provider: provider,
  //         stripe_account_id: config.stripe_account_id || null,
  //         stripe_secret_key: config.stripe_secret_key || null,
  //         stripe_publishable_key: config.stripe_publishable_key || null,
  //         iyzico_api_key: config.iyzico_api_key || null,
  //         iyzico_secret_key: config.iyzico_secret_key || null,
  //         iyzico_merchant_id: config.iyzico_merchant_id || null,
  //       })
  //       .eq('id', currentOrganization.id)
  //
  //     if (error) throw error
  //   },
  //   onSuccess: () => {
  //     queryClient.invalidateQueries({ queryKey: ['paymentConfig', currentOrganization?.id] })
  //   }
  // })

  const handleManageRole = (member: OrganizationMember) => {
    setSelectedMember(member)
    setIsManageRoleModalOpen(true)
  }

  const getRoleBadge = (role: string) => {
    const roleLabels: Record<string, string> = {
      'member': t('settings.member'),
      'finance_admin': t('settings.financeAdmin'),
      'education_admin': t('settings.educationAdmin'),
      'services_admin': t('settings.servicesAdmin'),
      'umrah_admin': t('settings.umrahAdmin'),
      'people_admin': t('settings.peopleAdmin'),
      'admin': t('settings.fullAdmin'),
      'super_admin': t('settings.fullAdmin'),
    }

    const roleColors: Record<string, string> = {
      'member': 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300',
      'finance_admin': 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400',
      'education_admin': 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-400',
      'services_admin': 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-400',
      'umrah_admin': 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-400',
      'people_admin': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-400',
      'admin': 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900',
      'super_admin': 'bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900',
    }

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${roleColors[role] || roleColors['member']}`}>
        {roleLabels[role] || t('settings.member')}
      </span>
    )
  }

  return (
    <div className="p-4 md:p-8 animate-page-enter">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-3">
          <SettingsIcon className="text-emerald-600 dark:text-emerald-400" size={32} />
          {t('settings.title')}
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mt-2">{t('settings.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700 mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('general')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'general'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
            }`}
          >
            {t('settings.general')}
          </button>
          <button
            onClick={() => setActiveTab('access')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'access'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300'
            }`}
          >
            {t('settings.accessManagement')}
          </button>
        </nav>
      </div>

      {/* General Tab */}
      {activeTab === 'general' && (
        <>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <Building2 className="text-emerald-600 dark:text-emerald-400" size={20} />
                {t('settings.organizationInformation')}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                This information is managed by the platform administrator. Contact support to make changes.
              </p>
            </div>

            {loadingOrgSettings ? (
              <div className="text-center py-8 text-slate-600 dark:text-slate-400">Loading...</div>
            ) : (
              <div className="space-y-6 opacity-60">
                {/* Organization Name */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    {t('settings.organizationName')}
                  </label>
                  <input
                    type="text"
                    value={orgSettings?.organization_name || ''}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      {t('settings.contactEmail')}
                    </label>
                    <input
                      type="email"
                      value={orgSettings?.contact_email || ''}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      {t('settings.contactPhone')}
                    </label>
                    <input
                      type="tel"
                      value={orgSettings?.contact_phone || ''}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    {t('settings.address')}
                  </label>
                  <input
                    type="text"
                    value={orgSettings?.address || ''}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      {t('settings.city')}
                    </label>
                    <input
                      type="text"
                      value={orgSettings?.city || ''}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      {t('settings.state')}
                    </label>
                    <input
                      type="text"
                      value={orgSettings?.state || ''}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                      {t('settings.zipCode')}
                    </label>
                    <input
                      type="text"
                      value={orgSettings?.zip_code || ''}
                      readOnly
                      disabled
                      className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Website */}
                <div>
                  <label className="block text-sm font-medium text-slate-500 dark:text-slate-400 mb-2">
                    {t('settings.website')}
                  </label>
                  <input
                    type="url"
                    value={orgSettings?.website || ''}
                    readOnly
                    disabled
                    className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                  />
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                <span className="font-medium">Need to update this information?</span><br />
                Please contact your platform administrator or reach out to support@mosqos.com
              </p>
            </div>
          </div>

          {/* Member Invitation Section */}
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 mt-6 shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-2">
                <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
                Member Invitation
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Share this link with community members so they can join your organization
              </p>
            </div>

            <div className="space-y-4">
              {/* Join Link */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Public Join Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={currentOrganization?.slug
                      ? `${window.location.origin}/${currentOrganization.slug}/join`
                      : 'Loading...'}
                    readOnly
                    className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-mono text-sm"
                  />
                  <button
                    onClick={() => {
                      const joinLink = `${window.location.origin}/${currentOrganization?.slug}/join`
                      navigator.clipboard.writeText(joinLink)
                    }}
                    disabled={!currentOrganization?.slug}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 whitespace-nowrap"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copy Link
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Access Management Tab */}
      {activeTab === 'access' && (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
              {t('settings.accessManagement')}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
              {t('settings.accessManagementDescription')}
            </p>
          </div>

          {/* Search Bar */}
          <div className="p-6 border-b border-slate-200 dark:border-slate-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="text"
                placeholder={t('settings.searchUsers')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {loadingUsers ? (
            <div className="p-8 text-center text-slate-600 dark:text-slate-400">{t('settings.loadingUsers')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('common.user')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('common.email')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('people.role')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      {t('common.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        {searchQuery ? 'No members found matching your search.' : 'No members found.'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="hover:bg-slate-50 dark:hover:bg-slate-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                              <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100">
                                {user.first_name} {user.last_name}
                              </div>
                              {user.households?.name && (
                                <div className="text-xs text-slate-500 dark:text-slate-400">{user.households.name}</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {user.email || 'No email'}
                        </td>
                        <td className="px-6 py-4">
                          {getRoleBadge(user.system_role)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => handleManageRole(user)}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-900 dark:hover:text-emerald-300"
                          >
                            {t('common.changeRole')}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Manage Role Modal */}
      {isManageRoleModalOpen && selectedMember && (
        <ManageRoleModal
          member={selectedMember}
          onClose={() => {
            setIsManageRoleModalOpen(false)
            setSelectedMember(null)
          }}
          onSuccess={() => {
            queryClient.invalidateQueries({ queryKey: ['organizationMembers', currentOrganization?.id] })
          }}
        />
      )}
    </div>
  )
}
