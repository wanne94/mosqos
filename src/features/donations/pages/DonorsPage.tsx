'use client'

import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { Users, Edit, Download, CreditCard, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { EditDonationModal } from '../components/EditDonationModal'
import { DonateModal } from '../components/DonateModal'
import { NewDonationModal } from '../components/NewDonationModal'
import { useDonations } from '../hooks'
import { useHouseholds } from '@/features/households/hooks'
import type { Donation } from '../types/donations.types'
import { generateDonationReceipt } from '../utils/generateDonationReceipt'

interface DonorWithTotals {
  id: string
  name: string
  city: string | null
  email: string | null
  phone: string | null
  totalDonations: number
  donationCount: number
}

export default function DonorsPage() {
  const navigate = useNavigate()
  const { currentOrganization } = useOrganization()
  const [activeTab, setActiveTab] = useState<'recent' | 'donors'>('recent')
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedDonationId, setSelectedDonationId] = useState<string | null>(null)
  const [isDonateModalOpen, setIsDonateModalOpen] = useState(false)
  const [isNewDonationModalOpen, setIsNewDonationModalOpen] = useState(false)

  // Use donations hook for recent donations
  const {
    donations: recentDonations = [],
    isLoading: loadingRecentDonations,
    refetch: refetchRecentDonations,
  } = useDonations({
    organizationId: currentOrganization?.id,
  })

  // Use households hook for donors tab
  const { households = [], isLoading: loadingHouseholds } = useHouseholds({
    organizationId: currentOrganization?.id,
  })

  // Calculate donors with totals
  const donors: DonorWithTotals[] = households.map((household) => {
    // Note: Donations don't have direct household_id in the current schema
    // This is a simplified version - in production you'd join through members
    const totalDonations = 0
    const donationCount = 0

    return {
      id: household.id,
      name: household.name,
      city: household.city,
      email: null,
      phone: null,
      totalDonations,
      donationCount,
    }
  }).sort((a, b) => b.totalDonations - a.totalDonations)

  const loadingDonors = loadingHouseholds || (activeTab === 'donors' && loadingRecentDonations)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const handleRowClick = (householdId: string) => {
    navigate(`/${currentOrganization?.slug}/admin/donors/${householdId}`)
  }

  const handleDownloadReceipt = async (donation: Donation) => {
    if (!currentOrganization) {
      toast.error('Organization not found')
      return
    }

    try {
      // Format address from organization fields
      const addressParts = [
        currentOrganization.address_line1,
        currentOrganization.address_line2,
        currentOrganization.city,
        currentOrganization.state,
        currentOrganization.postal_code,
      ].filter(Boolean)
      const formattedAddress = addressParts.length > 0 ? addressParts.join(', ') : undefined

      generateDonationReceipt({
        donation,
        organization: {
          name: currentOrganization.name,
          address: formattedAddress,
          phone: currentOrganization.contact_phone || undefined,
          email: currentOrganization.contact_email || undefined,
          website: currentOrganization.website || undefined,
        },
        language: 'en',
        action: 'download',
      })
      toast.success('Receipt downloaded successfully')
    } catch (error) {
      console.error('Error generating receipt:', error)
      toast.error('Failed to generate receipt')
    }
  }

  const handleExportDonors = () => {
    if (donors.length === 0) return

    const headers = ['Family Name', 'Email', 'Phone', 'Total Donations']
    const rows = donors.map(donor => [
      donor.name || '',
      donor.email || '',
      donor.phone || '',
      formatCurrency(donor.totalDonations || 0),
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `donors_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportDonations = () => {
    if (recentDonations.length === 0) return

    const headers = ['Date', 'Donor', 'Fund', 'Amount', 'Method']
    const rows = recentDonations.map(donation => [
      formatDate(donation.donation_date),
      donation.member
        ? `${donation.member.first_name || ''} ${donation.member.last_name || ''}`.trim()
        : 'Anonymous',
      donation.fund?.name || '',
      formatCurrency(donation.amount || 0),
      donation.payment_method || 'N/A',
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `recent_donations_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Donations</h1>
            <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">Manage donor information and track contributions</p>
          </div>
          {activeTab === 'donors' && (
            <div className="flex gap-2">
              <button
                onClick={() => setIsNewDonationModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
              >
                <Plus size={20} />
                <span>New Donation</span>
              </button>
              <button
                onClick={() => setIsDonateModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 sm:px-6 py-2 sm:py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium shadow-sm text-sm sm:text-base"
              >
                <CreditCard size={20} />
                <span>Make Donation</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="mb-6 border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('recent')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'recent'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            Recent Donations
          </button>
          <button
            onClick={() => setActiveTab('donors')}
            className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'donors'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300 hover:border-slate-300 dark:hover:border-slate-600'
            }`}
          >
            Family Donations
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'donors' ? (
        <>
          {loadingDonors ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
              <div className="text-slate-600 dark:text-slate-400">Loading donors...</div>
            </div>
          ) : donors.length === 0 ? (
            <div className="bg-white dark:bg-slate-800 rounded-lg p-12 text-center shadow-sm">
              <Users className="mx-auto text-slate-400 mb-4" size={48} />
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">No donors found</h3>
              <p className="text-slate-600 dark:text-slate-400">No donor households have been recorded yet.</p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-sm">
              <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-end">
                <button
                  onClick={handleExportDonors}
                  className="p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                  title="Export to CSV"
                >
                  <Download size={18} className="text-slate-700 dark:text-slate-300" />
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
                    <tr>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Family Name
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        City
                      </th>
                      <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Total Lifetime Donations
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                    {donors.map((donor) => (
                      <tr
                        key={donor.id}
                        onClick={() => handleRowClick(donor.id)}
                        className="hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer transition-colors"
                      >
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-white">
                          {donor.name || 'Unnamed Household'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                          {donor.city || '—'}
                        </td>
                        <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          {formatCurrency(donor.totalDonations)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">Recent Donations</h2>
            {recentDonations.length > 0 && (
              <button
                onClick={handleExportDonations}
                className="p-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
                title="Export to CSV"
              >
                <Download size={18} className="text-slate-700 dark:text-slate-300" />
              </button>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Donor
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-3 sm:px-6 py-3 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {recentDonations.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                      No recent donations
                    </td>
                  </tr>
                ) : (
                  recentDonations.map((donation) => (
                    <tr
                      key={donation.id}
                      className="hover:bg-slate-50 dark:hover:bg-slate-700 cursor-pointer"
                      onClick={() => {
                        setSelectedDonationId(donation.id)
                        setIsEditModalOpen(true)
                      }}
                    >
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {formatDate(donation.donation_date)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-white">
                        {donation.member ? (
                          <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                            {`${donation.member.first_name || ''} ${donation.member.last_name || ''}`.trim() || 'Anonymous'}
                          </span>
                        ) : (
                          <span>Anonymous</span>
                        )}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(parseFloat(String(donation.amount)) || 0)}
                      </td>
                      <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900 text-emerald-800 dark:text-emerald-200">
                          {donation.fund?.name || 'General Donation'}
                        </span>
                      </td>
                      <td
                        className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleDownloadReceipt(donation)}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                            title="Download Receipt"
                          >
                            <Download size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedDonationId(donation.id)
                              setIsEditModalOpen(true)
                            }}
                            className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 flex items-center gap-1"
                            title="Edit Donation"
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <EditDonationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false)
          setSelectedDonationId(null)
        }}
        onSave={() => {
          refetchRecentDonations()
        }}
        donationId={selectedDonationId}
      />

      <DonateModal
        isOpen={isDonateModalOpen}
        onClose={() => setIsDonateModalOpen(false)}
        onSuccess={() => {
          refetchRecentDonations()
          setIsDonateModalOpen(false)
        }}
      />

      <NewDonationModal
        isOpen={isNewDonationModalOpen}
        onClose={() => setIsNewDonationModalOpen(false)}
        onSave={() => {
          refetchRecentDonations()
          setIsNewDonationModalOpen(false)
        }}
      />
    </div>
  )
}
