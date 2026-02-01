import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  Announcement,
  AnnouncementInput,
  AnnouncementUpdateInput,
  AnnouncementFilters,
  AnnouncementStats,
} from '../types/announcements.types'

const TABLE_NAME = 'announcements'

// Type assertion helper for tables not in generated types
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as SupabaseClient<any>

// Helper type for stats query
interface AnnouncementStatsRow {
  id: string
  status: string
  priority: string
  is_pinned: boolean
}

// Helper type for category query
interface CategoryRow {
  category: string | null
}

export const announcementsService = {
  // Get all announcements for an organization
  async getAll(organizationId: string, filters?: AnnouncementFilters): Promise<Announcement[]> {
    let query = db
      .from(TABLE_NAME)
      .select('*')
      .eq('organization_id', organizationId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false })

    if (filters?.status && filters.status !== 'all') {
      query = query.eq('status', filters.status)
    }

    if (filters?.priority && filters.priority !== 'all') {
      query = query.eq('priority', filters.priority)
    }

    if (filters?.category) {
      query = query.eq('category', filters.category)
    }

    if (filters?.search) {
      // Search in title (English)
      query = query.or(`title->en.ilike.%${filters.search}%,title->ar.ilike.%${filters.search}%,title->tr.ilike.%${filters.search}%`)
    }

    const { data, error } = await query

    if (error) throw error
    return (data || []) as unknown as Announcement[]
  },

  // Get published announcements for portal
  async getPublished(organizationId: string): Promise<Announcement[]> {
    const now = new Date().toISOString()

    const { data, error } = await db
      .from(TABLE_NAME)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'published')
      .eq('show_in_portal', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })

    if (error) throw error
    return (data || []) as unknown as Announcement[]
  },

  // Get single announcement by ID
  async getById(id: string): Promise<Announcement | null> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data as unknown as Announcement
  },

  // Create announcement
  async create(input: AnnouncementInput): Promise<Announcement> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .insert([{
        ...input,
        attachments: input.attachments || [],
        target_group_ids: input.target_group_ids || [],
      }] as never)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Announcement
  },

  // Update announcement
  async update(input: AnnouncementUpdateInput): Promise<Announcement> {
    const { id, ...updateData } = input

    const { data, error } = await db
      .from(TABLE_NAME)
      .update(updateData as never)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Announcement
  },

  // Publish announcement
  async publish(id: string): Promise<Announcement> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Announcement
  },

  // Archive announcement
  async archive(id: string): Promise<Announcement> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Announcement
  },

  // Delete announcement
  async delete(id: string): Promise<void> {
    const { error } = await db
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Toggle pin status
  async togglePin(id: string, isPinned: boolean): Promise<Announcement> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .update({ is_pinned: isPinned })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data as unknown as Announcement
  },

  // Get stats
  async getStats(organizationId: string): Promise<AnnouncementStats> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('id, status, priority, is_pinned')
      .eq('organization_id', organizationId)

    if (error) throw error

    const announcements = (data || []) as AnnouncementStatsRow[]

    return {
      total: announcements.length,
      published: announcements.filter((a) => a.status === 'published').length,
      draft: announcements.filter((a) => a.status === 'draft').length,
      scheduled: announcements.filter((a) => a.status === 'scheduled').length,
      archived: announcements.filter((a) => a.status === 'archived').length,
      urgent: announcements.filter((a) => a.priority === 'urgent').length,
      pinned: announcements.filter((a) => a.is_pinned).length,
    }
  },

  // Get categories (distinct values)
  async getCategories(organizationId: string): Promise<string[]> {
    const { data, error } = await db
      .from(TABLE_NAME)
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null)

    if (error) throw error

    const rows = (data || []) as CategoryRow[]
    const categories = [...new Set(rows.map((d) => d.category).filter((c): c is string => Boolean(c)))]
    return categories.sort()
  },
}
