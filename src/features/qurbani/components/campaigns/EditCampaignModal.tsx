import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useCampaigns } from '../../hooks/useCampaigns'
import type { QurbaniCampaign, UpdateCampaignInput, CampaignStatus } from '../../types/qurbani.types'

interface EditCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  campaign: QurbaniCampaign | null
}

export default function EditCampaignModal({
  isOpen,
  onClose,
  onSave,
  campaign,
}: EditCampaignModalProps) {
  const { t } = useTranslation('qurbani')
  const { updateCampaign, isUpdating } = useCampaigns()

  const [formData, setFormData] = useState<UpdateCampaignInput>({})

  useEffect(() => {
    if (isOpen && campaign) {
      setFormData({
        name: campaign.name,
        description: campaign.description,
        year: campaign.year,
        hijri_year: campaign.hijri_year,
        registration_start: campaign.registration_start,
        registration_deadline: campaign.registration_deadline,
        slaughter_start_date: campaign.slaughter_start_date,
        slaughter_end_date: campaign.slaughter_end_date,
        sheep_price: campaign.sheep_price,
        cow_price: campaign.cow_price,
        camel_price: campaign.camel_price,
        sheep_capacity: campaign.sheep_capacity,
        cow_capacity: campaign.cow_capacity,
        camel_capacity: campaign.camel_capacity,
        allows_local_pickup: campaign.allows_local_pickup,
        allows_full_charity: campaign.allows_full_charity,
        allows_overseas: campaign.allows_overseas,
        status: campaign.status,
      })
    }
  }, [isOpen, campaign])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target
    const checked = (e.target as HTMLInputElement).checked

    setFormData((prev) => ({
      ...prev,
      [name]:
        type === 'checkbox'
          ? checked
          : type === 'number'
          ? value === ''
            ? null
            : Number(value)
          : value || null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!campaign) return

    try {
      await updateCampaign({ id: campaign.id, input: formData })
      toast.success(t('campaignUpdated') || 'Campaign updated successfully')
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(t('failedToUpdate') || 'Failed to update campaign', {
        description: error.message,
      })
    }
  }

  if (!isOpen || !campaign) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t('editCampaign') || 'Edit Campaign'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('campaignName') || 'Campaign Name'} *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name || ''}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('year') || 'Year'}
              </label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('hijriYear') || 'Hijri Year'}
              </label>
              <input
                type="number"
                name="hijri_year"
                value={formData.hijri_year || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('registrationDeadline') || 'Registration Deadline'}
              </label>
              <input
                type="date"
                name="registration_deadline"
                value={formData.registration_deadline || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('slaughterStartDate') || 'Slaughter Start'}
              </label>
              <input
                type="date"
                name="slaughter_start_date"
                value={formData.slaughter_start_date || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('slaughterEndDate') || 'Slaughter End'}
              </label>
              <input
                type="date"
                name="slaughter_end_date"
                value={formData.slaughter_end_date || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('sheepPrice') || 'Sheep Price'}
              </label>
              <input
                type="number"
                name="sheep_price"
                value={formData.sheep_price || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('cowPricePerShare') || 'Cow (per 1/7)'}
              </label>
              <input
                type="number"
                name="cow_price"
                value={formData.cow_price || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('camelPricePerShare') || 'Camel (per 1/7)'}
              </label>
              <input
                type="number"
                name="camel_price"
                value={formData.camel_price || ''}
                onChange={handleChange}
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('status') || 'Status'}
            </label>
            <select
              name="status"
              value={formData.status || 'draft'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="draft">{t('statusDraft') || 'Draft'}</option>
              <option value="open">{t('statusOpen') || 'Open'}</option>
              <option value="closed">{t('statusClosed') || 'Closed'}</option>
              <option value="in_progress">{t('statusInProgress') || 'In Progress'}</option>
              <option value="completed">{t('statusCompleted') || 'Completed'}</option>
            </select>
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
          >
            {t('common:cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isUpdating}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {isUpdating ? t('common:saving') || 'Saving...' : t('common:save') || 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
