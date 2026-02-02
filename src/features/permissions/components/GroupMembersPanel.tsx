import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Users, UserPlus, UserMinus, Search, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useGroupMembers } from '../hooks'

interface GroupMembersPanelProps {
  groupId: string
  groupName: string
}

export function GroupMembersPanel({ groupId }: GroupMembersPanelProps) {
  const { t } = useTranslation()
  const { currentOrganization } = useOrganization()
  const currentOrganizationId = currentOrganization?.id
  const {
    members,
    isLoading,
    availableMembers,
    isLoadingAvailable,
    addMember,
    isAdding,
    removeMember,
    isRemoving,
  } = useGroupMembers({
    groupId,
    organizationId: currentOrganizationId || undefined,
  })

  const [showAddMember, setShowAddMember] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [removingMemberId, setRemovingMemberId] = useState<string | null>(null)

  const handleAddMember = async (memberId: string) => {
    try {
      await addMember(memberId)
      toast.success(t('memberAdded', 'Member added to group'))
    } catch (error: any) {
      toast.error(t('addMemberError', 'Failed to add member'), { description: error.message })
    }
  }

  const handleRemoveMember = async (memberId: string) => {
    setRemovingMemberId(memberId)
    try {
      await removeMember(memberId)
      toast.success(t('memberRemoved', 'Member removed from group'))
    } catch (error: any) {
      toast.error(t('removeMemberError', 'Failed to remove member'), { description: error.message })
    } finally {
      setRemovingMemberId(null)
    }
  }

  const filteredAvailableMembers = availableMembers.filter((member) => {
    const fullName = `${member.first_name} ${member.last_name}`.toLowerCase()
    const email = member.email?.toLowerCase() || ''
    const search = searchTerm.toLowerCase()
    return fullName.includes(search) || email.includes(search)
  })

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Users className="text-slate-500 dark:text-slate-400" size={20} />
          <h3 className="font-medium text-slate-900 dark:text-white">
            {t('groupMembers', 'Group Members')}
          </h3>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            ({members.length})
          </span>
        </div>
        <button
          onClick={() => setShowAddMember(!showAddMember)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
        >
          <UserPlus size={16} />
          {t('addMember', 'Add Member')}
        </button>
      </div>

      {/* Add Member Panel */}
      {showAddMember && (
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('searchMembers', 'Search members...')}
              className="w-full pl-9 pr-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          {isLoadingAvailable ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="animate-spin text-slate-400" size={24} />
            </div>
          ) : filteredAvailableMembers.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">
              {searchTerm
                ? t('noMembersFound', 'No members found')
                : t('allMembersAdded', 'All members are already in this group')}
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto space-y-1">
              {filteredAvailableMembers.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-white dark:hover:bg-slate-700"
                >
                  <div className="flex items-center gap-3">
                    {/* Member initials only */}
                    <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                      <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                        {member.first_name?.[0]}
                        {member.last_name?.[0]}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {member.first_name} {member.last_name}
                      </p>
                      {member.email && (
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {member.email}
                        </p>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => handleAddMember(member.id)}
                    disabled={isAdding}
                    className="px-2 py-1 text-xs bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded hover:bg-emerald-200 dark:hover:bg-emerald-900/50 disabled:opacity-50"
                  >
                    {isAdding ? <Loader2 className="animate-spin" size={14} /> : t('add', 'Add')}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Members List */}
      <div className="p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="animate-spin text-slate-400" size={32} />
          </div>
        ) : members.length === 0 ? (
          <div className="text-center py-8">
            <Users className="mx-auto text-slate-300 dark:text-slate-600 mb-2" size={40} />
            <p className="text-slate-500 dark:text-slate-400">
              {t('noMembers', 'No members in this group yet')}
            </p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
              {t('addMembersHint', 'Click "Add Member" to assign members to this group')}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members.map((gm) => (
              <div
                key={gm.id}
                className="flex items-center justify-between p-3 rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700/50"
              >
                <div className="flex items-center gap-3">
                  {/* Member initials only */}
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-slate-600 dark:text-slate-300">
                      {gm.member.first_name?.[0]}
                      {gm.member.last_name?.[0]}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {gm.member.first_name} {gm.member.last_name}
                    </p>
                    {gm.member.email && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {gm.member.email}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveMember(gm.member_id)}
                  disabled={isRemoving && removingMemberId === gm.member_id}
                  className="p-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50"
                  title={t('removeMember', 'Remove from group')}
                >
                  {isRemoving && removingMemberId === gm.member_id ? (
                    <Loader2 className="animate-spin" size={18} />
                  ) : (
                    <UserMinus size={18} />
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
