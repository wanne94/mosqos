import { useOrganization as useOrganizationContext } from '../app/providers/OrganizationProvider'

interface UseOrganizationReturn {
  currentOrganizationId: string
  organizationName: string
  loading: boolean
  refresh: () => Promise<void>
}

/**
 * Compatibility wrapper around OrganizationProvider's useOrganization hook.
 * Provides a simplified interface for components that only need org ID and name.
 */
export function useOrganization(): UseOrganizationReturn {
  const { currentOrganization, isLoading, refreshOrganizations } = useOrganizationContext()

  return {
    currentOrganizationId: currentOrganization?.id || '',
    organizationName: currentOrganization?.name || '',
    loading: isLoading,
    refresh: refreshOrganizations
  }
}
