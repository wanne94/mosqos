import { supabase, isSupabaseConfigured } from '@/lib/supabase/client'

const DEV_ORG_SLUG = 'green-lane-masjid'

/**
 * Determines the correct redirect URL after login based on user role.
 *
 * Redirect logic:
 * - platform_admin -> /platform
 * - owner/delegate -> /{slug}/admin
 * - member -> /{slug}/portal
 * - no organization -> /no-organization
 */
export async function getPostLoginRedirectUrl(userEmail: string): Promise<string> {
  // Dev mode - use email-based routing
  if (!isSupabaseConfigured()) {
    if (userEmail === 'admin@mosqos.com') {
      return '/platform'
    }
    // imam goes to admin, member goes to portal
    const basePath = userEmail === 'imam@mosqos.com' ? 'admin' : 'portal'
    return `/${DEV_ORG_SLUG}/${basePath}`
  }

  // Production mode - check user role in database
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return '/login'

  // 1. Check if platform admin
  const { data: platformAdmin } = await supabase
    .from('platform_admins')
    .select('id')
    .eq('user_id', user.id)
    .maybeSingle()

  if (platformAdmin) {
    return '/platform'
  }

  // 2. Check if organization owner
  const { data: ownerOrg } = await supabase
    .from('organization_owners')
    .select('organization:organizations(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (ownerOrg?.organization && typeof ownerOrg.organization === 'object' && 'slug' in ownerOrg.organization) {
    return `/${ownerOrg.organization.slug}/admin`
  }

  // 3. Check if organization delegate
  const { data: delegateOrg } = await supabase
    .from('organization_delegates')
    .select('organization:organizations(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (delegateOrg?.organization && typeof delegateOrg.organization === 'object' && 'slug' in delegateOrg.organization) {
    return `/${delegateOrg.organization.slug}/admin`
  }

  // 4. Check if organization member
  const { data: memberOrg } = await supabase
    .from('organization_members')
    .select('organization:organizations(slug)')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle()

  if (memberOrg?.organization && typeof memberOrg.organization === 'object' && 'slug' in memberOrg.organization) {
    return `/${memberOrg.organization.slug}/portal`
  }

  // Fallback - user has no organization
  return '/no-organization'
}
