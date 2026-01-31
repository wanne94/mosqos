import { useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Plus,
  Calendar,
  Package,
  Search,
  Filter,
  RefreshCw,
  Scissors,
  DollarSign,
  Users,
  Truck,
} from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../hooks/useOrganization'
import { useCampaigns, useCampaignStats } from '../hooks/useCampaigns'
import { useShares } from '../hooks/useShares'
import {
  CreateCampaignModal,
  EditCampaignModal,
  CampaignCard,
} from '../components/campaigns'
import {
  RegisterShareModal,
  ShareDetailModal,
  RecordPaymentModal,
  SharesTable,
} from '../components/shares'
import type {
  QurbaniCampaign,
  QurbaniShare,
  AnimalType,
  PaymentStatus,
  ProcessingStatus,
} from '../types/qurbani.types'

type TabType = 'campaigns' | 'shares'

export default function QurbaniPage() {
  const { t } = useTranslation('qurbani')
  const { currentOrganizationId } = useOrganization()

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('campaigns')

  // Selected campaign for shares view
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  // Modal states
  const [isCreateCampaignModalOpen, setIsCreateCampaignModalOpen] = useState(false)
  const [isEditCampaignModalOpen, setIsEditCampaignModalOpen] = useState(false)
  const [selectedCampaign, setSelectedCampaign] = useState<QurbaniCampaign | null>(null)
  const [isRegisterShareModalOpen, setIsRegisterShareModalOpen] = useState(false)
  const [isShareDetailModalOpen, setIsShareDetailModalOpen] = useState(false)
  const [selectedShare, setSelectedShare] = useState<QurbaniShare | null>(null)
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false)

  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [animalTypeFilter, setAnimalTypeFilter] = useState<AnimalType | ''>('')
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<PaymentStatus | ''>('')
  const [processingStatusFilter, setProcessingStatusFilter] = useState<ProcessingStatus | ''>('')

  // Fetch campaigns
  const {
    campaigns,
    isLoading: campaignsLoading,
    refetch: refetchCampaigns,
    deleteCampaign,
  } = useCampaigns({
    organizationId: currentOrganizationId || undefined,
  })

  // Fetch shares for selected campaign
  const {
    shares,
    isLoading: sharesLoading,
    refetch: refetchShares,
    deleteShare,
    updateProcessingStatus,
  } = useShares({
    organizationId: currentOrganizationId || undefined,
    filters: selectedCampaignId
      ? {
          campaign_id: selectedCampaignId,
          animal_type: animalTypeFilter || undefined,
          payment_status: paymentStatusFilter || undefined,
          processing_status: processingStatusFilter || undefined,
          search: searchQuery || undefined,
        }
      : undefined,
  })

  // Campaign stats for selected campaign
  const { data: campaignStats } = useCampaignStats(
    currentOrganizationId,
    selectedCampaignId
  )

  // Filter shares by search
  const filteredShares = useMemo(() => {
    if (!searchQuery.trim()) return shares
    const query = searchQuery.toLowerCase()
    return shares.filter(
      (share) =>
        share.share_number?.toLowerCase().includes(query) ||
        share.guest_name?.toLowerCase().includes(query) ||
        share.member?.first_name?.toLowerCase().includes(query) ||
        share.member?.last_name?.toLowerCase().includes(query)
    )
  }, [shares, searchQuery])

  const selectedCampaignData = campaigns.find((c) => c.id === selectedCampaignId)

  const handleEditCampaign = (campaign: QurbaniCampaign) => {
    setSelectedCampaign(campaign)
    setIsEditCampaignModalOpen(true)
  }

  const handleDeleteCampaign = async (campaign: QurbaniCampaign) => {
    if (window.confirm(t('confirmDeleteCampaign') || `Delete campaign "${campaign.name}"?`)) {
      try {
        await deleteCampaign(campaign.id)
        toast.success(t('campaignDeleted') || 'Campaign deleted')
      } catch (error: any) {
        toast.error(t('failedToDelete') || 'Failed to delete', {
          description: error.message,
        })
      }
    }
  }

  const handleViewShares = (campaign: QurbaniCampaign) => {
    setSelectedCampaignId(campaign.id)
    setActiveTab('shares')
  }

  const handleViewShare = (share: QurbaniShare) => {
    setSelectedShare(share)
    setIsShareDetailModalOpen(true)
  }

  const handleRecordPayment = (share: QurbaniShare) => {
    setSelectedShare(share)
    setIsRecordPaymentModalOpen(true)
  }

  const handleUpdateProcessingStatus = async (share: QurbaniShare, status: ProcessingStatus) => {
    try {
      await updateProcessingStatus({ id: share.id, status })
      toast.success(t('statusUpdated') || 'Status updated')
    } catch (error: any) {
      toast.error(t('failedToUpdate') || 'Failed to update', {
        description: error.message,
      })
    }
  }

  const handleDeleteShare = async (share: QurbaniShare) => {
    if (window.confirm(t('confirmDeleteShare') || 'Delete this share registration?')) {
      try {
        await deleteShare(share.id)
        toast.success(t('shareDeleted') || 'Share deleted')
      } catch (error: any) {
        toast.error(t('failedToDelete') || 'Failed to delete', {
          description: error.message,
        })
      }
    }
  }

  const refetchData = () => {
    refetchCampaigns()
    refetchShares()
  }

  const loading = campaignsLoading || sharesLoading

  return (
    <div className="p-8 animate-page-enter dark:bg-slate-900">
      <div className="mb-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {t('title') || 'Qurbani Management'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2">
              {t('subtitle') || 'Manage Qurbani campaigns and share registrations for Eid al-Adha'}
            </p>
          </div>
          {activeTab === 'campaigns' && (
            <button
              onClick={() => setIsCreateCampaignModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus size={18} />
              {t('createCampaign') || 'Create Campaign'}
            </button>
          )}
          {activeTab === 'shares' && selectedCampaignId && (
            <button
              onClick={() => setIsRegisterShareModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 transition-colors"
            >
              <Plus size={18} />
              {t('registerShare') || 'Register Share'}
            </button>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-slate-800 rounded-lg mb-6 shadow-sm">
          <div className="flex border-b border-slate-200 dark:border-slate-700">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'campaigns'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Calendar size={18} />
                {t('campaigns') || 'Campaigns'}
              </div>
            </button>
            <button
              onClick={() => setActiveTab('shares')}
              className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                activeTab === 'shares'
                  ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Package size={18} />
                {t('shares') || 'Shares'}
                {selectedCampaignData && (
                  <span className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                    {selectedCampaignData.name}
                  </span>
                )}
              </div>
            </button>
          </div>
        </div>

        {/* Campaign Stats (when viewing shares) */}
        {activeTab === 'shares' && selectedCampaignId && campaignStats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Scissors className="text-blue-600 dark:text-blue-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {campaignStats.total_shares}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('totalShares') || 'Total Shares'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign className="text-emerald-600 dark:text-emerald-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${campaignStats.total_collected.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('collected') || 'Collected'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <DollarSign className="text-amber-600 dark:text-amber-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    ${campaignStats.total_outstanding.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('outstanding') || 'Outstanding'}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Truck className="text-purple-600 dark:text-purple-400" size={20} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">
                    {campaignStats.by_processing_status.distributed +
                      campaignStats.by_processing_status.completed}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {t('distributed') || 'Distributed'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Shares Filters */}
        {activeTab === 'shares' && selectedCampaignId && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 shadow-sm">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative flex-1 min-w-[200px]">
                <Search
                  size={16}
                  className="absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder={t('searchShares') || 'Search by name or share number...'}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full ps-9 pe-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
                />
              </div>
              <select
                value={animalTypeFilter}
                onChange={(e) => setAnimalTypeFilter(e.target.value as AnimalType | '')}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">{t('allAnimals') || 'All Animals'}</option>
                <option value="sheep">{t('sheep') || 'Sheep'}</option>
                <option value="cow">{t('cow') || 'Cow'}</option>
                <option value="camel">{t('camel') || 'Camel'}</option>
              </select>
              <select
                value={paymentStatusFilter}
                onChange={(e) => setPaymentStatusFilter(e.target.value as PaymentStatus | '')}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">{t('allPayments') || 'All Payments'}</option>
                <option value="pending">{t('pending') || 'Pending'}</option>
                <option value="partial">{t('partial') || 'Partial'}</option>
                <option value="paid">{t('paid') || 'Paid'}</option>
              </select>
              <select
                value={processingStatusFilter}
                onChange={(e) => setProcessingStatusFilter(e.target.value as ProcessingStatus | '')}
                className="px-3 py-2 text-sm border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
              >
                <option value="">{t('allStatuses') || 'All Statuses'}</option>
                <option value="registered">{t('registered') || 'Registered'}</option>
                <option value="slaughtered">{t('slaughtered') || 'Slaughtered'}</option>
                <option value="processed">{t('processed') || 'Processed'}</option>
                <option value="ready_for_pickup">{t('readyForPickup') || 'Ready for Pickup'}</option>
                <option value="distributed">{t('distributed') || 'Distributed'}</option>
              </select>
              <button
                onClick={refetchData}
                className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
                title={t('common:refresh') || 'Refresh'}
              >
                <RefreshCw size={18} />
              </button>
            </div>
          </div>
        )}

        {/* Tab Content */}
        {loading ? (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
            <div className="text-slate-600 dark:text-slate-400">
              {t('common:loading') || 'Loading...'}
            </div>
          </div>
        ) : activeTab === 'campaigns' ? (
          <div>
            {campaigns.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
                <Scissors size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {t('noCampaigns') || 'No Qurbani Campaigns'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  {t('noCampaignsDescription') || 'Create your first campaign to start accepting Qurbani registrations.'}
                </p>
                <button
                  onClick={() => setIsCreateCampaignModalOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  <Plus size={18} />
                  {t('createCampaign') || 'Create Campaign'}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    onEdit={() => handleEditCampaign(campaign)}
                    onDelete={() => handleDeleteCampaign(campaign)}
                    onViewShares={() => handleViewShares(campaign)}
                  />
                ))}
              </div>
            )}
          </div>
        ) : activeTab === 'shares' ? (
          <div>
            {!selectedCampaignId ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
                <Calendar size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {t('selectCampaign') || 'Select a Campaign'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  {t('selectCampaignDescription') || 'Choose a campaign from the Campaigns tab to view and manage shares.'}
                </p>
                <button
                  onClick={() => setActiveTab('campaigns')}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                >
                  <Calendar size={18} />
                  {t('viewCampaigns') || 'View Campaigns'}
                </button>
              </div>
            ) : filteredShares.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
                <Package size={48} className="mx-auto mb-4 text-slate-300 dark:text-slate-600" />
                <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
                  {t('noShares') || 'No Share Registrations'}
                </h3>
                <p className="text-slate-500 dark:text-slate-400 mb-4">
                  {searchQuery
                    ? t('noSharesFound') || 'No shares match your search criteria.'
                    : t('noSharesDescription') || 'Register the first Qurbani share for this campaign.'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setIsRegisterShareModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                  >
                    <Plus size={18} />
                    {t('registerShare') || 'Register Share'}
                  </button>
                )}
              </div>
            ) : (
              <SharesTable
                shares={filteredShares}
                onView={handleViewShare}
                onRecordPayment={handleRecordPayment}
                onUpdateStatus={handleUpdateProcessingStatus}
                onDelete={handleDeleteShare}
              />
            )}
          </div>
        ) : null}
      </div>

      {/* Modals */}
      <CreateCampaignModal
        isOpen={isCreateCampaignModalOpen}
        onClose={() => setIsCreateCampaignModalOpen(false)}
        onSave={refetchData}
      />
      <EditCampaignModal
        isOpen={isEditCampaignModalOpen}
        onClose={() => {
          setIsEditCampaignModalOpen(false)
          setSelectedCampaign(null)
        }}
        onSave={refetchData}
        campaign={selectedCampaign}
      />
      <RegisterShareModal
        isOpen={isRegisterShareModalOpen}
        onClose={() => setIsRegisterShareModalOpen(false)}
        onSave={refetchData}
        campaignId={selectedCampaignId || ''}
        campaign={selectedCampaignData || null}
      />
      <ShareDetailModal
        isOpen={isShareDetailModalOpen}
        onClose={() => {
          setIsShareDetailModalOpen(false)
          setSelectedShare(null)
        }}
        share={selectedShare}
        onRecordPayment={() => {
          setIsShareDetailModalOpen(false)
          setIsRecordPaymentModalOpen(true)
        }}
      />
      <RecordPaymentModal
        isOpen={isRecordPaymentModalOpen}
        onClose={() => {
          setIsRecordPaymentModalOpen(false)
          setSelectedShare(null)
        }}
        onSave={refetchData}
        share={selectedShare}
      />
    </div>
  )
}
