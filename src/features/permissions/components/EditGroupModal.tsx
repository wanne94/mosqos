import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Users, Save } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { usePermissionGroups, usePermissionGroup, usePermissionsByModule } from '../hooks'
import type { Permission } from '../types/permissions.types'

interface EditGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  groupId: string | null
}

export function EditGroupModal({ isOpen, onClose, onSuccess, groupId }: EditGroupModalProps) {
  const { t } = useTranslation()
  const { currentOrganization } = useOrganization()
  const currentOrganizationId = currentOrganization?.id
  const { updateGroup, isUpdating } = usePermissionGroups({
    organizationId: currentOrganizationId || undefined,
  })
  const { data: group, isLoading: isLoadingGroup } = usePermissionGroup(groupId || undefined)
  const { permissionsByModule, isLoading: isLoadingPermissions } = usePermissionsByModule()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedPermissions, setSelectedPermissions] = useState<Set<string>>(new Set())

  // Populate form when group data loads
  useEffect(() => {
    if (isOpen && group) {
      setName(group.name)
      setDescription(group.description || '')
      setSelectedPermissions(new Set(group.permissions.map((p) => p.id)))
    }
  }, [isOpen, group])

  const handleTogglePermission = (permissionId: string) => {
    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (next.has(permissionId)) {
        next.delete(permissionId)
      } else {
        next.add(permissionId)
      }
      return next
    })
  }

  const handleToggleModule = (permissions: Permission[]) => {
    const modulePermissionIds = permissions.map((p) => p.id)
    const allSelected = modulePermissionIds.every((id) => selectedPermissions.has(id))

    setSelectedPermissions((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        modulePermissionIds.forEach((id) => next.delete(id))
      } else {
        modulePermissionIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!groupId || !name.trim()) {
      toast.error(t('nameRequired', 'Group name is required'))
      return
    }

    try {
      await updateGroup({
        id: groupId,
        input: {
          name: name.trim(),
          description: description.trim() || undefined,
          permission_ids: Array.from(selectedPermissions),
        },
      })

      toast.success(t('groupUpdated', 'Permission group updated'))
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(t('updateError', 'Failed to update group'), { description: error.message })
    }
  }

  if (!isOpen) return null

  const isLoading = isLoadingGroup || isLoadingPermissions
  const isSystemGroup = group?.is_system

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Users className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
                {t('editGroup', 'Edit Permission Group')}
              </h2>
              {isSystemGroup && (
                <p className="text-xs text-amber-600 dark:text-amber-400">
                  {t('systemGroupNote', 'System group - name cannot be changed')}
                </p>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center p-12">
            <div className="animate-spin h-8 w-8 border-4 border-emerald-500 border-t-transparent rounded-full" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
            <div className="p-6 space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('groupName', 'Group Name')} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('groupNamePlaceholder', 'e.g., Finance Team, Education Admins')}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
                  required
                  disabled={isSystemGroup}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('description', 'Description')}
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder={t('descriptionPlaceholder', 'Describe what this group can access...')}
                  rows={2}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-y disabled:opacity-50"
                  disabled={isSystemGroup}
                />
              </div>

              {/* Permissions */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                  {t('permissions', 'Permissions')}
                </label>

                <div className="space-y-4 max-h-80 overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-lg p-4">
                  {Object.entries(permissionsByModule).map(([module, permissions]) => {
                    const modulePermissionIds = permissions.map((p) => p.id)
                    const allSelected = modulePermissionIds.every((id) =>
                      selectedPermissions.has(id)
                    )
                    const someSelected =
                      !allSelected &&
                      modulePermissionIds.some((id) => selectedPermissions.has(id))

                    return (
                      <div
                        key={module}
                        className="border border-slate-200 dark:border-slate-600 rounded-lg"
                      >
                        {/* Module Header */}
                        <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200 dark:border-slate-600">
                          <input
                            type="checkbox"
                            checked={allSelected}
                            ref={(input) => {
                              if (input) {
                                input.indeterminate = someSelected
                              }
                            }}
                            onChange={() => handleToggleModule(permissions)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="font-medium text-slate-900 dark:text-white capitalize">
                            {module.replace(/_/g, ' ')}
                          </span>
                          <span className="text-xs text-slate-500 dark:text-slate-400">
                            ({permissions.length})
                          </span>
                        </div>

                        {/* Permissions */}
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {permissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex items-start gap-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700/30 p-1 rounded"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissions.has(permission.id)}
                                onChange={() => handleTogglePermission(permission.id)}
                                className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 mt-0.5"
                              />
                              <div>
                                <span className="text-sm text-slate-900 dark:text-white">
                                  {permission.name}
                                </span>
                                {permission.description && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {permission.description}
                                  </p>
                                )}
                              </div>
                            </label>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                  {t('selectedCount', '{{count}} permissions selected', {
                    count: selectedPermissions.size,
                  })}
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                {t('cancel', 'Cancel')}
              </button>
              <button
                type="submit"
                disabled={isUpdating || !name.trim()}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? (
                  <>
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                    {t('saving', 'Saving...')}
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    {t('saveChanges', 'Save Changes')}
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
