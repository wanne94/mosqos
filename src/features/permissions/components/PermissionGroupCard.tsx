import { useTranslation } from 'react-i18next'
import { Users, Shield, Edit, Trash2, Lock } from 'lucide-react'
import type { PermissionGroupSummary } from '../types/permissions.types'

interface PermissionGroupCardProps {
  group: PermissionGroupSummary
  onEdit: () => void
  onDelete: () => void
  onViewMembers: () => void
}

export function PermissionGroupCard({
  group,
  onEdit,
  onDelete,
  onViewMembers,
}: PermissionGroupCardProps) {
  const { t } = useTranslation()

  return (
    <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-lg ${
                group.is_system
                  ? 'bg-amber-100 dark:bg-amber-900/30'
                  : 'bg-emerald-100 dark:bg-emerald-900/30'
              }`}
            >
              {group.is_system ? (
                <Lock
                  className="text-amber-600 dark:text-amber-400"
                  size={20}
                />
              ) : (
                <Shield
                  className="text-emerald-600 dark:text-emerald-400"
                  size={20}
                />
              )}
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
                {group.name}
                {group.is_system && (
                  <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">
                    {t('system', 'System')}
                  </span>
                )}
              </h3>
              {group.description && (
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  {group.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1">
            <Shield size={14} />
            <span>
              {group.permission_count} {t('permissions', 'permissions')}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Users size={14} />
            <span>
              {group.member_count} {t('members', 'members')}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button
            onClick={onViewMembers}
            className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
          >
            <Users size={16} />
            {t('viewMembers', 'Members')}
          </button>
          <button
            onClick={onEdit}
            className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
            title={t('editGroup', 'Edit Group')}
          >
            <Edit size={16} />
          </button>
          {!group.is_system && (
            <button
              onClick={onDelete}
              className="flex items-center justify-center gap-2 px-3 py-2 text-sm bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/50 transition-colors"
              title={t('deleteGroup', 'Delete Group')}
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
