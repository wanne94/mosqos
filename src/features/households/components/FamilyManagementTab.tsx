import { useState, useEffect } from 'react'
import { Users, Edit, Home } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import type { Household } from '../types/households.types'
import type { Member } from '@/features/members/types/members.types'
import { EditHouseholdModal } from './EditHouseholdModal'

export interface FamilyManagementTabProps {
  /** ID of the current member viewing the tab */
  memberId: string
  /** ID of the household (if any) */
  householdId?: string | null
  /** Whether this is the user's own profile */
  isOwnProfile?: boolean
}

/**
 * Tab component for managing family/household information
 *
 * @example
 * <FamilyManagementTab
 *   memberId="123"
 *   householdId="456"
 *   isOwnProfile={true}
 * />
 */
export function FamilyManagementTab({
  memberId,
  householdId,
  isOwnProfile = true,
}: FamilyManagementTabProps) {
  const { currentOrganization } = useOrganization()
  const [familyMembers, setFamilyMembers] = useState<Member[]>([])
  const [household, setHousehold] = useState<Household | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditHouseholdModalOpen, setIsEditHouseholdModalOpen] = useState(false)

  useEffect(() => {
    if (memberId) {
      fetchFamilyData()
    }
  }, [memberId, householdId])

  const fetchFamilyData = async () => {
    if (!currentOrganization?.id) return

    try {
      setLoading(true)

      // Fetch household if exists
      if (householdId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: householdData, error: householdError } = await (supabase as any)
          .from('households')
          .select('*')
          .eq('id', householdId)
          .eq('organization_id', currentOrganization.id)
          .single()

        if (householdError) {
          console.error('Error fetching household:', householdError)
          setHousehold(null)
        } else {
          setHousehold(householdData as Household)
        }
      } else {
        setHousehold(null)
      }

      // Fetch family members
      if (householdId) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: familyData, error: familyError } = await (supabase as any)
          .from('members')
          .select('*')
          .eq('household_id', householdId)
          .eq('organization_id', currentOrganization.id)
          .order('membership_type', { ascending: true })
          .order('first_name', { ascending: true })

        if (familyError) {
          console.error('Error fetching family members:', familyError)
          setFamilyMembers([])
        } else {
          setFamilyMembers((familyData || []) as Member[])
        }
      } else {
        setFamilyMembers([])
      }
    } catch (error) {
      console.error('Error fetching family data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateHousehold = async () => {
    if (!currentOrganization?.id) return

    try {
      // Get current member's name for household name
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: memberData } = await (supabase as any)
        .from('members')
        .select('first_name, last_name')
        .eq('id', memberId)
        .eq('organization_id', currentOrganization.id)
        .single()

      const householdName = memberData
        ? `${memberData.first_name} ${memberData.last_name} Family`
        : 'My Family'

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: newHousehold, error } = await (supabase as any)
        .from('households')
        .insert([{ name: householdName, organization_id: currentOrganization.id }])
        .select()
        .single()

      if (error) throw error

      // Update current member to link to new household
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('members')
        .update({ household_id: newHousehold.id })
        .eq('id', memberId)

      if (updateError) throw updateError

      alert('Household created successfully!')
      fetchFamilyData()
    } catch (error) {
      console.error('Error creating household:', error)
      alert('Failed to create household.')
    }
  }

  const handleUnlinkMember = async (memberIdToUnlink: string) => {
    if (!confirm('Are you sure you want to remove this member from your family?')) {
      return
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('members')
        .update({ household_id: null })
        .eq('id', memberIdToUnlink)

      if (error) throw error

      alert('Member removed from family.')
      fetchFamilyData()
    } catch (error) {
      console.error('Error unlinking member:', error)
      alert('Failed to remove member.')
    }
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-600 dark:text-slate-400">
        Loading family information...
      </div>
    )
  }

  return (
    <div className="p-6">
      {/* Household Information Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Home className="text-slate-600 dark:text-slate-400" size={24} />
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Family Information
            </h2>
          </div>
          {household && isOwnProfile && (
            <button
              onClick={() => setIsEditHouseholdModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 border border-emerald-300 dark:border-emerald-700 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
            >
              <Edit size={16} />
              Edit Family Info
            </button>
          )}
        </div>

        {household ? (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">Family Name</p>
                <p className="font-medium text-slate-900 dark:text-white">{household.name}</p>
              </div>
              {(household.address ||
                household.city ||
                household.state ||
                household.postal_code) && (
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Address</p>
                  <p className="text-slate-900 dark:text-white">
                    {household.address && <span>{household.address}</span>}
                    {(household.city || household.state || household.postal_code) && (
                      <span className="block">
                        {[household.city, household.state, household.postal_code]
                          .filter(Boolean)
                          .join(', ')}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 text-center">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              No family household created yet.
            </p>
            {isOwnProfile && (
              <button
                onClick={handleCreateHousehold}
                className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                <Home size={18} />
                Create Family Household
              </button>
            )}
          </div>
        )}
      </div>

      {/* Family Members Section */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <Users className="text-slate-600 dark:text-slate-400" size={24} />
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Family Members
          </h2>
        </div>

        {familyMembers.length > 0 ? (
          <div className="space-y-3">
            {familyMembers.map((member) => (
              <div
                key={member.id}
                className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center">
                      <Users className="text-emerald-600 dark:text-emerald-400" size={20} />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {member.first_name} {member.last_name}
                        {member.id === memberId && (
                          <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">
                            (You)
                          </span>
                        )}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {member.membership_type || 'Member'}
                        </span>
                        {member.email && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {member.email}
                          </span>
                        )}
                        {member.phone && (
                          <span className="text-sm text-slate-500 dark:text-slate-400">
                            {member.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {isOwnProfile && member.id !== memberId && (
                    <button
                      onClick={() => handleUnlinkMember(member.id)}
                      className="px-3 py-1 text-sm text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-slate-50 dark:bg-slate-900 rounded-lg p-6 border border-slate-200 dark:border-slate-700 text-center">
            <Users className="mx-auto text-slate-400 dark:text-slate-600 mb-3" size={48} />
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              {household
                ? 'No other family members in this household.'
                : 'Create a household first to add family members.'}
            </p>
          </div>
        )}
      </div>

      {/* Edit Household Modal */}
      {household && (
        <EditHouseholdModal
          isOpen={isEditHouseholdModalOpen}
          onClose={() => setIsEditHouseholdModalOpen(false)}
          onSave={fetchFamilyData}
          householdId={household.id}
        />
      )}
    </div>
  )
}

export default FamilyManagementTab
