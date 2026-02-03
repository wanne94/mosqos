import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthProvider'
import { supabase } from '@/lib/supabase/client'

interface Organization {
  id: string
  name: string
  slug: string
  logo_url: string | null
  settings: Record<string, unknown> | null
  country_id: string | null
  // Address
  address_line1: string | null
  address_line2: string | null
  city: string | null
  state: string | null
  postal_code: string | null
  // Contact
  contact_email: string | null
  contact_phone: string | null
  website: string | null
}

interface OrganizationMembership {
  organization: Organization
  isOwner: boolean
  isDelegate: boolean
  permissions: string[]
}

interface OrganizationContextType {
  currentOrganization: Organization | null
  organizations: OrganizationMembership[]
  isLoading: boolean
  setCurrentOrganization: (org: Organization | null) => void
  refreshOrganizations: () => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

// Mock organization for dev mode
const DEV_ORGANIZATION: Organization = {
  id: 'dev-org-id',
  name: 'Green Lane Masjid',
  slug: 'green-lane-masjid',
  logo_url: null,
  settings: {},
  country_id: null,
  // Address
  address_line1: '123 Main Street',
  address_line2: null,
  city: 'Birmingham',
  state: 'West Midlands',
  postal_code: 'B10 0RG',
  // Contact
  contact_email: 'info@greenlane.org',
  contact_phone: '+44 121 123 4567',
  website: 'https://greenlane.org',
}

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isDevMode } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()

  // Extract slug from pathname since OrganizationProvider is outside of Routes
  // URL patterns: /:slug/admin/... or /:slug/portal/...
  const pathParts = location.pathname.split('/').filter(Boolean)
  const slug = pathParts.length > 0 && (pathParts[1] === 'admin' || pathParts[1] === 'portal')
    ? pathParts[0]
    : undefined

  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null)
  const [organizations, setOrganizations] = useState<OrganizationMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([])
      setCurrentOrganization(null)
      setIsLoading(false)
      return
    }

    // Dev mode: use mock data
    if (isDevMode) {
      const userRole = user.user_metadata?.role as string

      // Platform admin has access to all organizations (use DEV_ORGANIZATION for testing)
      if (userRole === 'admin') {
        const membership: OrganizationMembership = {
          organization: DEV_ORGANIZATION,
          isOwner: true,
          isDelegate: true,
          permissions: ['*'],
        }
        setOrganizations([membership])
        // Set current organization if on an org-specific route
        if (slug) {
          setCurrentOrganization(DEV_ORGANIZATION)
        }
        setIsLoading(false)
        return
      }

      // Imam (owner) and member users have access to dev organization
      const membership: OrganizationMembership = {
        organization: DEV_ORGANIZATION,
        isOwner: userRole === 'imam',
        isDelegate: userRole === 'imam',
        permissions: userRole === 'imam' ? ['*'] : [],
      }

      setOrganizations([membership])

      // Auto-set current organization for non-platform routes
      if (slug === DEV_ORGANIZATION.slug || slug) {
        setCurrentOrganization(DEV_ORGANIZATION)
      }

      setIsLoading(false)
      return
    }

    try {
      // First check if user is a platform admin
      const { data: platformAdmin } = await supabase
        .from('platform_admins')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      const isPlatformAdmin = !!platformAdmin

      // Platform admins can access ALL organizations
      if (isPlatformAdmin) {
        // Fetch all active organizations
        const { data: allOrgs } = await supabase
          .from('organizations')
          .select('*')
          .eq('is_active', true)
          .order('name')

        const memberships: OrganizationMembership[] = (allOrgs || []).map((org) => ({
          organization: org as Organization,
          isOwner: true, // Platform admins have full access
          isDelegate: true,
          permissions: ['*'],
        }))

        setOrganizations(memberships)

        // Set current organization based on slug
        if (slug) {
          const org = memberships.find(m => m.organization.slug === slug)
          if (org) {
            setCurrentOrganization(org.organization)
          }
        }

        setIsLoading(false)
        return
      }

      // Non-platform admin: fetch user's organization memberships
      // Use type assertion for tables not in generated types
      const db = supabase as unknown as {
        from: (table: string) => {
          select: (query: string) => {
            eq: (column: string, value: string) => Promise<{ data: Array<{ organization: Organization }> | null }>
          }
        }
      }

      // Fetch organizations where user is owner
      const { data: ownedOrgs } = await db
        .from('organization_owners')
        .select('organization:organizations(*)')
        .eq('user_id', user.id)

      // Fetch organizations where user is delegate
      const { data: delegateOrgs } = await db
        .from('organization_delegates')
        .select('organization:organizations(*)')
        .eq('user_id', user.id)

      // Fetch organizations where user is member
      const { data: memberOrgs } = await db
        .from('organization_members')
        .select('organization:organizations(*)')
        .eq('user_id', user.id)

      const memberships: OrganizationMembership[] = []

      // Process owned organizations
      ownedOrgs?.forEach((item: { organization: Organization }) => {
        if (item.organization) {
          memberships.push({
            organization: item.organization,
            isOwner: true,
            isDelegate: true,
            permissions: ['*'],
          })
        }
      })

      // Process delegate organizations (if not already in list)
      delegateOrgs?.forEach((item: { organization: Organization }) => {
        if (item.organization && !memberships.find(m => m.organization.id === item.organization.id)) {
          memberships.push({
            organization: item.organization,
            isOwner: false,
            isDelegate: true,
            permissions: ['*'],
          })
        }
      })

      // Process member organizations (if not already in list)
      memberOrgs?.forEach((item: { organization: Organization }) => {
        if (item.organization && !memberships.find(m => m.organization.id === item.organization.id)) {
          memberships.push({
            organization: item.organization,
            isOwner: false,
            isDelegate: false,
            permissions: [], // Will be loaded from permission groups
          })
        }
      })

      setOrganizations(memberships)

      // Set current organization based on slug
      if (slug) {
        const org = memberships.find(m => m.organization.slug === slug)
        if (org) {
          setCurrentOrganization(org.organization)
        } else {
          // User doesn't have access to this organization
          navigate('/')
        }
      } else if (memberships.length === 1) {
        // Auto-select if user only has one organization
        setCurrentOrganization(memberships[0].organization)
      }
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchOrganizations()
  }, [user, slug])

  return (
    <OrganizationContext.Provider value={{
      currentOrganization,
      organizations,
      isLoading,
      setCurrentOrganization,
      refreshOrganizations: fetchOrganizations,
    }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}
