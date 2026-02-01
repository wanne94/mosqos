import { describe, it, expect, vi, beforeEach } from 'vitest'

function createMockQueryBuilder(finalResult: { data: any; error: any }) {
  const builder: any = {}
  const methods = ['select', 'insert', 'update', 'delete', 'eq', 'in', 'is', 'not', 'or', 'gte', 'lte', 'like', 'ilike', 'order', 'limit', 'maybeSingle', 'gt', 'lt', 'neq']

  methods.forEach(method => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { platformService } from './platform.service'
import { supabase } from '@/lib/supabase/client'

describe('platformService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getStats', () => {
    it('should return platform statistics with correct counts', async () => {
      const orgMockQuery = createMockQueryBuilder({
        data: [{ id: '1' }, { id: '2' }, { id: '3' }],
        error: null,
      })

      const membersMockQuery = createMockQueryBuilder({
        data: [{ id: 'm1' }, { id: 'm2' }, { id: 'm3' }, { id: 'm4' }, { id: 'm5' }],
        error: null,
      })

      const subsMockQuery = createMockQueryBuilder({
        data: [
          {
            id: 's1',
            billing_cycle: 'monthly',
            subscription_plans: {
              id: 'plan1',
              plan_pricing: [{ price_monthly: 100, price_yearly: 1000 }],
            },
          },
          {
            id: 's2',
            billing_cycle: 'yearly',
            subscription_plans: {
              id: 'plan2',
              plan_pricing: [{ price_monthly: 200, price_yearly: 2400 }],
            },
          },
        ],
        error: null,
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      const stats = await platformService.getStats()

      expect(stats.totalOrganizations).toBe(3)
      expect(stats.totalMembers).toBe(5)
      expect(stats.activeSubscriptions).toBe(2)
      // Monthly revenue: 100 (monthly) + 2400/12 (yearly converted) = 100 + 200 = 300
      expect(stats.monthlyRevenue).toBe(300)
      expect(stats.organizationsChange).toBe(0)
      expect(stats.membersChange).toBe(0)
      expect(stats.subscriptionsChange).toBe(0)
      expect(stats.revenueChange).toBe(0)
    })

    it('should calculate monthly revenue correctly for monthly billing cycle', async () => {
      const orgMockQuery = createMockQueryBuilder({ data: [], error: null })
      const membersMockQuery = createMockQueryBuilder({ data: [], error: null })

      const subsMockQuery = createMockQueryBuilder({
        data: [
          {
            id: 's1',
            billing_cycle: 'monthly',
            subscription_plans: {
              id: 'plan1',
              plan_pricing: [{ price_monthly: 49.99, price_yearly: 499.99 }],
            },
          },
          {
            id: 's2',
            billing_cycle: 'monthly',
            subscription_plans: {
              id: 'plan2',
              plan_pricing: [{ price_monthly: 99.99, price_yearly: 999.99 }],
            },
          },
        ],
        error: null,
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      const stats = await platformService.getStats()

      // Monthly revenue: 49.99 + 99.99 = 149.98
      expect(stats.monthlyRevenue).toBeCloseTo(149.98, 2)
    })

    it('should calculate monthly revenue correctly for yearly billing cycle (divided by 12)', async () => {
      const orgMockQuery = createMockQueryBuilder({ data: [], error: null })
      const membersMockQuery = createMockQueryBuilder({ data: [], error: null })

      const subsMockQuery = createMockQueryBuilder({
        data: [
          {
            id: 's1',
            billing_cycle: 'yearly',
            subscription_plans: {
              id: 'plan1',
              plan_pricing: [{ price_monthly: 50, price_yearly: 480 }],
            },
          },
          {
            id: 's2',
            billing_cycle: 'yearly',
            subscription_plans: {
              id: 'plan2',
              plan_pricing: [{ price_monthly: 100, price_yearly: 960 }],
            },
          },
        ],
        error: null,
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      const stats = await platformService.getStats()

      // Monthly revenue: 480/12 + 960/12 = 40 + 80 = 120
      expect(stats.monthlyRevenue).toBe(120)
    })

    it('should handle mixed billing cycles correctly', async () => {
      const orgMockQuery = createMockQueryBuilder({ data: [], error: null })
      const membersMockQuery = createMockQueryBuilder({ data: [], error: null })

      const subsMockQuery = createMockQueryBuilder({
        data: [
          {
            id: 's1',
            billing_cycle: 'monthly',
            subscription_plans: {
              id: 'plan1',
              plan_pricing: [{ price_monthly: 50, price_yearly: 500 }],
            },
          },
          {
            id: 's2',
            billing_cycle: 'yearly',
            subscription_plans: {
              id: 'plan2',
              plan_pricing: [{ price_monthly: 100, price_yearly: 1200 }],
            },
          },
          {
            id: 's3',
            billing_cycle: 'monthly',
            subscription_plans: {
              id: 'plan3',
              plan_pricing: [{ price_monthly: 25, price_yearly: 250 }],
            },
          },
        ],
        error: null,
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      const stats = await platformService.getStats()

      // Monthly revenue: 50 (monthly) + 1200/12 (yearly) + 25 (monthly) = 50 + 100 + 25 = 175
      expect(stats.monthlyRevenue).toBe(175)
    })

    it('should handle subscriptions without pricing data', async () => {
      const orgMockQuery = createMockQueryBuilder({ data: [], error: null })
      const membersMockQuery = createMockQueryBuilder({ data: [], error: null })

      const subsMockQuery = createMockQueryBuilder({
        data: [
          {
            id: 's1',
            billing_cycle: 'monthly',
            subscription_plans: {
              id: 'plan1',
              plan_pricing: [],
            },
          },
          {
            id: 's2',
            billing_cycle: 'yearly',
            subscription_plans: undefined,
          },
          {
            id: 's3',
            billing_cycle: 'monthly',
            subscription_plans: {
              id: 'plan3',
              plan_pricing: [{ price_monthly: 100, price_yearly: 1000 }],
            },
          },
        ],
        error: null,
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      const stats = await platformService.getStats()

      // Only the third subscription has valid pricing: 100
      expect(stats.monthlyRevenue).toBe(100)
      expect(stats.activeSubscriptions).toBe(3)
    })

    it('should return zero counts when no data exists', async () => {
      const emptyMockQuery = createMockQueryBuilder({ data: [], error: null })

      vi.mocked(supabase.from).mockImplementation(() => emptyMockQuery)

      const stats = await platformService.getStats()

      expect(stats.totalOrganizations).toBe(0)
      expect(stats.totalMembers).toBe(0)
      expect(stats.activeSubscriptions).toBe(0)
      expect(stats.monthlyRevenue).toBe(0)
    })

    it('should handle null data from organizations query', async () => {
      const orgMockQuery = createMockQueryBuilder({ data: null, error: null })
      const membersMockQuery = createMockQueryBuilder({ data: [{ id: 'm1' }], error: null })
      const subsMockQuery = createMockQueryBuilder({ data: [], error: null })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      const stats = await platformService.getStats()

      expect(stats.totalOrganizations).toBe(0)
      expect(stats.totalMembers).toBe(1)
    })

    it('should throw error when organizations query fails', async () => {
      const orgMockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Database error', code: 'PGRST500' },
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      await expect(platformService.getStats()).rejects.toEqual({
        message: 'Database error',
        code: 'PGRST500',
      })
    })

    it('should throw error when members query fails', async () => {
      const orgMockQuery = createMockQueryBuilder({
        data: [{ id: '1' }],
        error: null,
      })
      const membersMockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Members table error' },
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      await expect(platformService.getStats()).rejects.toEqual({
        message: 'Members table error',
      })
    })

    it('should throw error when subscriptions query fails', async () => {
      const orgMockQuery = createMockQueryBuilder({ data: [], error: null })
      const membersMockQuery = createMockQueryBuilder({ data: [], error: null })
      const subsMockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Subscriptions error' },
      })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      await expect(platformService.getStats()).rejects.toEqual({
        message: 'Subscriptions error',
      })
    })

    it('should call supabase.from with correct table names', async () => {
      const emptyMockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockImplementation(() => emptyMockQuery)

      await platformService.getStats()

      expect(supabase.from).toHaveBeenCalledWith('organizations')
      expect(supabase.from).toHaveBeenCalledWith('members')
      expect(supabase.from).toHaveBeenCalledWith('organization_subscriptions')
    })

    it('should filter subscriptions by active status', async () => {
      const orgMockQuery = createMockQueryBuilder({ data: [], error: null })
      const membersMockQuery = createMockQueryBuilder({ data: [], error: null })
      const subsMockQuery = createMockQueryBuilder({ data: [], error: null })

      vi.mocked(supabase.from).mockImplementation((table: string) => {
        if (table === 'organizations') return orgMockQuery
        if (table === 'members') return membersMockQuery
        if (table === 'organization_subscriptions') return subsMockQuery
        return createMockQueryBuilder({ data: [], error: null })
      })

      await platformService.getStats()

      expect(subsMockQuery.eq).toHaveBeenCalledWith('status', 'active')
    })
  })

  describe('getRecentOrganizations', () => {
    it('should return recent organizations with default limit of 5', async () => {
      const mockOrganizations = [
        { id: '1', name: 'Org 1', slug: 'org-1', created_at: '2024-01-05', is_active: true },
        { id: '2', name: 'Org 2', slug: 'org-2', created_at: '2024-01-04', is_active: true },
        { id: '3', name: 'Org 3', slug: 'org-3', created_at: '2024-01-03', is_active: true },
        { id: '4', name: 'Org 4', slug: 'org-4', created_at: '2024-01-02', is_active: false },
        { id: '5', name: 'Org 5', slug: 'org-5', created_at: '2024-01-01', is_active: true },
      ]

      const mockQuery = createMockQueryBuilder({
        data: mockOrganizations,
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await platformService.getRecentOrganizations()

      expect(result).toEqual(mockOrganizations)
      expect(supabase.from).toHaveBeenCalledWith('organizations')
      expect(mockQuery.select).toHaveBeenCalledWith('id, name, slug, created_at, is_active')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(mockQuery.limit).toHaveBeenCalledWith(5)
    })

    it('should return recent organizations with custom limit', async () => {
      const mockOrganizations = [
        { id: '1', name: 'Org 1', slug: 'org-1', created_at: '2024-01-03', is_active: true },
        { id: '2', name: 'Org 2', slug: 'org-2', created_at: '2024-01-02', is_active: true },
        { id: '3', name: 'Org 3', slug: 'org-3', created_at: '2024-01-01', is_active: true },
      ]

      const mockQuery = createMockQueryBuilder({
        data: mockOrganizations,
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await platformService.getRecentOrganizations(3)

      expect(result).toEqual(mockOrganizations)
      expect(mockQuery.limit).toHaveBeenCalledWith(3)
    })

    it('should return empty array when no organizations exist', async () => {
      const mockQuery = createMockQueryBuilder({
        data: [],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await platformService.getRecentOrganizations()

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Query failed', code: 'PGRST500' },
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(platformService.getRecentOrganizations()).rejects.toEqual({
        message: 'Query failed',
        code: 'PGRST500',
      })
    })

    it('should order results by created_at in descending order', async () => {
      const mockQuery = createMockQueryBuilder({
        data: [],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await platformService.getRecentOrganizations()

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })

  describe('getAllOrganizations', () => {
    it('should return all organizations', async () => {
      const mockOrganizations = [
        { id: '1', name: 'Org 1', slug: 'org-1', created_at: '2024-01-03', is_active: true, country: 'US' },
        { id: '2', name: 'Org 2', slug: 'org-2', created_at: '2024-01-02', is_active: true, country: 'TR' },
        { id: '3', name: 'Org 3', slug: 'org-3', created_at: '2024-01-01', is_active: false, country: 'DE' },
      ]

      const mockQuery = createMockQueryBuilder({
        data: mockOrganizations,
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await platformService.getAllOrganizations()

      expect(result).toEqual(mockOrganizations)
      expect(supabase.from).toHaveBeenCalledWith('organizations')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })

    it('should return empty array when no organizations exist', async () => {
      const mockQuery = createMockQueryBuilder({
        data: [],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await platformService.getAllOrganizations()

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { message: 'Database connection failed' },
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(platformService.getAllOrganizations()).rejects.toEqual({
        message: 'Database connection failed',
      })
    })

    it('should select all columns', async () => {
      const mockQuery = createMockQueryBuilder({
        data: [],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await platformService.getAllOrganizations()

      expect(mockQuery.select).toHaveBeenCalledWith('*')
    })

    it('should order results by created_at in descending order', async () => {
      const mockQuery = createMockQueryBuilder({
        data: [],
        error: null,
      })

      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await platformService.getAllOrganizations()

      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
    })
  })
})
