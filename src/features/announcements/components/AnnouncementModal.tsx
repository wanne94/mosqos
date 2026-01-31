import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, Globe, FileText, Calendar, Send } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../hooks/useOrganization'
import { useAnnouncements } from '../hooks/useAnnouncements'
import type {
  Announcement,
  AnnouncementInput,
  AnnouncementPriority,
  AnnouncementStatus,
  TargetAudience,
  MultiLanguageContent,
} from '../types/announcements.types'

interface AnnouncementModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  announcement?: Announcement | null
}

type ContentLang = 'en' | 'ar' | 'tr'

const emptyContent: MultiLanguageContent = { en: '', ar: '', tr: '' }

export default function AnnouncementModal({
  isOpen,
  onClose,
  onSave,
  announcement,
}: AnnouncementModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const { createAnnouncement, updateAnnouncement, isCreating, isUpdating, categories } = useAnnouncements({
    organizationId: currentOrganizationId || undefined,
  })

  const isEditing = !!announcement
  const [activeTab, setActiveTab] = useState<ContentLang>('en')

  // Form state
  const [title, setTitle] = useState<MultiLanguageContent>(emptyContent)
  const [content, setContent] = useState<MultiLanguageContent>(emptyContent)
  const [excerpt, setExcerpt] = useState<MultiLanguageContent>(emptyContent)
  const [priority, setPriority] = useState<AnnouncementPriority>('normal')
  const [status, setStatus] = useState<AnnouncementStatus>('draft')
  const [category, setCategory] = useState('')
  const [newCategory, setNewCategory] = useState('')
  const [targetAudience, setTargetAudience] = useState<TargetAudience>('all')
  const [isPinned, setIsPinned] = useState(false)
  const [showInPortal, setShowInPortal] = useState(true)
  const [publishAt, setPublishAt] = useState('')
  const [expiresAt, setExpiresAt] = useState('')
  const [imageUrl, setImageUrl] = useState('')

  // Reset form when modal opens/closes or announcement changes
  useEffect(() => {
    if (isOpen) {
      if (announcement) {
        setTitle(announcement.title || emptyContent)
        setContent(announcement.content || emptyContent)
        setExcerpt(announcement.excerpt || emptyContent)
        setPriority(announcement.priority)
        setStatus(announcement.status)
        setCategory(announcement.category || '')
        setTargetAudience(announcement.target_audience)
        setIsPinned(announcement.is_pinned)
        setShowInPortal(announcement.show_in_portal)
        setPublishAt(announcement.publish_at ? announcement.publish_at.slice(0, 16) : '')
        setExpiresAt(announcement.expires_at ? announcement.expires_at.slice(0, 16) : '')
        setImageUrl(announcement.image_url || '')
      } else {
        setTitle(emptyContent)
        setContent(emptyContent)
        setExcerpt(emptyContent)
        setPriority('normal')
        setStatus('draft')
        setCategory('')
        setNewCategory('')
        setTargetAudience('all')
        setIsPinned(false)
        setShowInPortal(true)
        setPublishAt('')
        setExpiresAt('')
        setImageUrl('')
      }
      setActiveTab('en')
    }
  }, [isOpen, announcement])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentOrganizationId) {
      toast.error(t('common.error') || 'Error')
      return
    }

    // Validate at least English title
    if (!title.en?.trim()) {
      toast.error(t('announcements.titleRequired') || 'English title is required')
      return
    }

    const finalCategory = newCategory.trim() || category

    const input: AnnouncementInput = {
      organization_id: currentOrganizationId,
      title,
      content,
      excerpt: excerpt.en || excerpt.ar || excerpt.tr ? excerpt : undefined,
      priority,
      status,
      category: finalCategory || undefined,
      target_audience: targetAudience,
      is_pinned: isPinned,
      show_in_portal: showInPortal,
      publish_at: publishAt ? new Date(publishAt).toISOString() : undefined,
      expires_at: expiresAt ? new Date(expiresAt).toISOString() : undefined,
      image_url: imageUrl || undefined,
    }

    try {
      if (isEditing && announcement) {
        await updateAnnouncement({ id: announcement.id, ...input })
        toast.success(t('announcements.updated') || 'Announcement updated')
      } else {
        await createAnnouncement(input)
        toast.success(t('announcements.created') || 'Announcement created')
      }
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  if (!isOpen) return null

  const isSaving = isCreating || isUpdating

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <FileText className="text-blue-600 dark:text-blue-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing
                ? (t('announcements.editAnnouncement') || 'Edit Announcement')
                : (t('announcements.createAnnouncement') || 'Create Announcement')}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Language Tabs */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                <Globe size={14} className="inline me-1" />
                {t('announcements.contentLanguage') || 'Content Language'}
              </label>
              <div className="flex border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                {(['en', 'ar', 'tr'] as ContentLang[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => setActiveTab(lang)}
                    className={`flex-1 px-4 py-2 text-sm font-medium ${
                      activeTab === lang
                        ? 'bg-blue-600 text-white'
                        : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700'
                    }`}
                  >
                    {lang === 'en' ? 'English' : lang === 'ar' ? 'العربية' : 'Türkçe'}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('announcements.title') || 'Title'} {activeTab === 'en' && '*'}
              </label>
              <input
                type="text"
                value={title[activeTab] || ''}
                onChange={(e) => setTitle({ ...title, [activeTab]: e.target.value })}
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
                placeholder={t('announcements.titlePlaceholder') || 'Enter announcement title...'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                required={activeTab === 'en'}
              />
            </div>

            {/* Content */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('announcements.content') || 'Content'}
              </label>
              <textarea
                value={content[activeTab] || ''}
                onChange={(e) => setContent({ ...content, [activeTab]: e.target.value })}
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
                placeholder={t('announcements.contentPlaceholder') || 'Write your announcement content...'}
                rows={6}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-y"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('announcements.excerpt') || 'Excerpt'} <span className="text-slate-400 font-normal">({t('common.optional') || 'Optional'})</span>
              </label>
              <textarea
                value={excerpt[activeTab] || ''}
                onChange={(e) => setExcerpt({ ...excerpt, [activeTab]: e.target.value })}
                dir={activeTab === 'ar' ? 'rtl' : 'ltr'}
                placeholder={t('announcements.excerptPlaceholder') || 'Short summary for cards and previews...'}
                rows={2}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-y"
              />
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('announcements.priority') || 'Priority'}
                </label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as AnnouncementPriority)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="normal">{t('announcements.priority.normal') || 'Normal'}</option>
                  <option value="important">{t('announcements.priority.important') || 'Important'}</option>
                  <option value="urgent">{t('announcements.priority.urgent') || 'Urgent'}</option>
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('announcements.status') || 'Status'}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as AnnouncementStatus)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="draft">{t('announcements.status.draft') || 'Draft'}</option>
                  <option value="scheduled">{t('announcements.status.scheduled') || 'Scheduled'}</option>
                  <option value="published">{t('announcements.status.published') || 'Published'}</option>
                  <option value="archived">{t('announcements.status.archived') || 'Archived'}</option>
                </select>
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('announcements.category') || 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => {
                    setCategory(e.target.value)
                    if (e.target.value) setNewCategory('')
                  }}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="">{t('announcements.selectCategory') || 'Select category...'}</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => {
                    setNewCategory(e.target.value)
                    if (e.target.value) setCategory('')
                  }}
                  placeholder={t('announcements.newCategory') || 'Or enter new category...'}
                  className="mt-2 w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                />
              </div>

              {/* Target Audience */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('announcements.targetAudience') || 'Target Audience'}
                </label>
                <select
                  value={targetAudience}
                  onChange={(e) => setTargetAudience(e.target.value as TargetAudience)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                >
                  <option value="all">{t('announcements.audience.all') || 'All Members'}</option>
                  <option value="members">{t('announcements.audience.members') || 'Registered Members Only'}</option>
                </select>
              </div>

              {/* Publish At */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar size={14} className="inline me-1" />
                  {t('announcements.publishAt') || 'Publish At'}
                </label>
                <input
                  type="datetime-local"
                  value={publishAt}
                  onChange={(e) => setPublishAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>

              {/* Expires At */}
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  <Calendar size={14} className="inline me-1" />
                  {t('announcements.expiresAt') || 'Expires At'}
                </label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Image URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('announcements.imageUrl') || 'Image URL'} <span className="text-slate-400 font-normal">({t('common.optional') || 'Optional'})</span>
              </label>
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.jpg"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Options */}
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPinned}
                  onChange={(e) => setIsPinned(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t('announcements.pinAnnouncement') || 'Pin this announcement'}
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showInPortal}
                  onChange={(e) => setShowInPortal(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t('announcements.showInPortal') || 'Show in member portal'}
                </span>
              </label>
            </div>
          </div>

          {/* Footer */}
          <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              {t('common.cancel') || 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSaving ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                  {t('common.saving') || 'Saving...'}
                </>
              ) : isEditing ? (
                t('common.save') || 'Save Changes'
              ) : (
                <>
                  <Send size={16} />
                  {t('announcements.create') || 'Create Announcement'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
