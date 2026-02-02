import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  FileText,
  Send,
  Archive,
  AlertTriangle,
  Pin,
} from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../hooks/useOrganization'
import { useAnnouncements } from '../hooks/useAnnouncements'
import { AnnouncementCard, AnnouncementModal, DeleteAnnouncementModal } from '../components'
import type { Announcement, AnnouncementFilters, AnnouncementStatus, AnnouncementPriority } from '../types/announcements.types'

export default function AnnouncementsPage() {
  const { t } = useTranslation(['announcements', 'common'])
  const { currentOrganizationId } = useOrganization()

  // Filter state
  const [filters, setFilters] = useState<AnnouncementFilters>({
    status: 'all',
    priority: 'all',
    search: '',
  })

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null)
  const [deletingAnnouncement, setDeletingAnnouncement] = useState<Announcement | null>(null)

  const {
    announcements,
    isLoading,
    stats,
    isLoadingStats,
    publishAnnouncement,
    isPublishing,
    archiveAnnouncement,
    isArchiving,
    deleteAnnouncement,
    isDeleting,
    togglePin,
    isTogglingPin,
    refetch,
  } = useAnnouncements({
    organizationId: currentOrganizationId || undefined,
    filters,
  })

  const handlePublish = async (id: string) => {
    try {
      await publishAnnouncement(id)
      toast.success(t('announcements.published') || 'Announcement published')
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  const handleArchive = async (id: string) => {
    try {
      await archiveAnnouncement(id)
      toast.success(t('announcements.archived') || 'Announcement archived')
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  const handleDelete = async () => {
    if (!deletingAnnouncement) return
    try {
      await deleteAnnouncement(deletingAnnouncement.id)
      toast.success(t('announcements.deleted') || 'Announcement deleted')
      setDeletingAnnouncement(null)
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  const handleTogglePin = async (id: string, isPinned: boolean) => {
    try {
      await togglePin({ id, isPinned })
      toast.success(isPinned
        ? (t('announcements.pinned') || 'Announcement pinned')
        : (t('announcements.unpinned') || 'Announcement unpinned')
      )
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
            <Megaphone className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('announcements.title') || 'Announcements'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t('announcements.subtitle') || 'Manage your organization announcements'}
            </p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          {t('announcements.newAnnouncement') || 'New Announcement'}
        </button>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <FileText size={16} />
              <span className="text-xs">{t('announcements.total') || 'Total'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <Send size={16} />
              <span className="text-xs">{t('announcements.status.published') || 'Published'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.published}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <FileText size={16} />
              <span className="text-xs">{t('announcements.status.draft') || 'Draft'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.draft}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Archive size={16} />
              <span className="text-xs">{t('announcements.status.scheduled') || 'Scheduled'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.scheduled}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-red-500 mb-1">
              <AlertTriangle size={16} />
              <span className="text-xs">{t('announcements.urgentCount') || 'Urgent'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.urgent}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-amber-500 mb-1">
              <Pin size={16} />
              <span className="text-xs">{t('announcements.pinnedCount') || 'Pinned'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.pinned}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <Search size={18} className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
              placeholder={t('announcements.searchPlaceholder') || 'Search announcements...'}
              className="w-full ps-10 pe-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as AnnouncementStatus | 'all' })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">{t('common.allStatuses') || 'All Statuses'}</option>
              <option value="draft">{t('announcements.status.draft') || 'Draft'}</option>
              <option value="scheduled">{t('announcements.status.scheduled') || 'Scheduled'}</option>
              <option value="published">{t('announcements.status.published') || 'Published'}</option>
              <option value="archived">{t('announcements.status.archived') || 'Archived'}</option>
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filters.priority || 'all'}
              onChange={(e) => setFilters({ ...filters, priority: e.target.value as AnnouncementPriority | 'all' })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">{t('common.allPriorities') || 'All Priorities'}</option>
              <option value="normal">{t('announcements.priority.normal') || 'Normal'}</option>
              <option value="important">{t('announcements.priority.important') || 'Important'}</option>
              <option value="urgent">{t('announcements.priority.urgent') || 'Urgent'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Announcements Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600" />
        </div>
      ) : announcements.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Megaphone size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {t('announcements.noAnnouncements') || 'No announcements'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {t('announcements.noAnnouncementsDesc') || 'Create your first announcement to communicate with your community.'}
          </p>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={18} />
            {t('announcements.createFirst') || 'Create First Announcement'}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              onEdit={setEditingAnnouncement}
              onDelete={setDeletingAnnouncement}
              onPublish={handlePublish}
              onArchive={handleArchive}
              onTogglePin={handleTogglePin}
              isPublishing={isPublishing}
              isArchiving={isArchiving}
              isTogglingPin={isTogglingPin}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <AnnouncementModal
        isOpen={showCreateModal || !!editingAnnouncement}
        onClose={() => {
          setShowCreateModal(false)
          setEditingAnnouncement(null)
        }}
        onSave={() => {
          refetch()
          setShowCreateModal(false)
          setEditingAnnouncement(null)
        }}
        announcement={editingAnnouncement}
      />

      {/* Delete Confirmation Modal */}
      <DeleteAnnouncementModal
        isOpen={!!deletingAnnouncement}
        onClose={() => setDeletingAnnouncement(null)}
        onConfirm={handleDelete}
        announcement={deletingAnnouncement}
        isDeleting={isDeleting}
      />
    </div>
  )
}
