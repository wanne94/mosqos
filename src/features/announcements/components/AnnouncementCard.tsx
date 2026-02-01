import { useTranslation } from 'react-i18next'
import {
  Pin,
  Calendar,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Send,
  Archive,
  Globe,
  Users,
  AlertTriangle,
  AlertCircle,
} from 'lucide-react'
import { useState } from 'react'
import type { Announcement, AnnouncementPriority, AnnouncementStatus } from '../types/announcements.types'

interface AnnouncementCardProps {
  announcement: Announcement
  onEdit: (announcement: Announcement) => void
  onDelete: (announcement: Announcement) => void
  onPublish: (id: string) => void
  onArchive: (id: string) => void
  onTogglePin: (id: string, isPinned: boolean) => void
  isPublishing?: boolean
  isArchiving?: boolean
  isTogglingPin?: boolean
}

const priorityConfig: Record<AnnouncementPriority, { color: string; icon: React.ReactNode; label: string }> = {
  normal: {
    color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300',
    icon: null,
    label: 'Normal'
  },
  important: {
    color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    icon: <AlertCircle size={14} />,
    label: 'Important'
  },
  urgent: {
    color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    icon: <AlertTriangle size={14} />,
    label: 'Urgent'
  },
}

const statusConfig: Record<AnnouncementStatus, { color: string; label: string }> = {
  draft: { color: 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300', label: 'Draft' },
  scheduled: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400', label: 'Scheduled' },
  published: { color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Published' },
  archived: { color: 'bg-slate-100 text-slate-500 dark:bg-slate-700 dark:text-slate-400', label: 'Archived' },
}

export default function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onPublish,
  onArchive,
  onTogglePin,
  isPublishing,
  isArchiving,
  isTogglingPin,
}: AnnouncementCardProps) {
  const { t, i18n } = useTranslation()
  const [showMenu, setShowMenu] = useState(false)

  const currentLang = i18n.language as 'en' | 'ar' | 'tr'
  const title = announcement.title[currentLang] || announcement.title.en || 'Untitled'
  const excerpt = announcement.excerpt?.[currentLang] || announcement.excerpt?.en || ''
  const priority = priorityConfig[announcement.priority]
  const status = statusConfig[announcement.status]

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(i18n.language, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  return (
    <div className={`bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow ${announcement.is_pinned ? 'ring-2 ring-amber-400 dark:ring-amber-500' : ''}`}>
      {/* Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-700">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              {announcement.is_pinned && (
                <Pin size={14} className="text-amber-500 flex-shrink-0" />
              )}
              <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                {title}
              </h3>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${status.color}`}>
                {t(`announcements.status.${announcement.status}`) || status.label}
              </span>
              {announcement.priority !== 'normal' && (
                <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${priority.color}`}>
                  {priority.icon}
                  {t(`announcements.priority.${announcement.priority}`) || priority.label}
                </span>
              )}
              {announcement.category && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {announcement.category}
                </span>
              )}
            </div>
          </div>

          {/* Actions Menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded"
            >
              <MoreVertical size={18} className="text-slate-500" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
                <div className="absolute end-0 top-8 w-48 bg-white dark:bg-slate-800 rounded-lg shadow-lg border border-slate-200 dark:border-slate-700 z-20 py-1">
                  <button
                    onClick={() => { onEdit(announcement); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700"
                  >
                    <Edit size={16} />
                    {t('common.edit') || 'Edit'}
                  </button>

                  {announcement.status === 'draft' && (
                    <button
                      onClick={() => { onPublish(announcement.id); setShowMenu(false) }}
                      disabled={isPublishing}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Send size={16} />
                      {t('announcements.publish') || 'Publish'}
                    </button>
                  )}

                  {announcement.status === 'published' && (
                    <button
                      onClick={() => { onArchive(announcement.id); setShowMenu(false) }}
                      disabled={isArchiving}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                    >
                      <Archive size={16} />
                      {t('announcements.archive') || 'Archive'}
                    </button>
                  )}

                  <button
                    onClick={() => { onTogglePin(announcement.id, !announcement.is_pinned); setShowMenu(false) }}
                    disabled={isTogglingPin}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 disabled:opacity-50"
                  >
                    <Pin size={16} />
                    {announcement.is_pinned
                      ? (t('announcements.unpin') || 'Unpin')
                      : (t('announcements.pin') || 'Pin')}
                  </button>

                  <hr className="my-1 border-slate-200 dark:border-slate-700" />

                  <button
                    onClick={() => { onDelete(announcement); setShowMenu(false) }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                  >
                    <Trash2 size={16} />
                    {t('common.delete') || 'Delete'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {excerpt && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2 mb-3">
            {excerpt}
          </p>
        )}

        {/* Visibility & Targeting */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
          {announcement.show_in_portal && (
            <span className="flex items-center gap-1">
              <Globe size={12} />
              {t('announcements.portal') || 'Portal'}
            </span>
          )}
          {announcement.target_audience === 'all' ? (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {t('announcements.allMembers') || 'All Members'}
            </span>
          ) : announcement.target_audience === 'specific_groups' ? (
            <span className="flex items-center gap-1">
              <Users size={12} />
              {announcement.target_group_ids.length} {t('announcements.groups') || 'Groups'}
            </span>
          ) : null}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-900/50 rounded-b-lg flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-1">
          <Calendar size={12} />
          {formatDate(announcement.created_at)}
        </div>

        {announcement.publish_at && announcement.status === 'scheduled' && (
          <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
            <Clock size={12} />
            {t('announcements.scheduledFor') || 'Scheduled:'} {formatDate(announcement.publish_at)}
          </div>
        )}

        {announcement.expires_at && (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <Clock size={12} />
            {t('announcements.expiresOn') || 'Expires:'} {formatDate(announcement.expires_at)}
          </div>
        )}
      </div>
    </div>
  )
}
