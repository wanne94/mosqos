import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { X, FileText, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../hooks/useOrganization'
import { useIslamicServices, useServiceTypes } from '../hooks/useIslamicServices'
import type {
  IslamicService,
  IslamicServiceInput,
  IslamicServiceType,
  NikahData,
  JanazahData,
  ShahadaData,
  Witness,
} from '../types/islamic-services.types'

interface ServiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  service?: IslamicService | null
  preselectedType?: string
}

export default function ServiceModal({
  isOpen,
  onClose,
  onSave,
  service,
  preselectedType,
}: ServiceModalProps) {
  const { t } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const { createService, updateService, isCreating, isUpdating } = useIslamicServices({
    organizationId: currentOrganizationId || undefined,
  })
  const { serviceTypes } = useServiceTypes(currentOrganizationId || undefined, true)

  const isEditing = !!service

  // Form state
  const [serviceTypeId, setServiceTypeId] = useState('')
  const [scheduledDate, setScheduledDate] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [location, setLocation] = useState('')
  const [feeAmount, setFeeAmount] = useState(0)
  const [requestorName, setRequestorName] = useState('')
  const [requestorPhone, setRequestorPhone] = useState('')
  const [requestorEmail, setRequestorEmail] = useState('')
  const [notes, setNotes] = useState('')
  const [witnesses, setWitnesses] = useState<Witness[]>([])

  // Service-specific data
  const [nikahData, setNikahData] = useState<Partial<NikahData>>({})
  const [janazahData, setJanazahData] = useState<Partial<JanazahData>>({})
  const [shahadaData, setShahadaData] = useState<Partial<ShahadaData>>({})

  const selectedType = serviceTypes.find((t) => t.id === serviceTypeId)

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (service) {
        setServiceTypeId(service.service_type_id)
        setScheduledDate(service.scheduled_date || '')
        setScheduledTime(service.scheduled_time || '')
        setLocation(service.location || '')
        setFeeAmount(service.fee_amount)
        setRequestorName(service.requestor_name || '')
        setRequestorPhone(service.requestor_phone || '')
        setRequestorEmail(service.requestor_email || '')
        setNotes(service.notes || '')
        setWitnesses(service.witnesses || [])

        // Load service-specific data
        const slug = service.service_type?.slug
        if (slug === 'nikah') setNikahData(service.service_data as NikahData || {})
        if (slug === 'janazah') setJanazahData(service.service_data as JanazahData || {})
        if (slug === 'shahada') setShahadaData(service.service_data as ShahadaData || {})
      } else {
        setServiceTypeId(preselectedType || '')
        setScheduledDate('')
        setScheduledTime('')
        setLocation('')
        setFeeAmount(0)
        setRequestorName('')
        setRequestorPhone('')
        setRequestorEmail('')
        setNotes('')
        setWitnesses([])
        setNikahData({})
        setJanazahData({})
        setShahadaData({})
      }
    }
  }, [isOpen, service, preselectedType])

  // Update fee when type changes
  useEffect(() => {
    if (!isEditing && selectedType) {
      setFeeAmount(selectedType.default_fee)
    }
  }, [selectedType, isEditing])

  const addWitness = () => {
    setWitnesses([...witnesses, { id: crypto.randomUUID(), name: '', phone: '' }])
  }

  const removeWitness = (id: string) => {
    setWitnesses(witnesses.filter((w) => w.id !== id))
  }

  const updateWitness = (id: string, field: keyof Witness, value: string) => {
    setWitnesses(witnesses.map((w) => (w.id === id ? { ...w, [field]: value } : w)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!currentOrganizationId || !serviceTypeId) {
      toast.error(t('common.error') || 'Error')
      return
    }

    // Get service-specific data based on type
    let serviceData: Record<string, any> = {}
    const slug = selectedType?.slug

    if (slug === 'nikah') serviceData = nikahData
    else if (slug === 'janazah') serviceData = janazahData
    else if (slug === 'shahada') serviceData = shahadaData

    const input: IslamicServiceInput = {
      organization_id: currentOrganizationId,
      service_type_id: serviceTypeId,
      scheduled_date: scheduledDate || undefined,
      scheduled_time: scheduledTime || undefined,
      location: location || undefined,
      fee_amount: feeAmount,
      requestor_name: requestorName || undefined,
      requestor_phone: requestorPhone || undefined,
      requestor_email: requestorEmail || undefined,
      notes: notes || undefined,
      witnesses,
      service_data: serviceData,
    }

    try {
      if (isEditing && service) {
        await updateService({ id: service.id, ...input })
        toast.success(t('services.updated') || 'Service updated')
      } else {
        await createService(input)
        toast.success(t('services.created') || 'Service created')
      }
      onSave()
      onClose()
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  if (!isOpen) return null

  const isSaving = isCreating || isUpdating
  const slug = selectedType?.slug

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
              <FileText className="text-purple-600 dark:text-purple-400" size={20} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              {isEditing
                ? (t('services.editService') || 'Edit Service')
                : (t('services.newService') || 'New Service Request')}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300">
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          <div className="p-6 space-y-6">
            {/* Service Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('services.serviceType') || 'Service Type'} *
              </label>
              <select
                value={serviceTypeId}
                onChange={(e) => setServiceTypeId(e.target.value)}
                disabled={isEditing}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white disabled:opacity-50"
              >
                <option value="">{t('services.selectType') || 'Select service type...'}</option>
                {serviceTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Requestor Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.requestorName') || 'Requestor Name'}
                </label>
                <input
                  type="text"
                  value={requestorName}
                  onChange={(e) => setRequestorName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.requestorPhone') || 'Phone'}
                </label>
                <input
                  type="tel"
                  value={requestorPhone}
                  onChange={(e) => setRequestorPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.requestorEmail') || 'Email'}
                </label>
                <input
                  type="email"
                  value={requestorEmail}
                  onChange={(e) => setRequestorEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            {/* Schedule & Location */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.scheduledDate') || 'Scheduled Date'}
                </label>
                <input
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.scheduledTime') || 'Time'}
                </label>
                <input
                  type="time"
                  value={scheduledTime}
                  onChange={(e) => setScheduledTime(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {t('services.fee') || 'Fee'} ($)
                </label>
                <input
                  type="number"
                  value={feeAmount}
                  onChange={(e) => setFeeAmount(Number(e.target.value))}
                  min="0"
                  step="0.01"
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('services.location') || 'Location'}
              </label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder={t('services.locationPlaceholder') || 'Mosque main hall, etc.'}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              />
            </div>

            {/* Service-Specific Forms */}
            {slug === 'nikah' && (
              <NikahForm data={nikahData} onChange={setNikahData} />
            )}

            {slug === 'janazah' && (
              <JanazahForm data={janazahData} onChange={setJanazahData} />
            )}

            {slug === 'shahada' && (
              <ShahadaForm data={shahadaData} onChange={setShahadaData} />
            )}

            {/* Witnesses */}
            {selectedType?.requires_witnesses && (
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300">
                    {t('services.witnesses') || 'Witnesses'} ({selectedType.witness_count} {t('common.required') || 'required'})
                  </label>
                  <button
                    type="button"
                    onClick={addWitness}
                    className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
                  >
                    <Plus size={14} />
                    {t('services.addWitness') || 'Add Witness'}
                  </button>
                </div>
                <div className="space-y-2">
                  {witnesses.map((witness, idx) => (
                    <div key={witness.id} className="flex items-center gap-2">
                      <span className="text-sm text-slate-500 w-6">{idx + 1}.</span>
                      <input
                        type="text"
                        value={witness.name}
                        onChange={(e) => updateWitness(witness.id, 'name', e.target.value)}
                        placeholder={t('services.witnessName') || 'Full name'}
                        className="flex-1 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      />
                      <input
                        type="tel"
                        value={witness.phone || ''}
                        onChange={(e) => updateWitness(witness.id, 'phone', e.target.value)}
                        placeholder={t('services.witnessPhone') || 'Phone'}
                        className="w-32 px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => removeWitness(witness.id)}
                        className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                {t('services.notes') || 'Notes'}
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-y"
              />
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
              disabled={isSaving || !serviceTypeId}
              className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              {isSaving ? (t('common.saving') || 'Saving...') : (t('common.save') || 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Nikah Form Component
function NikahForm({ data, onChange }: { data: Partial<NikahData>; onChange: (data: Partial<NikahData>) => void }) {
  const { t } = useTranslation()

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-slate-900 dark:text-white">
        💒 {t('services.nikahDetails') || 'Nikah Details'}
      </h4>

      {/* Groom Info */}
      <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
        <h5 className="text-sm font-medium text-blue-700 dark:text-blue-400 mb-2">
          {t('services.groomInfo') || 'Groom Information'}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={data.groom_name || ''}
            onChange={(e) => onChange({ ...data, groom_name: e.target.value })}
            placeholder={t('services.groomName') || 'Groom full name *'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={data.groom_father_name || ''}
            onChange={(e) => onChange({ ...data, groom_father_name: e.target.value })}
            placeholder={t('services.fatherName') || "Father's name"}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="tel"
            value={data.groom_phone || ''}
            onChange={(e) => onChange({ ...data, groom_phone: e.target.value })}
            placeholder={t('common.phone') || 'Phone'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="email"
            value={data.groom_email || ''}
            onChange={(e) => onChange({ ...data, groom_email: e.target.value })}
            placeholder={t('common.email') || 'Email'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Bride Info */}
      <div className="bg-pink-50 dark:bg-pink-900/20 rounded-lg p-3">
        <h5 className="text-sm font-medium text-pink-700 dark:text-pink-400 mb-2">
          {t('services.brideInfo') || 'Bride Information'}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={data.bride_name || ''}
            onChange={(e) => onChange({ ...data, bride_name: e.target.value })}
            placeholder={t('services.brideName') || 'Bride full name *'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={data.bride_father_name || ''}
            onChange={(e) => onChange({ ...data, bride_father_name: e.target.value })}
            placeholder={t('services.fatherName') || "Father's name"}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="tel"
            value={data.bride_phone || ''}
            onChange={(e) => onChange({ ...data, bride_phone: e.target.value })}
            placeholder={t('common.phone') || 'Phone'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="email"
            value={data.bride_email || ''}
            onChange={(e) => onChange({ ...data, bride_email: e.target.value })}
            placeholder={t('common.email') || 'Email'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Mahr */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            {t('services.mahrAmount') || 'Mahr Amount'}
          </label>
          <input
            type="number"
            value={data.mahr_amount || ''}
            onChange={(e) => onChange({ ...data, mahr_amount: Number(e.target.value) })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
        <div className="md:col-span-2">
          <label className="block text-xs text-slate-500 dark:text-slate-400 mb-1">
            {t('services.mahrDescription') || 'Mahr Description'}
          </label>
          <input
            type="text"
            value={data.mahr_description || ''}
            onChange={(e) => onChange({ ...data, mahr_description: e.target.value })}
            placeholder={t('services.mahrDescPlaceholder') || 'e.g., Gold ring, cash, etc.'}
            className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  )
}

// Janazah Form Component
function JanazahForm({ data, onChange }: { data: Partial<JanazahData>; onChange: (data: Partial<JanazahData>) => void }) {
  const { t } = useTranslation()

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-slate-900 dark:text-white">
        🕌 {t('services.janazahDetails') || 'Janazah Details'}
      </h4>

      {/* Deceased Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={data.deceased_name || ''}
          onChange={(e) => onChange({ ...data, deceased_name: e.target.value })}
          placeholder={t('services.deceasedName') || 'Deceased full name *'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <select
          value={data.deceased_gender || ''}
          onChange={(e) => onChange({ ...data, deceased_gender: e.target.value as 'male' | 'female' })}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        >
          <option value="">{t('common.gender') || 'Gender'}</option>
          <option value="male">{t('common.male') || 'Male'}</option>
          <option value="female">{t('common.female') || 'Female'}</option>
        </select>
        <input
          type="date"
          value={data.deceased_death_date || ''}
          onChange={(e) => onChange({ ...data, deceased_death_date: e.target.value })}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <input
          type="text"
          value={data.deceased_nationality || ''}
          onChange={(e) => onChange({ ...data, deceased_nationality: e.target.value })}
          placeholder={t('common.nationality') || 'Nationality'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
      </div>

      {/* Family Contact */}
      <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3">
        <h5 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {t('services.familyContact') || 'Family Contact'}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input
            type="text"
            value={data.family_contact_name || ''}
            onChange={(e) => onChange({ ...data, family_contact_name: e.target.value })}
            placeholder={t('common.name') || 'Name'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="text"
            value={data.family_contact_relationship || ''}
            onChange={(e) => onChange({ ...data, family_contact_relationship: e.target.value })}
            placeholder={t('services.relationship') || 'Relationship'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="tel"
            value={data.family_contact_phone || ''}
            onChange={(e) => onChange({ ...data, family_contact_phone: e.target.value })}
            placeholder={t('common.phone') || 'Phone'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>

      {/* Burial Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={data.cemetery_name || ''}
          onChange={(e) => onChange({ ...data, cemetery_name: e.target.value })}
          placeholder={t('services.cemeteryName') || 'Cemetery name'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <input
          type="text"
          value={data.burial_location || ''}
          onChange={(e) => onChange({ ...data, burial_location: e.target.value })}
          placeholder={t('services.burialLocation') || 'Burial location/plot'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
      </div>

      <textarea
        value={data.special_instructions || ''}
        onChange={(e) => onChange({ ...data, special_instructions: e.target.value })}
        placeholder={t('services.specialInstructions') || 'Special instructions or requests...'}
        rows={2}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-y"
      />
    </div>
  )
}

// Shahada Form Component
function ShahadaForm({ data, onChange }: { data: Partial<ShahadaData>; onChange: (data: Partial<ShahadaData>) => void }) {
  const { t } = useTranslation()

  return (
    <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 space-y-4">
      <h4 className="font-medium text-slate-900 dark:text-white">
        ☪️ {t('services.shahadaDetails') || 'Shahada Details'}
      </h4>

      {/* New Muslim Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={data.birth_name || ''}
          onChange={(e) => onChange({ ...data, birth_name: e.target.value })}
          placeholder={t('services.birthName') || 'Birth name *'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <input
          type="text"
          value={data.chosen_muslim_name || ''}
          onChange={(e) => onChange({ ...data, chosen_muslim_name: e.target.value })}
          placeholder={t('services.chosenMuslimName') || 'Chosen Muslim name (optional)'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <input
          type="tel"
          value={data.phone || ''}
          onChange={(e) => onChange({ ...data, phone: e.target.value })}
          placeholder={t('common.phone') || 'Phone'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <input
          type="email"
          value={data.email || ''}
          onChange={(e) => onChange({ ...data, email: e.target.value })}
          placeholder={t('common.email') || 'Email'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
      </div>

      {/* Background */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input
          type="text"
          value={data.previous_religion || ''}
          onChange={(e) => onChange({ ...data, previous_religion: e.target.value })}
          placeholder={t('services.previousReligion') || 'Previous religion'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
        <input
          type="text"
          value={data.nationality || ''}
          onChange={(e) => onChange({ ...data, nationality: e.target.value })}
          placeholder={t('common.nationality') || 'Nationality'}
          className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
        />
      </div>

      <textarea
        value={data.reason_for_conversion || ''}
        onChange={(e) => onChange({ ...data, reason_for_conversion: e.target.value })}
        placeholder={t('services.reasonForConversion') || 'Reason for embracing Islam (optional)...'}
        rows={2}
        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white resize-y"
      />

      {/* Follow-up */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
        <h5 className="text-sm font-medium text-emerald-700 dark:text-emerald-400 mb-2">
          {t('services.followUp') || 'Follow-up'}
        </h5>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={data.mentor_name || ''}
            onChange={(e) => onChange({ ...data, mentor_name: e.target.value })}
            placeholder={t('services.mentorName') || 'Assigned mentor name'}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
          <input
            type="date"
            value={data.follow_up_date || ''}
            onChange={(e) => onChange({ ...data, follow_up_date: e.target.value })}
            className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg text-sm bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
          />
        </div>
      </div>
    </div>
  )
}
