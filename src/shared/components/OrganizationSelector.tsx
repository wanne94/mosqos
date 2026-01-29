import { useState, useRef, useEffect } from 'react'
import { ChevronDown, Building2, Check } from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { usePermissions } from '@/features/permissions/hooks'

export interface OrganizationSelectorProps {
  /** Custom class name */
  className?: string
}

/**
 * OrganizationSelector Component
 *
 * Displays a dropdown to switch between organizations user has access to
 * Only renders if user has multiple organizations or is platform admin
 *
 * @example
 * <OrganizationSelector className="w-full" />
 */
export function OrganizationSelector({ className = '' }: OrganizationSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const { currentOrganization, organizations, setCurrentOrganization } = useOrganization()
  const { isPlatformAdmin } = usePermissions()

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const hasMultipleOrganizations = organizations.length > 1

  // Don't render if user has only one organization (and is not platform admin)
  if (!hasMultipleOrganizations && !isPlatformAdmin) {
    return null
  }

  // If no organizations at all, don't render
  if (!currentOrganization && !isPlatformAdmin) {
    return null
  }

  const handleSelectOrganization = (orgId: string) => {
    const membership = organizations.find((m) => m.organization.id === orgId)
    if (membership) {
      setCurrentOrganization(membership.organization)
      setIsOpen(false)
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg transition-colors w-full"
      >
        {currentOrganization?.logo_url ? (
          <img
            src={currentOrganization.logo_url}
            alt={currentOrganization.name}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <Building2 size={20} className="text-slate-400" />
        )}
        <span className="flex-1 text-left truncate">
          {currentOrganization?.name || 'Select Organization'}
        </span>
        <ChevronDown
          size={16}
          className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 rounded-lg bg-slate-800 shadow-lg ring-1 ring-black ring-opacity-5 z-50">
          <div className="py-1">
            <div className="px-3 py-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Your Organizations
            </div>

            {organizations.map((membership) => {
              const org = membership.organization
              const isSelected = currentOrganization?.id === org.id

              // Determine role label
              let roleLabel = 'Member'
              if (membership.isOwner) {
                roleLabel = 'Owner'
              } else if (membership.isDelegate) {
                roleLabel = 'Delegate'
              }

              return (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrganization(org.id)}
                  className={`flex items-center w-full px-3 py-2 text-left hover:bg-slate-700 ${
                    isSelected ? 'bg-slate-700' : ''
                  }`}
                >
                  {org.logo_url ? (
                    <img
                      src={org.logo_url}
                      alt={org.name}
                      className="h-8 w-8 rounded-full object-cover mr-3"
                    />
                  ) : (
                    <div className="h-8 w-8 rounded-full bg-slate-600 flex items-center justify-center mr-3">
                      <Building2 size={16} className="text-slate-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {org.name}
                    </p>
                    <p className="text-xs text-slate-500 truncate">{roleLabel}</p>
                  </div>
                  {isSelected && <Check size={20} className="text-emerald-400 ml-2" />}
                </button>
              )
            })}

            {isPlatformAdmin && (
              <>
                <div className="border-t border-slate-700 my-1" />
                <div className="px-3 py-2">
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-900 text-purple-300">
                    Platform Admin
                  </span>
                  <p className="text-xs text-slate-500 mt-1">
                    You have access to all organizations
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default OrganizationSelector
