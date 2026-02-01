import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../../hooks/useOrganization'
import { useShares } from '../../hooks/useShares'
import type {
  QurbaniCampaign,
  CreateShareInput,
} from '../../types/qurbani.types'
import {
  AnimalType,
  DistributionType,
  IntentionType,
} from '../../types/qurbani.types'

interface RegisterShareModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  campaignId: string
  campaign: QurbaniCampaign | null
}

export default function RegisterShareModal({
  isOpen,
  onClose,
  onSave,
  campaignId,
  campaign,
}: RegisterShareModalProps) {
  const { t } = useTranslation('qurbani')
  const { currentOrganizationId } = useOrganization()
  const { createShare, isCreating } = useShares({ organizationId: currentOrganizationId || undefined })

  const [formData, setFormData] = useState<Partial<CreateShareInput>>({
    campaign_id: campaignId,
    animal_type: AnimalType.SHEEP,
    quantity: 1,
    distribution_type: DistributionType.LOCAL_PICKUP,
    intention_type: IntentionType.SELF,
    intention_names: [],
    amount_paid: 0,
  })

  const [intentionNamesInput, setIntentionNamesInput] = useState('')

  useEffect(() => {
    if (isOpen) {
      setFormData({
        campaign_id: campaignId,
        animal_type: AnimalType.SHEEP,
        quantity: 1,
        distribution_type: DistributionType.LOCAL_PICKUP,
        intention_type: IntentionType.SELF,
        intention_names: [],
        amount_paid: 0,
      })
      setIntentionNamesInput('')
    }
  }, [isOpen, campaignId])

  const getUnitPrice = () => {
    if (!campaign) return 0
    switch (formData.animal_type) {
      case AnimalType.SHEEP: return campaign.sheep_price || 0
      case AnimalType.COW: return campaign.cow_price || 0
      case AnimalType.CAMEL: return campaign.camel_price || 0
      default: return 0
    }
  }

  const unitPrice = getUnitPrice()
  const totalAmount = unitPrice * (formData.quantity || 1)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : Number(value)) : value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!formData.guest_name && !formData.member_id) {
      toast.error(t('registrantRequired') || 'Please enter registrant name')
      return
    }

    try {
      const input: CreateShareInput = {
        campaign_id: campaignId,
        animal_type: formData.animal_type || AnimalType.SHEEP,
        quantity: formData.quantity || 1,
        guest_name: formData.guest_name || null,
        guest_email: formData.guest_email || null,
        guest_phone: formData.guest_phone || null,
        distribution_type: formData.distribution_type || DistributionType.LOCAL_PICKUP,
        intention_type: formData.intention_type,
        intention_names: intentionNamesInput.split(',').map(n => n.trim()).filter(Boolean),
        unit_price: unitPrice,
        total_amount: totalAmount,
        amount_paid: formData.amount_paid || 0,
        notes: formData.notes || null,
      }

      await createShare(input)
      toast.success(t('shareRegistered') || 'Share registered successfully')
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(t('failedToRegister') || 'Failed to register share', {
        description: error.message,
      })
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-lg mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {t('registerShare') || 'Register Qurbani Share'}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Registrant Info */}
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              {t('registrantName') || 'Registrant Name'} *
            </label>
            <input
              type="text"
              name="guest_name"
              value={formData.guest_name || ''}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('email') || 'Email'}
              </label>
              <input
                type="email"
                name="guest_email"
                value={formData.guest_email || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('phone') || 'Phone'}
              </label>
              <input
                type="tel"
                name="guest_phone"
                value={formData.guest_phone || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Animal Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('animalType') || 'Animal Type'} *
              </label>
              <select
                name="animal_type"
                value={formData.animal_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value={AnimalType.SHEEP}>{t('sheep') || 'Sheep'} (${campaign?.sheep_price || 0})</option>
                <option value={AnimalType.COW}>{t('cowShare') || 'Cow (1/7 share)'} (${campaign?.cow_price || 0})</option>
                <option value={AnimalType.CAMEL}>{t('camelShare') || 'Camel (1/7 share)'} (${campaign?.camel_price || 0})</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('quantity') || 'Quantity'}
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                max={formData.animal_type === AnimalType.SHEEP ? 10 : 7}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Distribution & Intention */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('distribution') || 'Distribution'}
              </label>
              <select
                name="distribution_type"
                value={formData.distribution_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value={DistributionType.LOCAL_PICKUP}>{t('localPickup') || 'Local Pickup'}</option>
                <option value={DistributionType.FULL_CHARITY}>{t('fullCharity') || 'Full Charity'}</option>
                <option value={DistributionType.HYBRID}>{t('hybrid') || 'Hybrid'}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('intentionType') || 'On Behalf Of'}
              </label>
              <select
                name="intention_type"
                value={formData.intention_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value={IntentionType.SELF}>{t('self') || 'Self'}</option>
                <option value={IntentionType.FAMILY}>{t('family') || 'Family'}</option>
                <option value={IntentionType.DECEASED}>{t('deceased') || 'Deceased'}</option>
                <option value={IntentionType.OTHER}>{t('other') || 'Other'}</option>
              </select>
            </div>
          </div>

          {formData.intention_type !== IntentionType.SELF && (
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('intentionNames') || 'Names (comma-separated)'}
              </label>
              <input
                type="text"
                value={intentionNamesInput}
                onChange={(e) => setIntentionNamesInput(e.target.value)}
                placeholder="Name 1, Name 2, ..."
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          )}

          {/* Payment */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">{t('unitPrice') || 'Unit Price'}:</span>
              <span className="font-medium text-slate-900 dark:text-white">${unitPrice}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-slate-600 dark:text-slate-400">{t('quantity') || 'Quantity'}:</span>
              <span className="font-medium text-slate-900 dark:text-white">{formData.quantity || 1}</span>
            </div>
            <div className="flex justify-between text-lg font-semibold border-t border-slate-200 dark:border-slate-700 pt-2">
              <span className="text-slate-900 dark:text-white">{t('total') || 'Total'}:</span>
              <span className="text-emerald-600 dark:text-emerald-400">${totalAmount}</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('amountPaid') || 'Amount Paid Now'}
              </label>
              <input
                type="number"
                name="amount_paid"
                value={formData.amount_paid || 0}
                onChange={handleChange}
                min="0"
                max={totalAmount}
                step="0.01"
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>
          </div>
        </form>

        <div className="flex gap-3 p-6 border-t border-slate-200 dark:border-slate-700">
          <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700">
            {t('common:cancel') || 'Cancel'}
          </button>
          <button onClick={handleSubmit} disabled={isCreating} className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50">
            {isCreating ? t('common:saving') || 'Saving...' : t('register') || 'Register'}
          </button>
        </div>
      </div>
    </div>
  )
}
