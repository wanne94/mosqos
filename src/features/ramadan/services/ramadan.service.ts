/**
 * Ramadan Service
 * Handles Ramadan settings and schedule management
 */

import { supabase } from '@/lib/supabase/client'
import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  RamadanSettings,
  CreateRamadanSettingsInput,
  UpdateRamadanSettingsInput,
  IftarEvent,
} from '../types'

const db = supabase as SupabaseClient<any>

// Default Ramadan settings
const DEFAULT_SETTINGS: Partial<RamadanSettings> = {
  taraweeh_rakats: 20,
  is_active: false,
}

export const ramadanService = {
  /**
   * Get Ramadan settings for an organization
   */
  async getSettings(organizationId: string): Promise<RamadanSettings | null> {
    const { data, error } = await db
      .from('ramadan_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .order('hijri_year', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('Error fetching ramadan settings:', error)
      return null
    }

    return data
  },

  /**
   * Get active Ramadan settings
   */
  async getActiveSettings(organizationId: string): Promise<RamadanSettings | null> {
    const { data, error } = await db
      .from('ramadan_settings')
      .select('*')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .maybeSingle()

    if (error) {
      console.error('Error fetching active ramadan settings:', error)
      return null
    }

    return data
  },

  /**
   * Create Ramadan settings
   */
  async createSettings(
    organizationId: string,
    input: CreateRamadanSettingsInput
  ): Promise<RamadanSettings> {
    const { data, error } = await db
      .from('ramadan_settings')
      .insert([{
        organization_id: organizationId,
        ...DEFAULT_SETTINGS,
        ...input,
      }])
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Update Ramadan settings
   */
  async updateSettings(
    settingsId: string,
    input: UpdateRamadanSettingsInput
  ): Promise<RamadanSettings> {
    const { data, error } = await db
      .from('ramadan_settings')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', settingsId)
      .select()
      .single()

    if (error) throw error
    return data
  },

  /**
   * Toggle Ramadan mode active status
   */
  async toggleActive(settingsId: string, isActive: boolean): Promise<RamadanSettings> {
    return this.updateSettings(settingsId, { is_active: isActive })
  },

  /**
   * Get upcoming Iftar events from events table
   */
  async getIftarEvents(organizationId: string, limit = 5): Promise<IftarEvent[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await db
      .from('events')
      .select('id, title, start_date, start_time, location, capacity')
      .eq('organization_id', organizationId)
      .eq('event_type', 'iftar')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(limit)

    if (error) {
      console.error('Error fetching iftar events:', error)
      return []
    }

    // Get RSVP counts
    const events = await Promise.all(
      (data || []).map(async (event: any) => {
        const { count } = await db
          .from('event_rsvps')
          .select('*', { count: 'exact', head: true })
          .eq('event_id', event.id)
          .eq('status', 'confirmed')

        return {
          id: event.id,
          title: event.title,
          date: event.start_date,
          time: event.start_time || '',
          location: event.location,
          capacity: event.capacity,
          rsvp_count: count || 0,
        }
      })
    )

    return events
  },

  /**
   * Get Taraweeh events from events table
   */
  async getTaraweehSchedule(organizationId: string): Promise<any[]> {
    const today = new Date().toISOString().split('T')[0]

    const { data, error } = await db
      .from('events')
      .select('id, title, start_date, start_time, description')
      .eq('organization_id', organizationId)
      .eq('event_type', 'taraweeh')
      .gte('start_date', today)
      .order('start_date', { ascending: true })
      .limit(10)

    if (error) {
      console.error('Error fetching taraweeh schedule:', error)
      return []
    }

    return data || []
  },

  /**
   * Calculate days remaining in Ramadan
   */
  calculateDaysRemaining(settings: RamadanSettings | null): {
    daysRemaining: number
    currentDay: number
    totalDays: number
    isRamadan: boolean
  } {
    if (!settings?.start_date || !settings?.end_date) {
      return { daysRemaining: 0, currentDay: 0, totalDays: 30, isRamadan: false }
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const start = new Date(settings.start_date)
    start.setHours(0, 0, 0, 0)

    const end = new Date(settings.end_date)
    end.setHours(0, 0, 0, 0)

    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1

    if (today < start) {
      // Before Ramadan
      const daysUntilStart = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      return { daysRemaining: daysUntilStart, currentDay: 0, totalDays, isRamadan: false }
    }

    if (today > end) {
      // After Ramadan
      return { daysRemaining: 0, currentDay: totalDays, totalDays, isRamadan: false }
    }

    // During Ramadan
    const currentDay = Math.ceil((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1
    const daysRemaining = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

    return { daysRemaining, currentDay, totalDays, isRamadan: true }
  },
}
