import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../../hooks/useOrganization'
import { useCampaigns } from '../../hooks/useCampaigns'
import type { CreateCampaignInput, CampaignStatus } from '../../types/qurbani.types'

interface CreateCampaignModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
}

const initialFormData: CreateCampaignInput = {
  name: '',
  description: null,
  year: new Date().getFullYear(),
  hijri_year: null,
  registration_start: null,
  registration_deadline: '',
  slaughter_start_date: '',
  slaughter_end_date: '',
  distribution_start_date: null,
  distribution_end_date: null,
  sheep_price: null,
  cow_price: null,
  camel_price: null,
  currency: 'USD',
  sheep_capacity: null,
  cow_capacity: null,
  camel_capacity: null,
  allows_local_pickup: true,
  allows_full_charity: true,
  allows_overseas: false,
  status: 'draft' as CampaignStatus,
  allow_guest_registration: true,
  require_full_payment: false,
  deposit_amount: null,
}

export default function CreateCampaignModal({
  isOpen,
  onClose,
  onSave,
}: CreateCampaignModalProps) {
  const { t } = useTranslation('qurbani')
  const { currentOrganizationId } = useOrganization()
  const { createCampaign, isCreating } = useCampaigns({ organizationId: currentOrganizationId || undefined })

  const [formData, setFormData] = useState<CreateCampaignInput>(initialFormData)

  useEffect(() => {
    if (isOpen) {
      setFormData(initialFormData)
    }
  }, [isOpen])

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

    if (!formData.name || !formData.registration_deadline || !formData.slaughter_start_date || !formData.slaughter_end_date) {
      toast.error(t('fillRequiredFields') || 'Please fill in all required fields')
      return
    }

    try {
      await createCampaign(formData)
      toast.success(t('campaignCreated') || 'Campaign created successfully')
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(t('failedToCreate') || 'Failed to create campaign', {
        description: error.message,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t('createCampaign') || 'Create Campaign'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Basic Info */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {t('basicInfo') || 'Basic Information'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('campaignName') || 'Campaign Name'} *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Qurbani 2026"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('year') || 'Year'} *
                </label>
                <input
                  type="number"
                  name="year"
                  value={formData.year}
                  onChange={handleChange}
                  required
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
                  placeholder="e.g., 1447"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Dates */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {t('dates') || 'Important Dates'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('registrationDeadline') || 'Registration Deadline'} *
                </label>
                <input
                  type="date"
                  name="registration_deadline"
                  value={formData.registration_deadline}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('registrationStart') || 'Registration Start'}
                </label>
                <input
                  type="date"
                  name="registration_start"
                  value={formData.registration_start || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('slaughterStartDate') || 'Slaughter Start Date'} *
                </label>
                <input
                  type="date"
                  name="slaughter_start_date"
                  value={formData.slaughter_start_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('slaughterEndDate') || 'Slaughter End Date'} *
                </label>
                <input
                  type="date"
                  name="slaughter_end_date"
                  value={formData.slaughter_end_date}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {t('pricing') || 'Pricing'}
            </h3>
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
                  {t('cowPricePerShare') || 'Cow Price (per 1/7)'}
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
                  {t('camelPricePerShare') || 'Camel Price (per 1/7)'}
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
          </div>

          {/* Capacity */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {t('capacity') || 'Capacity'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('sheepCapacity') || 'Sheep Capacity'}
                </label>
                <input
                  type="number"
                  name="sheep_capacity"
                  value={formData.sheep_capacity || ''}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('cowCapacity') || 'Cow Capacity'}
                </label>
                <input
                  type="number"
                  name="cow_capacity"
                  value={formData.cow_capacity || ''}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('camelCapacity') || 'Camel Capacity'}
                </label>
                <input
                  type="number"
                  name="camel_capacity"
                  value={formData.camel_capacity || ''}
                  onChange={handleChange}
                  min="0"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Distribution Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wide">
              {t('distributionOptions') || 'Distribution Options'}
            </h3>
            <div className="space-y-3">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allows_local_pickup"
                  checked={formData.allows_local_pickup}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t('allowLocalPickup') || 'Allow local pickup'}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allows_full_charity"
                  checked={formData.allows_full_charity}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t('allowFullCharity') || 'Allow full charity donation'}
                </span>
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  name="allows_overseas"
                  checked={formData.allows_overseas}
                  onChange={handleChange}
                  className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  {t('allowOverseas') || 'Allow overseas distribution'}
                </span>
              </label>
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('status') || 'Status'}
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="draft">{t('statusDraft') || 'Draft'}</option>
              <option value="open">{t('statusOpen') || 'Open'}</option>
            </select>
          </div>
        </form>

        {/* Footer */}
        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
          >
            {t('common:cancel') || 'Cancel'}
          </button>
          <button
            onClick={handleSubmit}
            disabled={isCreating}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isCreating ? t('common:saving') || 'Saving...' : t('common:create') || 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}
