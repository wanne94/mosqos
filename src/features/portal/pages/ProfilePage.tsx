import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Mail, Phone, Calendar, Edit, DollarSign, FileText, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'
import { useAuth } from '@/app/providers/AuthProvider'
import { DonationsTab } from '@/features/donations/components/DonationsTab'
import CaseHistoryTab from '@/features/cases/components/CaseHistoryTab'

interface Member {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  job: string | null
  status: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  emergency_contact_name: string | null
  emergency_contact_phone: string | null
  emergency_contact_relationship: string | null
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

type TabType = 'profile' | 'donations' | 'case-history' | 'education' | 'family'

export default function ProfilePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { currentOrganizationId } = useOrganization()
  const { user } = useAuth()
  const [member, setMember] = useState<Member | null>(null)
  const [household, setHousehold] = useState<Household | null>(null)
  const [familyMembers, setFamilyMembers] = useState<Member[]>([])
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

      // Fetch current member
      const { data: memberData, error: memberError } = await supabase
        .from('organization_members')
        .select('*')
        .eq('user_id', user.id)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (memberError) throw memberError
      if (!memberData) return

      setMember(memberData as Member)

      // Fetch household if member has one
      if (memberData.household_id) {
        const { data: householdData, error: householdError } = await supabase
          .from('households')
          .select('id, name, address, city, state, zip_code')
          .eq('id', memberData.household_id)
          .single()

        if (!householdError && householdData) {
          setHousehold(householdData as Household)

          // Fetch family members
          const { data: familyData, error: familyError } = await supabase
            .from('organization_members')
            .select('id, first_name, last_name, role')
            .eq('household_id', memberData.household_id)
            .neq('id', memberData.id)
            .order('role', { ascending: true })

          if (!familyError) {
            setFamilyMembers((familyData || []) as Member[])
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
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Job:</span>
                      <span>{member.job || '—'}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300">
                      <span className="text-slate-400 dark:text-slate-500 font-medium">Status:</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          (member.status || 'Active') === 'Active'
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-400'
                            : (member.status || 'Active') === 'Inactive'
                            ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400'
                            : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
                        }`}
                      >
                        {member.status || 'Active'}
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

              {/* Emergency Contact Section */}
              {(member.emergency_contact_name || member.emergency_contact_phone) && (
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Emergency Contact</h2>
                  <div className="space-y-3 text-slate-700 dark:text-slate-300">
                    {member.emergency_contact_name && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Name:</span>
                        <div className="font-medium">{member.emergency_contact_name}</div>
                      </div>
                    )}
                    {member.emergency_contact_phone && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Phone:</span>
                        <div className="font-medium">
                          <a
                            href={`tel:${member.emergency_contact_phone}`}
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
                          >
                            {member.emergency_contact_phone}
                          </a>
                        </div>
                      </div>
                    )}
                    {member.emergency_contact_relationship && (
                      <div>
                        <span className="text-slate-500 dark:text-slate-400 text-sm">Relationship:</span>
                        <div className="font-medium">{member.emergency_contact_relationship}</div>
                      </div>
                    )}
                  </div>
                </div>
              )}
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
                          {familyMember.role || 'Member'}
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
