import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, Phone, Calendar, Edit, DollarSign, FileText, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/app/providers/AuthProvider'
import { DonationsTab } from '@/features/donations/components/DonationsTab'
import CaseHistoryTab from '@/features/cases/components/CaseHistoryTab'
import type { Database } from '@/shared/types/database.types'

type MemberRow = Database['public']['Tables']['members']['Row']

interface OrganizationMemberWithMember {
  id: string
  role: string | null
  member_id: string | null
  members: MemberRow | null
}

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  membership_status: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  notes: string | null
  role: string | null
  household_id: string | null
}

interface Household {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
}

interface FamilyMember {
  id: string
  first_name: string
  last_name: string
}

type TabType = 'profile' | 'donations' | 'case-history' | 'education' | 'family'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentOrganizationId } = useOrganization()
  const { user } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<TabType>('profile')

  // Handle tab from query parameter
  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam && ['profile', 'donations', 'case-history', 'education', 'family'].includes(tabParam)) {
      setActiveTab(tabParam as TabType)
    }
  }, [searchParams])

  useEffect(() => {
    if (user && currentOrganizationId) {
      fetchMemberDetails()
    }
  }, [user, currentOrganizationId])

  const fetchMemberDetails = async () => {
    try {
      setLoading(true)

      if (!user || !currentOrganizationId) return

      // Fetch current member via organization_members -> members join
      // Note: organization_members table exists in DB but not in generated types
      const { data: orgMemberRawData, error: memberError } = await supabase
        .from('organization_members' as 'members')
        .select(`
          id,
          role,
          member_id,
          members:member_id (*)
        `)
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (memberError) throw memberError
      if (!orgMemberRawData) return

      // Cast to expected type
      const orgMemberData = orgMemberRawData as unknown as OrganizationMemberWithMember

      // Extract member profile from the join
      const memberProfile = orgMemberData.members as MemberRow | null
      if (memberProfile) {
        setMember({
          id: memberProfile.id,
          first_name: memberProfile.first_name,
          last_name: memberProfile.last_name,
          email: memberProfile.email,
          phone: memberProfile.phone,
          date_of_birth: memberProfile.date_of_birth,
          membership_status: memberProfile.membership_status,
          address: memberProfile.address,
          city: memberProfile.city,
          state: memberProfile.state,
          zip_code: memberProfile.zip_code,
          country: memberProfile.country,
          notes: memberProfile.notes,
          role: orgMemberData.role,
          household_id: memberProfile.household_id,
        })

        // Fetch household if member has one
        if (memberProfile.household_id) {
          const { data: householdData, error: householdError } = await supabase
            .from('households')
            .select('id, name, address, city, state, zip_code')
            .eq('id', memberProfile.household_id)
            .single()

          if (!householdError && householdData) {
            setHousehold({
              id: householdData.id,
              name: householdData.name,
              address: householdData.address,
              city: householdData.city,
              state: householdData.state,
              zip_code: householdData.zip_code,
            })

            // Fetch family members from the members table
            const { data: familyData, error: familyError } = await supabase
              .from('members')
              .select('id, first_name, last_name')
              .eq('household_id', memberProfile.household_id)
              .neq('id', memberProfile.id)

            if (!familyError && familyData) {
              setFamilyMembers(familyData)
            }
          }
        }
      }
    } catch (error) {
      console.error('Error fetching member details:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-slate-600 dark:text-slate-400">Loading profile...</div>
        </div>
      </div>
    )
  }

  if (!member) {
    return (
      <div className="p-8">
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-12 text-center">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">Profile not found</h2>
          <p className="text-slate-600 dark:text-slate-400">Your profile could not be loaded.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 animate-page-enter">
      <div className="max-w-4xl mx-auto">
        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg mb-6">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('profile')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('donations')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'donations'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <DollarSign size={18} />
              Contributions
            </button>
            <button
              onClick={() => setActiveTab('case-history')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'case-history'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <FileText size={18} />
              Case History
            </button>
            <button
              onClick={() => setActiveTab('family')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                activeTab === 'family'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Users size={18} />
              Family
            </button>
          </div>
        </div>

        {/* Profile Tab Content */}
        {activeTab === 'profile' && (
          <>
            {/* Profile Card */}
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8 mb-6">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2">
                    {member.first_name} {member.last_name}
                  </h1>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 text-sm font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400">
                      {member.role || 'Member'}
                    </span>
                    {household && (
                      <span className="text-slate-600 dark:text-slate-400 text-sm">
                        {household.name}
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => navigate('/portal/profile/edit')}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white rounded-lg transition-colors font-medium"
                >
                  <Edit size={18} />
                  Edit
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div>
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Contact Information</h2>
                  <div className="space-y-3">
                    {member.email && (
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <Mail className="text-slate-400 dark:text-slate-500" size={20} />
                        <a
                          href={`mailto:${member.email}`}
                          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {member.email}
                        </a>
                      </div>
                    )}
                    {member.phone && (
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <Phone className="text-slate-400 dark:text-slate-500" size={20} />
                        <a
                          href={`tel:${member.phone}`}
                          className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                        >
                          {member.phone}
                        </a>
                      </div>
                    )}
                    {member.date_of_birth && (
                      <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                        <Calendar className="text-slate-400 dark:text-slate-500" size={20} />
                        <span>{formatDate(member.date_of_birth)}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (member.membership_status || 'Active') === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                            : (member.membership_status || 'Active') === 'Inactive'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {member.membership_status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Household Information */}
                {household && (
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Household</h2>
                    <div className="space-y-2 text-slate-700 dark:text-slate-300">
                      <div className="font-medium">{household.name}</div>
                      {(household.address || household.city || household.state || household.zip_code) && (
                        <div className="text-sm text-slate-600 dark:text-slate-400">
                          {household.address && <div>{household.address}</div>}
                          {(household.city || household.state || household.zip_code) && (
                            <div>
                              {[household.city, household.state, household.zip_code]
                                .filter(Boolean)
                                .join(', ')}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Notes Section */}
              {member.notes && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Notes</h2>
                  <div className="text-slate-700 dark:text-slate-300 whitespace-pre-wrap bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg min-h-[100px]">
                    {member.notes}
                  </div>
                </div>
              )}

              {/* Note: Emergency contact fields are stored in custom_fields if available */}
            </div>
          </>
        )}

        {/* Donations Tab Content */}
        {activeTab === 'donations' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            {member.id && <DonationsTab memberId={member.id} />}
          </div>
        )}

        {/* Case History Tab Content */}
        {activeTab === 'case-history' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
            {member.id && <CaseHistoryTab memberId={member.id} canEdit={false} />}
          </div>
        )}

        {/* Family Tab Content */}
        {activeTab === 'family' && (
          <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-8">
            {familyMembers.length > 0 ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Users className="text-slate-600 dark:text-slate-400" size={24} />
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Family Members</h2>
                </div>
                <div className="space-y-3">
                  {familyMembers.map((familyMember) => (
                    <div
                      key={familyMember.id}
                      className="flex items-center justify-between p-4 border border-slate-200 dark:border-slate-700 rounded-lg"
                    >
                      <div>
                        <div className="font-medium text-slate-900 dark:text-white">
                          {familyMember.first_name} {familyMember.last_name}
                        </div>
                        <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          Family Member
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <Users className="mx-auto text-slate-400 dark:text-slate-600 mb-4" size={48} />
                <p className="text-slate-600 dark:text-slate-400">No other family members found in this household.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
