'use client'

import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Shield, Plus, Search, Users, Lock } from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { usePermissionGroups } from '../hooks'
import {
  CreateGroupModal,
  EditGroupModal,
  DeleteGroupModal,
  PermissionGroupCard,
  GroupMembersPanel,
} from '../components'

export default function PermissionsPage() {
  const { t } = useTranslation()
  const { currentOrganization } = useOrganization()
  const currentOrganizationId = currentOrganization?.id
  const { groups, isLoading, refetch } = usePermissionGroups({
    organizationId: currentOrganizationId || undefined,
  })

  const [searchTerm, setSearchTerm] = useState('')
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editGroupId, setEditGroupId] = useState<string | null>(null)
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null)
  const [viewMembersGroupId, setViewMembersGroupId] = useState<string | null>(null)

  const filteredGroups = groups.filter((group) => {
    const search = searchTerm.toLowerCase()
    return (
      group.name.toLowerCase().includes(search) ||
      group.description?.toLowerCase().includes(search)
    )
  })

  const systemGroups = filteredGroups.filter((g) => g.is_system)
  const customGroups = filteredGroups.filter((g) => !g.is_system)
  const selectedGroup = groups.find((g) => g.id === viewMembersGroupId)

  return (
    <div className="p-8 animate-page-enter">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-3">
              <Shield className="text-emerald-600 dark:text-emerald-400" size={32} />
              {t('title', 'Permissions')}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {t('subtitle', 'Manage permission groups and access control')}
            </p>
          </div>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
          >
            <Plus size={18} />
            {t('createGroup', 'Create Group')}
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t('searchGroups', 'Search groups...')}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Content */}
      <div className="flex gap-8">
        {/* Groups List */}
        <div className="flex-1">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
            </div>
          ) : filteredGroups.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
              <Shield className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                {searchTerm
                  ? t('noGroupsFound', 'No groups found')
                  : t('noGroups', 'No permission groups yet')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                {searchTerm
                  ? t('tryDifferentSearch', 'Try a different search term')
                  : t('createFirstGroup', 'Create your first permission group to manage access')}
              </p>
              {!searchTerm && (
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={18} />
                  {t('createGroup', 'Create Group')}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-8">
              {/* System Groups */}
              {systemGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Lock className="text-amber-600 dark:text-amber-400" size={18} />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('systemGroups', 'System Groups')}
                    </h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ({systemGroups.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {systemGroups.map((group) => (
                      <PermissionGroupCard
                        key={group.id}
                        group={group}
                        onEdit={() => setEditGroupId(group.id)}
                        onDelete={() => setDeleteGroupId(group.id)}
                        onViewMembers={() => setViewMembersGroupId(group.id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Custom Groups */}
              {customGroups.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Users className="text-emerald-600 dark:text-emerald-400" size={18} />
                    <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                      {t('customGroups', 'Custom Groups')}
                    </h2>
                    <span className="text-sm text-slate-500 dark:text-slate-400">
                      ({customGroups.length})
                    </span>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {customGroups.map((group) => (
                      <PermissionGroupCard
                        key={group.id}
                        group={group}
                        onEdit={() => setEditGroupId(group.id)}
                        onDelete={() => setDeleteGroupId(group.id)}
                        onViewMembers={() => setViewMembersGroupId(group.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Members Panel */}
        {viewMembersGroupId && selectedGroup && (
          <div className="w-96 flex-shrink-0">
            <div className="sticky top-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-slate-900 dark:text-white">
                  {selectedGroup.name}
                </h3>
                <button
                  onClick={() => setViewMembersGroupId(null)}
                  className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                >
                  {t('close', 'Close')}
                </button>
              </div>
              <GroupMembersPanel groupId={viewMembersGroupId} groupName={selectedGroup.name} />
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateGroupModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <EditGroupModal
        isOpen={!!editGroupId}
        onClose={() => setEditGroupId(null)}
        onSuccess={() => refetch()}
        groupId={editGroupId}
      />

      <DeleteGroupModal
        isOpen={!!deleteGroupId}
        onClose={() => setDeleteGroupId(null)}
        onSuccess={() => {
          refetch()
          if (viewMembersGroupId === deleteGroupId) {
            setViewMembersGroupId(null)
          }
        }}
        groupId={deleteGroupId}
      />
    </div>
  )
}
