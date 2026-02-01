import { useTranslation } from 'react-i18next'
import { X, Trash2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { usePermissionGroups, usePermissionGroup } from '../hooks'

interface DeleteGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: () => void
  groupId: string | null
}

export function DeleteGroupModal({ isOpen, onClose, onSuccess, groupId }: DeleteGroupModalProps) {
  const { t } = useTranslation()
  const { currentOrganization } = useOrganization()
  const currentOrganizationId = currentOrganization?.id
  const { deleteGroup, isDeleting } = usePermissionGroups({
    organizationId: currentOrganizationId || undefined,
  })
  const { data: group, isLoading } = usePermissionGroup(groupId || undefined)

  const handleDelete = async () => {
    if (!groupId) return

    try {
      await deleteGroup(groupId)
      toast.success(t('groupDeleted', 'Permission group deleted'))
      onSuccess?.()
      onClose()
    } catch (error: any) {
      toast.error(t('deleteError', 'Failed to delete group'), { description: error.message })
    }
  }

  if (!isOpen) return null

  const isSystemGroup = group?.is_system

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <Trash2 className="text-red-600 dark:text-red-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {t('deleteGroup', 'Delete Permission Group')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-red-500 border-t-transparent rounded-full" />
            </div>
          ) : isSystemGroup ? (
            <div className="flex items-start gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
              <AlertTriangle className="text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  {t('cannotDeleteSystem', 'Cannot delete system group')}
                </p>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  {t('systemGroupProtected', 'System groups are protected and cannot be deleted. You can only modify their permissions.')}
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <AlertTriangle className="text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-medium text-red-800 dark:text-red-200">
                    {t('deleteWarningTitle', 'Are you sure you want to delete this group?')}
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                    {t('deleteWarningMessage', 'This action cannot be undone. All members in this group will lose their permissions.')}
                  </p>
                </div>
              </div>

              {group && (
                <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <p className="font-medium text-slate-900 dark:text-white">{group.name}</p>
                  {group.description && (
                    <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                      {group.description}
                    </p>
                  )}
                </div>
              )}
            </>
          )}
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
          {!isSystemGroup && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting || isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isDeleting ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('deleting', 'Deleting...')}
                </>
              ) : (
                <>
                  <Trash2 size={16} />
                  {t('delete', 'Delete Group')}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
