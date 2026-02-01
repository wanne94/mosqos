import { describe, it, expect, vi, beforeEach } from 'vitest'

// Helper to create chainable mock query builder
function createMockQueryBuilder(finalResult: { data: any; error: any }) {
  const builder: any = {}
  const methods = [
    'select',
    'insert',
    'update',
    'delete',
    'eq',
    'in',
    'is',
    'not',
    'or',
    'gte',
    'lte',
    'like',
    'ilike',
    'order',
    'limit',
    'maybeSingle',
    'gt',
    'lt',
    'neq',
  ]

  methods.forEach((method) => {
    builder[method] = vi.fn().mockReturnValue(builder)
  })

  builder.single = vi.fn().mockResolvedValue(finalResult)

  // Make chainable methods resolve at the end
  builder.then = (resolve: any) => resolve(finalResult)

  return builder
}

// Mock the supabase client before importing the service
vi.mock('@/lib/supabase/client', () => ({
  supabase: {
    from: vi.fn(),
  },
}))

import { announcementsService } from './announcements.service'
import { supabase } from '@/lib/supabase/client'

describe('announcementsService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================================================
  // getAll
  // ============================================================================

  describe('getAll', () => {
    it('should fetch all announcements for an organization', async () => {
      const mockAnnouncements = [
        {
          id: 'ann-1',
          organization_id: 'org-123',
          title: { en: 'Test Announcement 1', ar: 'إعلان 1', tr: 'Duyuru 1' },
          content: { en: 'Content 1' },
          priority: 'normal',
          status: 'published',
          is_pinned: true,
          show_in_portal: true,
          show_in_admin: true,
          target_audience: 'all',
          target_group_ids: [],
          attachments: [],
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'ann-2',
          organization_id: 'org-123',
          title: { en: 'Test Announcement 2' },
          content: { en: 'Content 2' },
          priority: 'urgent',
          status: 'draft',
          is_pinned: false,
          show_in_portal: false,
          show_in_admin: true,
          target_audience: 'members',
          target_group_ids: [],
          attachments: [],
          created_at: '2024-01-20T10:00:00Z',
          updated_at: '2024-01-20T10:00:00Z',
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockAnnouncements, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getAll('org-123')

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.order).toHaveBeenCalledWith('is_pinned', { ascending: false })
      expect(mockQuery.order).toHaveBeenCalledWith('created_at', { ascending: false })
      expect(result).toEqual(mockAnnouncements)
    })

    it('should apply status filter when provided', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.getAll('org-123', { status: 'published' })

      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published')
    })

    it('should apply priority filter when provided', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.getAll('org-123', { priority: 'urgent' })

      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'urgent')
    })

    it('should apply category filter when provided', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.getAll('org-123', { category: 'Events' })

      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'Events')
    })

    it('should apply search filter when provided', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.getAll('org-123', { search: 'ramadan' })

      expect(mockQuery.or).toHaveBeenCalledWith(
        'title->en.ilike.%ramadan%,title->ar.ilike.%ramadan%,title->tr.ilike.%ramadan%'
      )
    })

    it('should not apply status filter when set to "all"', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.getAll('org-123', { status: 'all' })

      // eq should only be called once for organization_id, not for status
      const eqCalls = mockQuery.eq.mock.calls
      const statusFilterCalls = eqCalls.filter((call: any[]) => call[0] === 'status')
      expect(statusFilterCalls).toHaveLength(0)
    })

    it('should not apply priority filter when set to "all"', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.getAll('org-123', { priority: 'all' })

      // eq should only be called once for organization_id, not for priority
      const eqCalls = mockQuery.eq.mock.calls
      const priorityFilterCalls = eqCalls.filter((call: any[]) => call[0] === 'priority')
      expect(priorityFilterCalls).toHaveLength(0)
    })

    it('should apply multiple filters together', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.getAll('org-123', {
        status: 'published',
        priority: 'urgent',
        category: 'Events',
        search: 'eid',
      })

      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published')
      expect(mockQuery.eq).toHaveBeenCalledWith('priority', 'urgent')
      expect(mockQuery.eq).toHaveBeenCalledWith('category', 'Events')
      expect(mockQuery.or).toHaveBeenCalled()
    })

    it('should return empty array when no announcements found', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getAll('org-123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.getAll('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  // ============================================================================
  // getPublished
  // ============================================================================

  describe('getPublished', () => {
    it('should fetch published announcements for portal', async () => {
      const mockAnnouncements = [
        {
          id: 'ann-1',
          organization_id: 'org-123',
          title: { en: 'Published Announcement' },
          status: 'published',
          show_in_portal: true,
          is_pinned: true,
          published_at: '2024-01-15T10:00:00Z',
        },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockAnnouncements, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getPublished('org-123')

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.eq).toHaveBeenCalledWith('status', 'published')
      expect(mockQuery.eq).toHaveBeenCalledWith('show_in_portal', true)
      expect(mockQuery.or).toHaveBeenCalled() // for expires_at filter
      expect(mockQuery.order).toHaveBeenCalledWith('is_pinned', { ascending: false })
      expect(mockQuery.order).toHaveBeenCalledWith('published_at', { ascending: false })
      expect(result).toEqual(mockAnnouncements)
    })

    it('should return empty array when no published announcements', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getPublished('org-123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Database error' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.getPublished('org-123')).rejects.toEqual({
        message: 'Database error',
      })
    })
  })

  // ============================================================================
  // getById
  // ============================================================================

  describe('getById', () => {
    it('should fetch a single announcement by ID', async () => {
      const mockAnnouncement = {
        id: 'ann-1',
        organization_id: 'org-123',
        title: { en: 'Test Announcement' },
        content: { en: 'Content' },
        priority: 'normal',
        status: 'published',
        is_pinned: false,
        show_in_portal: true,
        show_in_admin: true,
        target_audience: 'all',
        target_group_ids: [],
        attachments: [],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
      }

      const mockQuery = createMockQueryBuilder({ data: mockAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getById('ann-1')

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.select).toHaveBeenCalledWith('*')
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ann-1')
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(mockAnnouncement)
    })

    it('should return null when announcement not found (PGRST116)', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { code: 'PGRST116' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getById('non-existent')

      expect(result).toBeNull()
    })

    it('should throw error for other database errors', async () => {
      const mockQuery = createMockQueryBuilder({
        data: null,
        error: { code: 'OTHER_ERROR', message: 'Database error' },
      })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.getById('ann-1')).rejects.toEqual({
        code: 'OTHER_ERROR',
        message: 'Database error',
      })
    })
  })

  // ============================================================================
  // create
  // ============================================================================

  describe('create', () => {
    it('should create a new announcement', async () => {
      const newAnnouncement = {
        organization_id: 'org-123',
        title: { en: 'New Announcement', ar: 'إعلان جديد' },
        content: { en: 'New content', ar: 'محتوى جديد' },
        priority: 'important' as const,
        status: 'draft' as const,
        target_audience: 'all' as const,
        show_in_portal: true,
        show_in_admin: true,
      }

      const createdAnnouncement = {
        id: 'ann-new',
        ...newAnnouncement,
        is_pinned: false,
        target_group_ids: [],
        attachments: [],
        created_at: '2024-02-01T10:00:00Z',
        updated_at: '2024-02-01T10:00:00Z',
      }

      const mockQuery = createMockQueryBuilder({ data: createdAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.create(newAnnouncement)

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.insert).toHaveBeenCalled()
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(createdAnnouncement)
    })

    it('should set default attachments to empty array', async () => {
      const newAnnouncement = {
        organization_id: 'org-123',
        title: { en: 'Test' },
        content: { en: 'Test content' },
      }

      const createdAnnouncement = {
        id: 'ann-new',
        ...newAnnouncement,
        attachments: [],
        target_group_ids: [],
      }

      const mockQuery = createMockQueryBuilder({ data: createdAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.create(newAnnouncement)

      // Verify insert was called with attachments set to empty array
      const insertCall = mockQuery.insert.mock.calls[0][0]
      expect(insertCall[0].attachments).toEqual([])
    })

    it('should set default target_group_ids to empty array', async () => {
      const newAnnouncement = {
        organization_id: 'org-123',
        title: { en: 'Test' },
        content: { en: 'Test content' },
      }

      const createdAnnouncement = {
        id: 'ann-new',
        ...newAnnouncement,
        attachments: [],
        target_group_ids: [],
      }

      const mockQuery = createMockQueryBuilder({ data: createdAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.create(newAnnouncement)

      const insertCall = mockQuery.insert.mock.calls[0][0]
      expect(insertCall[0].target_group_ids).toEqual([])
    })

    it('should preserve provided attachments', async () => {
      const attachments = [
        { id: 'file-1', name: 'document.pdf', url: 'https://example.com/doc.pdf', type: 'application/pdf', size: 1024 },
      ]

      const newAnnouncement = {
        organization_id: 'org-123',
        title: { en: 'Test' },
        content: { en: 'Test content' },
        attachments,
      }

      const createdAnnouncement = {
        id: 'ann-new',
        ...newAnnouncement,
        target_group_ids: [],
      }

      const mockQuery = createMockQueryBuilder({ data: createdAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.create(newAnnouncement)

      const insertCall = mockQuery.insert.mock.calls[0][0]
      expect(insertCall[0].attachments).toEqual(attachments)
    })

    it('should throw error when creation fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Insert failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        announcementsService.create({
          organization_id: 'org-123',
          title: { en: 'Test' },
          content: { en: 'Test content' },
        })
      ).rejects.toEqual({ message: 'Insert failed' })
    })
  })

  // ============================================================================
  // update
  // ============================================================================

  describe('update', () => {
    it('should update an existing announcement', async () => {
      const updateInput = {
        id: 'ann-1',
        title: { en: 'Updated Title' },
        priority: 'urgent' as const,
      }

      const updatedAnnouncement = {
        id: 'ann-1',
        organization_id: 'org-123',
        title: { en: 'Updated Title' },
        content: { en: 'Original content' },
        priority: 'urgent',
        status: 'published',
        is_pinned: false,
        show_in_portal: true,
        show_in_admin: true,
        target_audience: 'all',
        target_group_ids: [],
        attachments: [],
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-02-01T10:00:00Z',
      }

      const mockQuery = createMockQueryBuilder({ data: updatedAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.update(updateInput)

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.update).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ann-1')
      expect(mockQuery.select).toHaveBeenCalled()
      expect(mockQuery.single).toHaveBeenCalled()
      expect(result).toEqual(updatedAnnouncement)
    })

    it('should throw error when update fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Update failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(
        announcementsService.update({
          id: 'ann-1',
          title: { en: 'Updated' },
        })
      ).rejects.toEqual({ message: 'Update failed' })
    })
  })

  // ============================================================================
  // publish
  // ============================================================================

  describe('publish', () => {
    it('should publish an announcement', async () => {
      const publishedAnnouncement = {
        id: 'ann-1',
        organization_id: 'org-123',
        title: { en: 'Test' },
        status: 'published',
        published_at: '2024-02-01T12:00:00Z',
      }

      const mockQuery = createMockQueryBuilder({ data: publishedAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.publish('ann-1')

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.update).toHaveBeenCalled()
      // Check that update was called with status 'published' and published_at
      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.status).toBe('published')
      expect(updateCall.published_at).toBeDefined()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ann-1')
      expect(result).toEqual(publishedAnnouncement)
    })

    it('should set published_at timestamp', async () => {
      const mockQuery = createMockQueryBuilder({ data: { id: 'ann-1' }, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await announcementsService.publish('ann-1')

      const updateCall = mockQuery.update.mock.calls[0][0]
      expect(updateCall.published_at).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)
    })

    it('should throw error when publish fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Publish failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.publish('ann-1')).rejects.toEqual({
        message: 'Publish failed',
      })
    })
  })

  // ============================================================================
  // archive
  // ============================================================================

  describe('archive', () => {
    it('should archive an announcement', async () => {
      const archivedAnnouncement = {
        id: 'ann-1',
        organization_id: 'org-123',
        title: { en: 'Test' },
        status: 'archived',
      }

      const mockQuery = createMockQueryBuilder({ data: archivedAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.archive('ann-1')

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.update).toHaveBeenCalledWith({ status: 'archived' })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ann-1')
      expect(result).toEqual(archivedAnnouncement)
    })

    it('should throw error when archive fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Archive failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.archive('ann-1')).rejects.toEqual({
        message: 'Archive failed',
      })
    })
  })

  // ============================================================================
  // delete
  // ============================================================================

  describe('delete', () => {
    it('should delete an announcement', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.delete('ann-1')).resolves.toBeUndefined()

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.delete).toHaveBeenCalled()
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ann-1')
    })

    it('should throw error when delete fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Delete failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.delete('ann-1')).rejects.toEqual({
        message: 'Delete failed',
      })
    })
  })

  // ============================================================================
  // togglePin
  // ============================================================================

  describe('togglePin', () => {
    it('should pin an announcement', async () => {
      const pinnedAnnouncement = {
        id: 'ann-1',
        organization_id: 'org-123',
        title: { en: 'Test' },
        is_pinned: true,
      }

      const mockQuery = createMockQueryBuilder({ data: pinnedAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.togglePin('ann-1', true)

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.update).toHaveBeenCalledWith({ is_pinned: true })
      expect(mockQuery.eq).toHaveBeenCalledWith('id', 'ann-1')
      expect(result).toEqual(pinnedAnnouncement)
    })

    it('should unpin an announcement', async () => {
      const unpinnedAnnouncement = {
        id: 'ann-1',
        organization_id: 'org-123',
        title: { en: 'Test' },
        is_pinned: false,
      }

      const mockQuery = createMockQueryBuilder({ data: unpinnedAnnouncement, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.togglePin('ann-1', false)

      expect(mockQuery.update).toHaveBeenCalledWith({ is_pinned: false })
      expect(result).toEqual(unpinnedAnnouncement)
    })

    it('should throw error when toggle pin fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Toggle pin failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.togglePin('ann-1', true)).rejects.toEqual({
        message: 'Toggle pin failed',
      })
    })
  })

  // ============================================================================
  // getStats
  // ============================================================================

  describe('getStats', () => {
    it('should return correct announcement statistics', async () => {
      const mockAnnouncements = [
        { id: '1', status: 'published', priority: 'normal', is_pinned: false },
        { id: '2', status: 'published', priority: 'urgent', is_pinned: true },
        { id: '3', status: 'draft', priority: 'normal', is_pinned: false },
        { id: '4', status: 'scheduled', priority: 'important', is_pinned: false },
        { id: '5', status: 'archived', priority: 'normal', is_pinned: false },
        { id: '6', status: 'published', priority: 'urgent', is_pinned: true },
      ]

      const mockQuery = createMockQueryBuilder({ data: mockAnnouncements, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getStats('org-123')

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.select).toHaveBeenCalledWith('id, status, priority, is_pinned')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')

      expect(result).toEqual({
        total: 6,
        published: 3,
        draft: 1,
        scheduled: 1,
        archived: 1,
        urgent: 2,
        pinned: 2,
      })
    })

    it('should return zero stats when no announcements', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getStats('org-123')

      expect(result).toEqual({
        total: 0,
        published: 0,
        draft: 0,
        scheduled: 0,
        archived: 0,
        urgent: 0,
        pinned: 0,
      })
    })

    it('should handle null data gracefully', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getStats('org-123')

      expect(result).toEqual({
        total: 0,
        published: 0,
        draft: 0,
        scheduled: 0,
        archived: 0,
        urgent: 0,
        pinned: 0,
      })
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Stats query failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.getStats('org-123')).rejects.toEqual({
        message: 'Stats query failed',
      })
    })
  })

  // ============================================================================
  // getCategories
  // ============================================================================

  describe('getCategories', () => {
    it('should return distinct categories sorted alphabetically', async () => {
      const mockCategories = [
        { category: 'Events' },
        { category: 'Announcements' },
        { category: 'Events' }, // duplicate
        { category: 'Prayer Times' },
        { category: 'Announcements' }, // duplicate
      ]

      const mockQuery = createMockQueryBuilder({ data: mockCategories, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getCategories('org-123')

      expect(supabase.from).toHaveBeenCalledWith('announcements')
      expect(mockQuery.select).toHaveBeenCalledWith('category')
      expect(mockQuery.eq).toHaveBeenCalledWith('organization_id', 'org-123')
      expect(mockQuery.not).toHaveBeenCalledWith('category', 'is', null)

      // Should be unique and sorted
      expect(result).toEqual(['Announcements', 'Events', 'Prayer Times'])
    })

    it('should return empty array when no categories', async () => {
      const mockQuery = createMockQueryBuilder({ data: [], error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getCategories('org-123')

      expect(result).toEqual([])
    })

    it('should filter out null categories', async () => {
      const mockCategories = [{ category: 'Events' }, { category: null }, { category: 'News' }]

      const mockQuery = createMockQueryBuilder({ data: mockCategories, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getCategories('org-123')

      expect(result).toEqual(['Events', 'News'])
    })

    it('should handle null data gracefully', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: null })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      const result = await announcementsService.getCategories('org-123')

      expect(result).toEqual([])
    })

    it('should throw error when query fails', async () => {
      const mockQuery = createMockQueryBuilder({ data: null, error: { message: 'Categories query failed' } })
      vi.mocked(supabase.from).mockReturnValue(mockQuery)

      await expect(announcementsService.getCategories('org-123')).rejects.toEqual({
        message: 'Categories query failed',
      })
    })
  })
})
