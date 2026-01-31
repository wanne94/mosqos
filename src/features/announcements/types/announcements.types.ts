// Announcement Types

export type AnnouncementPriority = 'normal' | 'important' | 'urgent'
export type AnnouncementStatus = 'draft' | 'scheduled' | 'published' | 'archived'
export type TargetAudience = 'all' | 'members' | 'specific_groups'

export interface MultiLanguageContent {
  en?: string
  ar?: string
  tr?: string
}

export interface AnnouncementAttachment {
  id: string
  name: string
  url: string
  type: string
  size: number
}

export interface Announcement {
  id: string
  organization_id: string

  // Multi-language content
  title: MultiLanguageContent
  content: MultiLanguageContent
  excerpt?: MultiLanguageContent

  // Classification
  priority: AnnouncementPriority
  category?: string

  // Scheduling
  status: AnnouncementStatus
  publish_at?: string
  expires_at?: string

  // Targeting
  target_audience: TargetAudience
  target_group_ids: string[]

  // Display options
  is_pinned: boolean
  show_in_portal: boolean
  show_in_admin: boolean

  // Media
  image_url?: string
  attachments: AnnouncementAttachment[]

  // Audit
  created_at: string
  updated_at: string
  published_at?: string
  created_by?: string
  updated_by?: string
}

export interface AnnouncementInput {
  organization_id: string
  title: MultiLanguageContent
  content: MultiLanguageContent
  excerpt?: MultiLanguageContent
  priority?: AnnouncementPriority
  category?: string
  status?: AnnouncementStatus
  publish_at?: string
  expires_at?: string
  target_audience?: TargetAudience
  target_group_ids?: string[]
  is_pinned?: boolean
  show_in_portal?: boolean
  show_in_admin?: boolean
  image_url?: string
  attachments?: AnnouncementAttachment[]
}

export interface AnnouncementUpdateInput extends Partial<AnnouncementInput> {
  id: string
}

export interface AnnouncementFilters {
  status?: AnnouncementStatus | 'all'
  priority?: AnnouncementPriority | 'all'
  search?: string
  category?: string
}

export interface AnnouncementStats {
  total: number
  published: number
  draft: number
  scheduled: number
  archived: number
  urgent: number
  pinned: number
}
