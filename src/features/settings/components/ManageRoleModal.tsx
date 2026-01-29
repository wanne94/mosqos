'use client'

import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { X } from 'lucide-react'

interface OrganizationMember {
  id: string
  first_name: string
  last_name: string
  email: string | null
  system_role: string
  permissions: Record<string, boolean>
  user_id: string | null
}

interface ManageRoleModalProps {
  member: OrganizationMember
  onClose: () => void
  onSuccess: () => void
}

interface Permissions {
  dashboard: boolean
  finance: boolean
  education: boolean
  services: boolean
  umrah: boolean
  people: boolean
  settings: boolean
}

export function ManageRoleModal({ member, onClose, onSuccess }: ManageRoleModalProps) {
  const { t } = useTranslation()

  // Determine initial role and permissions
  const isAdminRole = ['admin', 'super_admin', 'finance_admin', 'education_admin', 'services_admin', 'umrah_admin', 'people_admin'].includes(member.system_role)

  const [selectedRole, setSelectedRole] = useState<'member' | 'admin'>(isAdminRole ? 'admin' : 'member')

  // Initialize permissions from stored permissions or role-based defaults
  const [selectedPermissions, setSelectedPermissions] = useState<Permissions>(() => {
    const storedPerms = member.permissions || {}

    if (Object.keys(storedPerms).length > 0) {
      return {
        dashboard: storedPerms.dashboard === true,
        finance: storedPerms.finance === true,
        education: storedPerms.education === true,
        services: storedPerms.services === true,
        umrah: storedPerms.umrah === true,
        people: storedPerms.people === true,
        settings: storedPerms.settings === true,
      }
    }

    // Fall back to role-based permissions
    const isFullAdmin = ['admin', 'super_admin'].includes(member.system_role)
    return {
      dashboard: isFullAdmin,
      finance: isFullAdmin || member.system_role === 'finance_admin',
      education: isFullAdmin || member.system_role === 'education_admin',
      services: isFullAdmin || member.system_role === 'services_admin',
      umrah: isFullAdmin || member.system_role === 'umrah_admin',
      people: isFullAdmin || member.system_role === 'people_admin',
      settings: isFullAdmin,
    }
  })

  const saveRoleMutation = useMutation({
    mutationFn: async () => {
      let systemRole = 'member'
      let permissionsData = {}

      if (selectedRole === 'admin') {
        permissionsData = {
          dashboard: selectedPermissions.dashboard || false,
          finance: selectedPermissions.finance || false,
          education: selectedPermissions.education || false,
          services: selectedPermissions.services || false,
          umrah: selectedPermissions.umrah || false,
          people: selectedPermissions.people || false,
          settings: selectedPermissions.settings || false,
        }

        // Count how many permissions are selected
        const permissionCount = Object.values(permissionsData).filter(Boolean).length

        // If all 7 permissions are selected, make them full admin
        if (permissionCount === 7) {
          systemRole = 'admin'
        } else if (permissionCount === 0) {
          // No permissions selected - keep as member
          systemRole = 'member'
          permissionsData = {}
        } else {
          // Count only the 5 main module permissions
          const mainModuleCount = [
            selectedPermissions.finance,
            selectedPermissions.education,
            selectedPermissions.services,
            selectedPermissions.umrah,
            selectedPermissions.people
          ].filter(Boolean).length

          // Determine specific admin role based on main module permissions
          if (selectedPermissions.finance && mainModuleCount === 1) {
            systemRole = 'finance_admin'
          } else if (selectedPermissions.education && mainModuleCount === 1) {
            systemRole = 'education_admin'
          } else if (selectedPermissions.services && mainModuleCount === 1) {
            systemRole = 'services_admin'
          } else if (selectedPermissions.umrah && mainModuleCount === 1) {
            systemRole = 'umrah_admin'
          } else if (selectedPermissions.people && mainModuleCount === 1) {
            systemRole = 'people_admin'
          } else {
            // Multiple permissions selected - set role to 'admin'
            systemRole = 'admin'
          }
        }
      }

      // @ts-ignore - Supabase type generation issue with JSONB columns
      const { error } = await supabase
        .from('organization_members')
        .update({
          system_role: systemRole,
          permissions: permissionsData
        })
        .eq('id', member.id)

      if (error) throw error

      if (error) throw error

      // Check if we updated the current user's role
      const { data: { user } } = await supabase.auth.getUser()
      if (user && member.user_id === user.id) {
        // Force a page reload to refresh permissions
        window.location.reload()
      }
    },
    onSuccess: () => {
      onSuccess()
      onClose()
    }
  })

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
            {t('settings.manageRole')} - {member.first_name} {member.last_name}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto flex-1">
          {/* Step 1: Select Member or Admin */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
              {t('common.selectRoleType')}
            </label>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'member'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="member"
                  checked={selectedRole === 'member'}
                  onChange={(e) => {
                    setSelectedRole(e.target.value as 'member')
                    // Reset permissions when switching to member
                    setSelectedPermissions({
                      dashboard: false,
                      finance: false,
                      education: false,
                      services: false,
                      umrah: false,
                      people: false,
                      settings: false,
                    })
                  }}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{t('settings.member')} (Default - Limited Access)</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Access to personal dashboard and profile only</div>
                </div>
              </label>

              <label className={`flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedRole === 'admin'
                  ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'border-slate-200 dark:border-slate-600 hover:border-slate-300 dark:hover:border-slate-500'
              }`}>
                <input
                  type="radio"
                  name="role"
                  value="admin"
                  checked={selectedRole === 'admin'}
                  onChange={(e) => setSelectedRole(e.target.value as 'admin')}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="font-medium text-slate-900 dark:text-slate-100">{t('settings.admin')} (Full Access)</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mt-1">Access to admin portal with customizable module permissions</div>
                </div>
              </label>
            </div>
          </div>

          {/* Step 2: Select Admin Permissions */}
          {selectedRole === 'admin' && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">
                {t('settings.selectPermissions')}
              </label>
              <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
                Choose which modules this admin can access. Select all for full access.
              </p>
              <div className="space-y-3">
                {[
                  { key: 'dashboard', label: t('settings.dashboard'), desc: 'View admin dashboard and overview' },
                  { key: 'finance', label: t('settings.finance'), desc: 'Donations, Expenses, and Financial Reports' },
                  { key: 'education', label: t('settings.education'), desc: 'Classes, enrollments, and evaluations' },
                  { key: 'services', label: t('settings.caseManagement'), desc: 'Service cases and assistance tracking' },
                  { key: 'umrah', label: t('settings.hajjUmrah'), desc: 'Trip management and pilgrim registration' },
                  { key: 'people', label: t('settings.people'), desc: 'Member and household management' },
                  { key: 'settings', label: t('settings.settings'), desc: 'Access management and system settings' },
                ].map((perm) => (
                  <label key={perm.key} className="flex items-center gap-3 p-3 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedPermissions[perm.key as keyof Permissions]}
                      onChange={(e) => setSelectedPermissions(prev => ({ ...prev, [perm.key]: e.target.checked }))}
                      className="rounded border-slate-300 dark:border-slate-600 text-emerald-600 focus:ring-emerald-500"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-slate-900 dark:text-slate-100">{perm.label}</div>
                      <div className="text-sm text-slate-500 dark:text-slate-400">{perm.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Fixed Footer with Buttons */}
        <div className="p-6 border-t border-slate-200 dark:border-slate-700 flex gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => saveRoleMutation.mutate()}
            disabled={saveRoleMutation.isPending}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {saveRoleMutation.isPending ? t('people.saving') : t('common.saveRole')}
          </button>
        </div>
      </div>
    </div>
  )
}
