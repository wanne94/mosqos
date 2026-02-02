import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Heart,
  Plus,
  Search,
  Filter,
  FileText,
  Calendar,
  CheckCircle,
  Clock,
  DollarSign,
  Settings,
} from 'lucide-react'
import { toast } from 'sonner'
import { useOrganization } from '../../../hooks/useOrganization'
import { useIslamicServices, useServiceTypes } from '../hooks/useIslamicServices'
import { ServiceCard, ServiceModal, DeleteServiceModal } from '../components'
import type { IslamicService, IslamicServiceFilters, ServiceStatus } from '../types/islamic-services.types'

type TabType = 'all' | 'nikah' | 'janazah' | 'shahada'

export default function IslamicServicesPage() {
  const { t } = useTranslation(['islamic-services', 'common'])
  const { currentOrganizationId } = useOrganization()

  // Tab and filter state
  const [activeTab, setActiveTab] = useState<TabType>('all')
  const [filters, setFilters] = useState<IslamicServiceFilters>({
    status: 'all',
    search: '',
  })

  // Modal state
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [editingService, setEditingService] = useState<IslamicService | null>(null)
  const [deletingService, setDeletingService] = useState<IslamicService | null>(null)
  const [preselectedType, setPreselectedType] = useState<string>('')

  const { serviceTypes, seedDefaultTypes, isSeeding } = useServiceTypes(currentOrganizationId || undefined)

  // Build filters with tab
  const activeFilters: IslamicServiceFilters = {
    ...filters,
    service_type_id: activeTab !== 'all' ? serviceTypes.find((t) => t.slug === activeTab)?.id : undefined,
  }

  const {
    services,
    isLoading,
    stats,
    isLoadingStats,
    updateStatus,
    isUpdatingStatus,
    deleteService,
    isDeleting,
    refetch,
  } = useIslamicServices({
    organizationId: currentOrganizationId || undefined,
    filters: activeFilters,
  })

  const handleStatusChange = async (id: string, status: ServiceStatus) => {
    try {
      await updateStatus({ id, status })
      toast.success(t('statusUpdated') || 'Status updated')
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  const handleDelete = async () => {
    if (!deletingService) return
    try {
      await deleteService(deletingService.id)
      toast.success(t('deleted') || 'Service deleted')
      setDeletingService(null)
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  const handleSeedDefaults = async () => {
    try {
      await seedDefaultTypes()
      toast.success(t('defaultTypesCreated') || 'Default service types created')
    } catch (error: any) {
      toast.error(t('common.error') || 'Error', { description: error.message })
    }
  }

  const openCreateModal = (typeSlug?: string) => {
    if (typeSlug) {
      const type = serviceTypes.find((t) => t.slug === typeSlug)
      setPreselectedType(type?.id || '')
    } else {
      setPreselectedType('')
    }
    setShowCreateModal(true)
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'all', label: t('tabs.all') || 'All Services', icon: '📋' },
    { id: 'nikah', label: t('tabs.nikah') || 'Nikah', icon: '💒' },
    { id: 'janazah', label: t('tabs.janazah') || 'Janazah', icon: '🕌' },
    { id: 'shahada', label: t('tabs.shahada') || 'Shahada', icon: '☪️' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
            <Heart className="text-purple-600 dark:text-purple-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {t('title') || 'Islamic Services'}
            </h1>
            <p className="text-slate-500 dark:text-slate-400">
              {t('subtitle') || 'Manage Nikah, Janazah, Shahada, and other services'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {serviceTypes.length === 0 && (
            <button
              onClick={handleSeedDefaults}
              disabled={isSeeding}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700"
            >
              <Settings size={18} />
              {isSeeding ? (t('common.loading') || 'Loading...') : (t('setupTypes') || 'Setup Service Types')}
            </button>
          )}
          <button
            onClick={() => openCreateModal()}
            disabled={serviceTypes.length === 0}
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50"
          >
            <Plus size={20} />
            {t('newService') || 'New Service'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {!isLoadingStats && stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <FileText size={16} />
              <span className="text-xs">{t('total') || 'Total'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-blue-500 mb-1">
              <Clock size={16} />
              <span className="text-xs">{t('status.requested') || 'Requested'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.requested}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-indigo-500 mb-1">
              <Calendar size={16} />
              <span className="text-xs">{t('status.scheduled') || 'Scheduled'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.scheduled}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <CheckCircle size={16} />
              <span className="text-xs">{t('status.completed') || 'Completed'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 mb-1">
              <DollarSign size={16} />
              <span className="text-xs">{t('totalFees') || 'Total Fees'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.total_fees.toLocaleString()}</p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-emerald-500 mb-1">
              <DollarSign size={16} />
              <span className="text-xs">{t('collected') || 'Collected'}</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">${stats.fees_collected.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="flex gap-4 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-purple-600 text-purple-600 dark:text-purple-400'
                  : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

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
              placeholder={t('searchPlaceholder') || 'Search by case number or name...'}
              className="w-full ps-10 pe-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-slate-400" />
            <select
              value={filters.status || 'all'}
              onChange={(e) => setFilters({ ...filters, status: e.target.value as ServiceStatus | 'all' })}
              className="px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-slate-700 text-slate-900 dark:text-white"
            >
              <option value="all">{t('common.allStatuses') || 'All Statuses'}</option>
              <option value="requested">{t('status.requested') || 'Requested'}</option>
              <option value="pending_documents">{t('status.pending_documents') || 'Pending Documents'}</option>
              <option value="documents_received">{t('status.documents_received') || 'Documents Received'}</option>
              <option value="scheduled">{t('status.scheduled') || 'Scheduled'}</option>
              <option value="in_progress">{t('status.in_progress') || 'In Progress'}</option>
              <option value="completed">{t('status.completed') || 'Completed'}</option>
              <option value="cancelled">{t('status.cancelled') || 'Cancelled'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quick Actions for Tabs */}
      {activeTab !== 'all' && (
        <div className="flex justify-end">
          <button
            onClick={() => openCreateModal(activeTab)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1"
          >
            <Plus size={16} />
            {t('newSpecific', { type: tabs.find((t) => t.id === activeTab)?.label }) ||
              `New ${tabs.find((t) => t.id === activeTab)?.label}`}
          </button>
        </div>
      )}

      {/* Services Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600" />
        </div>
      ) : services.length === 0 ? (
        <div className="bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 p-12 text-center">
          <Heart size={48} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
          <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
            {t('noServices') || 'No services'}
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mb-4">
            {serviceTypes.length === 0
              ? (t('setupTypesFirst') || 'Set up service types first to start recording services.')
              : (t('noServicesDesc') || 'Create your first service request to get started.')}
          </p>
          {serviceTypes.length > 0 && (
            <button
              onClick={() => openCreateModal()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              <Plus size={18} />
              {t('createFirst') || 'Create First Service'}
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {services.map((service) => (
            <ServiceCard
              key={service.id}
              service={service}
              onEdit={setEditingService}
              onDelete={setDeletingService}
              onStatusChange={handleStatusChange}
              isUpdatingStatus={isUpdatingStatus}
            />
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      <ServiceModal
        isOpen={showCreateModal || !!editingService}
        onClose={() => {
          setShowCreateModal(false)
          setEditingService(null)
          setPreselectedType('')
        }}
        onSave={() => {
          refetch()
          setShowCreateModal(false)
          setEditingService(null)
        }}
        service={editingService}
        preselectedType={preselectedType}
      />

      {/* Delete Confirmation Modal */}
      <DeleteServiceModal
        isOpen={!!deletingService}
        onClose={() => setDeletingService(null)}
        onConfirm={handleDelete}
        service={deletingService}
        isDeleting={isDeleting}
      />
    </div>
  )
}
