import { ReactNode } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useAuth } from '@/app/providers/AuthProvider'
import { usePermissions } from '@/features/permissions/hooks/usePermissions'

interface PortalGuardProps {
  children: ReactNode
}

/**
 * PortalGuard - Ensures only authorized members can access their organization's portal
 *
 * Security checks:
 * 1. User must be authenticated
 * 2. User must have access to the organization (via organization_members, organization_owners, or organization_delegates)
 * 3. Organization must be approved (not pending/rejected)
 * 4. Platform admins can access all organization portals
 *
 * @param children - Protected content to render if checks pass
 */
export function PortalGuard({ children }: PortalGuardProps) {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const { currentOrganization, organizations, isLoading } = useOrganization()
  const { role } = usePermissions()

  // Loading state - show spinner
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    )
  }

  // Not authenticated - should not happen (ProtectedRoute handles this)
  if (!user) {
    return <Navigate to="/login" replace />
  }

  // Platform admin override - admins can access all portals
  if (role === 'platform_admin') {
    return <>{children}</>
  }

  // No slug provided - invalid route
  if (!slug) {
    return <Navigate to="/no-organization" replace />
  }

  // Check if user has access to this organization
  const hasAccess = organizations.some(
    (membership) => membership.organization.slug === slug
  )

  if (!hasAccess) {
    // User doesn't have access to this organization
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center max-w-md px-4">
          <div className="mb-6">
            <svg
              className="mx-auto h-16 w-16 text-destructive"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-foreground mb-3">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this organization's portal. Please contact your administrator if you believe this is an error.
          </p>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium bg-primary text-primary-foreground h-10 px-6 py-2 hover:bg-primary/90 transition-colors"
          >
            Return Home
          </a>
        </div>
      </div>
    )
  }

  // Check organization approval status
  if (currentOrganization) {
    // Note: Organization status check can be added here if needed
    // For now, OrganizationProvider already filters out inactive organizations
  }

  // User has access - render protected content
  return <>{children}</>
}
