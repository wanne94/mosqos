/**
 * Tax Receipts Page
 * Year-end donation statements management
 */

'use client'

import { useState, useMemo } from 'react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import {
  FileText,
  Download,
  Mail,
  Search,
  Filter,
  CheckSquare,
  Square,
  Calendar,
  Users,
  DollarSign,
  TrendingUp,
  FileArchive,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'
import { useYearEndStatements } from '../hooks/useTaxReceipts'
import { YearEndStatementModal } from '../components/YearEndStatementModal'
import { BatchExportProgress } from '../components/BatchExportProgress'
import type { DonorYearSummary } from '../services/tax-receipts.service'

export default function TaxReceiptsPage() {
  const { currentOrganization } = useOrganization()
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear() - 1)
  const [searchQuery, setSearchQuery] = useState('')
  const [minAmount, setMinAmount] = useState(0)
  const [selectedDonorIds, setSelectedDonorIds] = useState<Set<string>>(new Set())
  const [showStatementModal, setShowStatementModal] = useState(false)
  const [showBatchExport, setShowBatchExport] = useState(false)
  const [selectedDonor, setSelectedDonor] = useState<DonorYearSummary | null>(null)

  const {
    donors,
    isLoadingDonors,
    stats,
    isLoadingStats,
    availableYears,
    markReceiptsSent,
    isMarkingSent,
  } = useYearEndStatements({
    organizationId: currentOrganization?.id,
    year: selectedYear,
    minAmount,
  })

  // Filter donors by search
  const filteredDonors = useMemo(() => {
    if (!searchQuery) return donors
    const query = searchQuery.toLowerCase()
    return donors.filter(
      (d) =>
        d.donorName.toLowerCase().includes(query) ||
        d.donorEmail?.toLowerCase().includes(query)
    )
  }, [donors, searchQuery])

  // Selected donors for batch export
  const selectedDonors = useMemo(() => {
    return filteredDonors.filter((d) => selectedDonorIds.has(d.donorId))
  }, [filteredDonors, selectedDonorIds])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const handleSelectAll = () => {
    if (selectedDonorIds.size === filteredDonors.length) {
      setSelectedDonorIds(new Set())
    } else {
      setSelectedDonorIds(new Set(filteredDonors.map((d) => d.donorId)))
    }
  }

  const handleSelectDonor = (donorId: string) => {
    const newSet = new Set(selectedDonorIds)
    if (newSet.has(donorId)) {
      newSet.delete(donorId)
    } else {
      newSet.add(donorId)
    }
    setSelectedDonorIds(newSet)
  }

  const handleViewStatement = (donor: DonorYearSummary) => {
    setSelectedDonor(donor)
    setShowStatementModal(true)
  }

  const handleBatchExport = () => {
    if (selectedDonors.length === 0) {
      toast.error('Please select at least one donor')
      return
    }
    setShowBatchExport(true)
  }

  const handleMarkSent = async (donationIds: string[]) => {
    try {
      await markReceiptsSent(donationIds)
    } catch (error) {
      console.error('Error marking receipts sent:', error)
    }
  }

  const organizationInfo = {
    name: currentOrganization?.name || '',
    address: [
      currentOrganization?.address_line1,
      currentOrganization?.address_line2,
      currentOrganization?.city,
      currentOrganization?.state,
      currentOrganization?.postal_code,
    ]
      .filter(Boolean)
      .join(', ') || undefined,
    phone: currentOrganization?.contact_phone || undefined,
    email: currentOrganization?.contact_email || undefined,
    website: currentOrganization?.website || undefined,
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
              Tax Receipts
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
              Generate year-end donation statements for tax purposes
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Year Selector */}
            <div className="flex items-center gap-2">
              <Calendar size={20} className="text-slate-400" />
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-3 py-2 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <Users size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Donors</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {stats.totalDonors}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <DollarSign size={20} className="text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Total Amount</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(stats.totalAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <TrendingUp size={20} className="text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Tax Deductible</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(stats.taxDeductibleAmount)}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white dark:bg-slate-800 rounded-lg p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                  <FileText size={20} className="text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-sm text-slate-500 dark:text-slate-400">Avg Donation</p>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">
                    {formatCurrency(stats.averageDonation)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Filters and Actions */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                type="text"
                placeholder="Search donors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Min Amount Filter */}
            <div className="flex items-center gap-2">
              <Filter size={18} className="text-slate-400" />
              <input
                type="number"
                placeholder="Min amount"
                value={minAmount || ''}
                onChange={(e) => setMinAmount(Number(e.target.value) || 0)}
                className="w-32 px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Batch Actions */}
            {selectedDonorIds.size > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  {selectedDonorIds.size} selected
                </span>
                <button
                  onClick={handleBatchExport}
                  disabled={isMarkingSent}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                >
                  {isMarkingSent ? (
                    <Loader2 size={18} className="animate-spin" />
                  ) : (
                    <FileArchive size={18} />
                  )}
                  Export Selected
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Donors Table */}
        <div className="overflow-x-auto">
          {isLoadingDonors ? (
            <div className="p-12 text-center">
              <Loader2 size={32} className="mx-auto text-slate-400 animate-spin mb-4" />
              <p className="text-slate-500 dark:text-slate-400">Loading donors...</p>
            </div>
          ) : filteredDonors.length === 0 ? (
            <div className="p-12 text-center">
              <Users size={48} className="mx-auto text-slate-400 mb-4" />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                No donors found
              </h3>
              <p className="text-slate-500 dark:text-slate-400">
                No donors with donations in {selectedYear}
              </p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <button
                      onClick={handleSelectAll}
                      className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider hover:text-slate-900 dark:hover:text-white"
                    >
                      {selectedDonorIds.size === filteredDonors.length && filteredDonors.length > 0 ? (
                        <CheckSquare size={16} className="text-emerald-500" />
                      ) : (
                        <Square size={16} />
                      )}
                      Select
                    </button>
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Donations
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Total Amount
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Tax Deductible
                  </th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                {filteredDonors.map((donor) => (
                  <tr
                    key={donor.donorId}
                    className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <td className="px-4 py-4">
                      <button
                        onClick={() => handleSelectDonor(donor.donorId)}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-600 rounded transition-colors"
                      >
                        {selectedDonorIds.has(donor.donorId) ? (
                          <CheckSquare size={18} className="text-emerald-500" />
                        ) : (
                          <Square size={18} className="text-slate-400" />
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-4">
                      <p className="font-medium text-slate-900 dark:text-white">
                        {donor.donorName}
                      </p>
                      {donor.donorAddress && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[200px]">
                          {donor.donorAddress}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">
                      {donor.donorEmail || '-'}
                    </td>
                    <td className="px-4 py-4 text-center">
                      <span className="inline-flex items-center justify-center px-2 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-full">
                        {donor.donationCount}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(donor.totalAmount)}
                    </td>
                    <td className="px-4 py-4 text-right text-sm text-slate-600 dark:text-slate-400">
                      {formatCurrency(donor.taxDeductibleAmount)}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleViewStatement(donor)}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          title="View Statement"
                        >
                          <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedDonorIds(new Set([donor.donorId]))
                            setShowBatchExport(true)
                          }}
                          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                          title="Download PDF"
                        >
                          <Download size={18} className="text-emerald-600 dark:text-emerald-400" />
                        </button>
                        {donor.donorEmail && (
                          <button
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-600 rounded-lg transition-colors"
                            title="Send Email"
                          >
                            <Mail size={18} className="text-slate-400" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Summary Footer */}
        {filteredDonors.length > 0 && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 dark:text-slate-400">
                Showing {filteredDonors.length} of {donors.length} donors
              </span>
              <span className="font-semibold text-slate-900 dark:text-white">
                Total: {formatCurrency(filteredDonors.reduce((sum, d) => sum + d.totalAmount, 0))}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Year End Statement Modal */}
      <YearEndStatementModal
        isOpen={showStatementModal}
        onClose={() => {
          setShowStatementModal(false)
          setSelectedDonor(null)
        }}
        donor={selectedDonor}
        year={selectedYear}
        organization={organizationInfo}
        onReceiptSent={handleMarkSent}
      />

      {/* Batch Export Modal */}
      <BatchExportProgress
        isOpen={showBatchExport}
        onClose={() => {
          setShowBatchExport(false)
          setSelectedDonorIds(new Set())
        }}
        donors={selectedDonors}
        year={selectedYear}
        organization={organizationInfo}
        onComplete={handleMarkSent}
      />
    </div>
  )
}
