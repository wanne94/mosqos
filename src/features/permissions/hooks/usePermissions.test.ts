import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { createElement } from 'react'

// Mock the supabase client
const mockGetUser = vi.fn()
const mockMaybeSingle = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    auth: {
      getUser: () => mockGetUser(),
    },
    from: (table: string) => mockFrom(table),
  },
  isSupabaseConfigured: () => true,
}))

import { usePermissions, useHasPermission } from './usePermissions'

// Helper to create a wrapper with fresh QueryClient
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
    },
  })

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return createElement(QueryClientProvider, { client: queryClient }, children)
  }
}

describe('usePermissions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()

    // Default mock setup
    mockFrom.mockReturnValue({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      maybeSingle: mockMaybeSingle,
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Development Mode', () => {
    it('should return platform_admin permissions for admin@mosqos.com', async () => {
      localStorage.setItem('mosqos_dev_user', 'admin@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('platform_admin')
      expect(result.current.isPlatformAdmin).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isFullAdmin).toBe(true)
      expect(result.current.isMember).toBe(false)
      expect(result.current.canViewDashboard).toBe(true)
      expect(result.current.canViewFinance).toBe(true)
      expect(result.current.canViewSettings).toBe(true)
    })

    it('should return owner permissions for imam@mosqos.com', async () => {
      localStorage.setItem('mosqos_dev_user', 'imam@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('owner')
      expect(result.current.isPlatformAdmin).toBe(false)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isFullAdmin).toBe(true)
      expect(result.current.organizationId).toBe('dev-org-id')
    })

    it('should return member permissions for member@mosqos.com', async () => {
      localStorage.setItem('mosqos_dev_user', 'member@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('member')
      expect(result.current.isPlatformAdmin).toBe(false)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isMember).toBe(true)
      expect(result.current.memberId).toBe('dev-member-id')
      expect(result.current.organizationId).toBe('dev-org-id')
    })
  })

  describe('Production Mode - No Auth', () => {
    it('should return null role when user is not authenticated', async () => {
      mockGetUser.mockResolvedValue({
        data: { user: null },
        error: { message: 'Not authenticated' },
      })

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBeNull()
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.isMember).toBe(true)
      expect(result.current.organizationId).toBeNull()
    })
  })

  describe('Production Mode - Platform Admin', () => {
    it('should identify platform admin', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-123', email: 'admin@platform.com' },
        },
        error: null,
      })

      // Mock platform_admins check - user is a platform admin
      mockMaybeSingle.mockResolvedValueOnce({
        data: { id: 'pa-1' },
        error: null,
      })

      // Mock organization_owners - not an owner
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_delegates - not a delegate
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_members - not a member
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('platform_admin')
      expect(result.current.isPlatformAdmin).toBe(true)
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isFullAdmin).toBe(true)
      expect(result.current.canViewDashboard).toBe(true)
      expect(result.current.canViewFinance).toBe(true)
      expect(result.current.canViewSettings).toBe(true)
    })
  })

  describe('Production Mode - Organization Owner', () => {
    it('should identify organization owner with full permissions', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-456', email: 'owner@mosque.com' },
        },
        error: null,
      })

      // Mock platform_admins check - not a platform admin
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_owners - is an owner
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'owner-1',
          organization_id: 'org-123',
          role_id: null,
          organization_roles: null,
        },
        error: null,
      })

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('owner')
      expect(result.current.organizationId).toBe('org-123')
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.isFullAdmin).toBe(true)
      expect(result.current.canViewDashboard).toBe(true)
      expect(result.current.canViewFinance).toBe(true)
      expect(result.current.canViewEducation).toBe(true)
      expect(result.current.canViewUmrah).toBe(true)
      expect(result.current.canViewServices).toBe(true)
      expect(result.current.canViewPeople).toBe(true)
      expect(result.current.canViewSettings).toBe(true)
    })
  })

  describe('Production Mode - Organization Delegate', () => {
    it('should identify organization delegate with full permissions', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-789', email: 'delegate@mosque.com' },
        },
        error: null,
      })

      // Mock platform_admins - not a platform admin
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_owners - not an owner
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_delegates - is a delegate
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'delegate-1',
          organization_id: 'org-123',
          role_id: null,
          organization_roles: null,
        },
        error: null,
      })

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('delegate')
      expect(result.current.organizationId).toBe('org-123')
      expect(result.current.isAdmin).toBe(true)
      expect(result.current.canViewSettings).toBe(true)
    })
  })

  describe('Production Mode - Organization Member', () => {
    it('should identify organization member with limited permissions', async () => {
      mockGetUser.mockResolvedValue({
        data: {
          user: { id: 'user-101', email: 'member@mosque.com' },
        },
        error: null,
      })

      // Mock platform_admins - not a platform admin
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_owners - not an owner
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_delegates - not a delegate
      mockMaybeSingle.mockResolvedValueOnce({
        data: null,
        error: null,
      })

      // Mock organization_members - is a member
      mockMaybeSingle.mockResolvedValueOnce({
        data: {
          id: 'member-1',
          organization_id: 'org-123',
          role_id: null,
          organization_roles: {
            role_name: 'Member',
            default_permissions: {
              dashboard: false,
              finance: false,
              education: false,
              services: false,
              umrah: false,
              people: false,
              settings: false,
            },
          },
        },
        error: null,
      })

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.role).toBe('member')
      expect(result.current.organizationId).toBe('org-123')
      expect(result.current.isMember).toBe(true)
      expect(result.current.isAdmin).toBe(false)
      expect(result.current.canViewDashboard).toBe(false)
      expect(result.current.canViewFinance).toBe(false)
      expect(result.current.canViewSettings).toBe(false)
    })
  })

  describe('hasPermission', () => {
    it('should return true for platform admin with any permission', async () => {
      localStorage.setItem('mosqos_dev_user', 'admin@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission('donations:create')).toBe(true)
      expect(result.current.hasPermission('members:delete')).toBe(true)
      expect(result.current.hasPermission('settings:manage')).toBe(true)
    })

    it('should return true for owner with any permission', async () => {
      localStorage.setItem('mosqos_dev_user', 'imam@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission('donations:create')).toBe(true)
      expect(result.current.hasPermission('cases:manage')).toBe(true)
    })

    it('should return false for member without specific permissions', async () => {
      localStorage.setItem('mosqos_dev_user', 'member@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.hasPermission('donations:create')).toBe(false)
      expect(result.current.hasPermission('settings:manage')).toBe(false)
    })
  })

  describe('roleBasePath', () => {
    it('should return "platform" for platform admin', async () => {
      localStorage.setItem('mosqos_dev_user', 'admin@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.roleBasePath).toBe('platform')
    })

    it('should return "owner" for organization owner', async () => {
      localStorage.setItem('mosqos_dev_user', 'imam@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.roleBasePath).toBe('owner')
    })

    it('should return "member" for regular member', async () => {
      localStorage.setItem('mosqos_dev_user', 'member@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(result.current.roleBasePath).toBe('member')
    })
  })

  describe('refresh', () => {
    it('should provide a refresh function', async () => {
      localStorage.setItem('mosqos_dev_user', 'admin@mosqos.com')

      const { result } = renderHook(() => usePermissions(), {
        wrapper: createWrapper(),
      })

      await waitFor(() => {
        expect(result.current.loading).toBe(false)
      })

      expect(typeof result.current.refresh).toBe('function')
    })
  })
})

describe('useHasPermission', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('should return true for admin with permission', async () => {
    localStorage.setItem('mosqos_dev_user', 'admin@mosqos.com')

    const { result } = renderHook(() => useHasPermission('donations:create'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(true)
    })
  })

  it('should return false for member without permission', async () => {
    localStorage.setItem('mosqos_dev_user', 'member@mosqos.com')

    const { result } = renderHook(() => useHasPermission('donations:create'), {
      wrapper: createWrapper(),
    })

    await waitFor(() => {
      expect(result.current).toBe(false)
    })
  })

  it('should return false while loading', () => {
    // Don't set dev user, so it will try to fetch from Supabase
    mockGetUser.mockImplementation(
      () => new Promise(() => {}) // Never resolves
    )

    const { result } = renderHook(() => useHasPermission('donations:create'), {
      wrapper: createWrapper(),
    })

    // Should return false immediately while loading
    expect(result.current).toBe(false)
  })
})
