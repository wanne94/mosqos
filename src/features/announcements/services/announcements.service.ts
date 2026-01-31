import { supabase } from '@/lib/supabase/client'
import type {
  Announcement,
  AnnouncementInput,
  AnnouncementUpdateInput,
  AnnouncementFilters,
  AnnouncementStats,
} from '../types/announcements.types'

const TABLE_NAME = 'announcements'

export const announcementsService = {
  // Get all announcements for an organization
  async getAll(organizationId: string, filters?: AnnouncementFilters): Promise<Announcement[]> {
    let query = (supabase as any)
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
    return data || []
  },

  // Get published announcements for portal
  async getPublished(organizationId: string): Promise<Announcement[]> {
    const now = new Date().toISOString()

    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .select('*')
      .eq('organization_id', organizationId)
      .eq('status', 'published')
      .eq('show_in_portal', true)
      .or(`expires_at.is.null,expires_at.gt.${now}`)
      .order('is_pinned', { ascending: false })
      .order('published_at', { ascending: false })

    if (error) throw error
    return data || []
  },

  // Get single announcement by ID
  async getById(id: string): Promise<Announcement | null> {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw error
    }
    return data
  },

  // Create announcement
  async create(input: AnnouncementInput): Promise<Announcement> {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .insert([{
        ...input,
        attachments: input.attachments || [],
        target_group_ids: input.target_group_ids || [],
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Update announcement
  async update(input: AnnouncementUpdateInput): Promise<Announcement> {
    const { id, ...updateData } = input

    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Publish announcement
  async publish(id: string): Promise<Announcement> {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Archive announcement
  async archive(id: string): Promise<Announcement> {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .update({ status: 'archived' })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Delete announcement
  async delete(id: string): Promise<void> {
    const { error } = await (supabase as any)
      .from(TABLE_NAME)
      .delete()
      .eq('id', id)

    if (error) throw error
  },

  // Toggle pin status
  async togglePin(id: string, isPinned: boolean): Promise<Announcement> {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .update({ is_pinned: isPinned })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  },

  // Get stats
  async getStats(organizationId: string): Promise<AnnouncementStats> {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .select('id, status, priority, is_pinned')
      .eq('organization_id', organizationId)

    if (error) throw error

    const announcements = data || []

    return {
      total: announcements.length,
      published: announcements.filter((a: any) => a.status === 'published').length,
      draft: announcements.filter((a: any) => a.status === 'draft').length,
      scheduled: announcements.filter((a: any) => a.status === 'scheduled').length,
      archived: announcements.filter((a: any) => a.status === 'archived').length,
      urgent: announcements.filter((a: any) => a.priority === 'urgent').length,
      pinned: announcements.filter((a: any) => a.is_pinned).length,
    }
  },

  // Get categories (distinct values)
  async getCategories(organizationId: string): Promise<string[]> {
    const { data, error } = await (supabase as any)
      .from(TABLE_NAME)
      .select('category')
      .eq('organization_id', organizationId)
      .not('category', 'is', null)

    if (error) throw error

    const categories = [...new Set((data || []).map((d: any) => d.category).filter(Boolean))]
    return categories.sort()
  },
}
