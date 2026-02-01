import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { supabase } from '@/lib/supabase/client'
import { X, User, Plane, CreditCard } from 'lucide-react'
import { useEscapeKey } from '@/hooks/useEscapeKey'
import { useOrganization } from '@/hooks/useOrganization'
import type { TripRegistration, Trip } from '../types/umrah.types'

interface PilgrimDetailModalProps {
  isOpen: boolean
  onClose: () => void
  pilgrim: TripRegistration
  trip: Trip
}

interface HouseholdDetails {
  id: string
  name: string
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  phone: string | null
}

interface MemberDetails {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  date_of_birth: string | null
  households: HouseholdDetails | null
}

export default function PilgrimDetailModal({ isOpen, onClose, pilgrim, trip }: PilgrimDetailModalProps) {
  const { t, i18n } = useTranslation()
  const { currentOrganizationId } = useOrganization()
  const currentLanguage = i18n.language || 'en'
  const [memberDetails, setMemberDetails] = useState<MemberDetails | null>(null)
  const [loading, setLoading] = useState(true)
  const [amountPaid, setAmountPaid] = useState(0)

  useEscapeKey(onClose, false, '', isOpen)

  useEffect(() => {
    if (isOpen && pilgrim && pilgrim.member_id) {
      fetchMemberDetails()
      fetchPaymentTotal()
    }
  }, [isOpen, pilgrim])

  const fetchMemberDetails = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('members')
        .select(`
          *,
          households:household_id (
            id,
            name,
            address,
            city,
            state,
            zip_code,
            phone
          )
        `)
        .eq('id', pilgrim.member_id)
        .eq('organization_id', currentOrganizationId)
        .single()

      if (error) throw error
      if (data) {
        setMemberDetails({
          id: data.id,
          first_name: data.first_name,
          last_name: data.last_name,
          email: data.email,
          phone: data.phone,
          date_of_birth: data.date_of_birth,
          households: data.households as HouseholdDetails | null,
        })
      }
    } catch (error) {
      console.error('Error fetching member details:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPaymentTotal = async () => {
    try {
      if (!pilgrim?.member_id || !trip) {
        setAmountPaid(0)
        return
      }

      const memberId = pilgrim.member_id
      const tripName = trip.name

      const { data: umrahFund, error: fundsError } = await supabase
        .from('funds')
        .select('id')
        .eq('organization_id', currentOrganizationId as string)
        .ilike('name', '%Hajj%')
        .limit(1)
        .maybeSingle()

      let fundId = umrahFund?.id
      if (!fundId && !fundsError) {
        const { data: fallbackFund } = await supabase
          .from('funds')
          .select('id')
          .eq('organization_id', currentOrganizationId as string)
          .ilike('name', '%Umrah%')
          .limit(1)
          .maybeSingle()
        fundId = fallbackFund?.id
      }

      const donationsQuery = supabase
        .from('donations')
        .select('amount, fund_id, notes, member_id, donation_date')
        .eq('organization_id', currentOrganizationId as string)
        .eq('member_id', memberId)

      const { data: donations, error: donationsError } = fundId
        ? await donationsQuery.eq('fund_id', fundId)
        : await donationsQuery

      if (donationsError) {
        console.warn('Error fetching by member_id:', donationsError)
        setAmountPaid(0)
        return
      }

      const filteredDonations = (donations || []).filter((donation) => {
        if (donation.member_id !== memberId) {
          return false
        }

        if (donation.notes && tripName) {
          return donation.notes.toLowerCase().includes(tripName.toLowerCase())
        }

        if (fundId && donation.fund_id === fundId) {
          return true
        }

        return false
      })

      const total = filteredDonations.reduce(
        (sum, donation) => sum + (parseFloat(donation.amount.toString()) || 0),
        0
      )
      setAmountPaid(total)
    } catch (error) {
      console.error('Error calculating payment total:', error)
      setAmountPaid(0)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(
      currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
      {
        style: 'currency',
        currency: 'USD',
      }
    ).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return t('common.notAvailable')
    return new Date(dateString).toLocaleDateString(
      currentLanguage === 'tr' ? 'tr-TR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US',
      {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }
    )
  }

  const getVisaStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      not_started: 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300',
      documents_submitted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      processing: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      approved: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      rejected: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      issued: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    }
    return colors[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
  }

  const getPaymentStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      deposit_paid: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      partial: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      paid: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
      refunded: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    }
    return colors[status] || 'bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300'
  }

  if (!isOpen || !pilgrim) return null

  const tripCost = parseFloat(trip?.price?.toString() || '0') || 0
  const remaining = Math.max(0, tripCost - amountPaid)
  const progressPercent = tripCost > 0 ? Math.min(100, (amountPaid / tripCost) * 100) : 0

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800 z-10">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">{t('umrah.pilgrimDetails')}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8 text-slate-600 dark:text-slate-400">{t('common.loading')}...</div>
          ) : (
            <>
              {/* Pilgrim Info */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <User size={20} />
                  {t('umrah.pilgrimInformation')}
                </h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.firstName')}</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {memberDetails?.first_name || t('common.notAvailable')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.lastName')}</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {memberDetails?.last_name || t('common.notAvailable')}
                      </p>
                    </div>
                    {memberDetails?.email && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.email')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">{memberDetails.email}</p>
                      </div>
                    )}
                    {memberDetails?.phone && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.phone')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">{memberDetails.phone}</p>
                      </div>
                    )}
                    {memberDetails?.date_of_birth && (
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('common.dateOfBirth')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">
                          {formatDate(memberDetails.date_of_birth)}
                        </p>
                      </div>
                    )}
                  </div>
                  {memberDetails?.households && (
                    <div className="pt-3 border-t border-slate-200 dark:border-slate-600">
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('common.familyName')}</p>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {memberDetails.households.name || t('common.notAvailable')}
                      </p>
                      {memberDetails.households.address && (
                        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                          {memberDetails.households.address}
                          {memberDetails.households.city && `, ${memberDetails.households.city}`}
                          {memberDetails.households.state && `, ${memberDetails.households.state}`}
                          {memberDetails.households.zip_code && ` ${memberDetails.households.zip_code}`}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Trip Info */}
              {trip && (
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                    <Plane size={20} />
                    {t('umrah.tripInformation')}
                  </h3>
                  <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-3">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">{t('umrah.tripName')}</p>
                      <p className="font-medium text-slate-900 dark:text-white">{trip.name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('umrah.startDate')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">{formatDate(trip.start_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('umrah.endDate')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">{formatDate(trip.end_date)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-600 dark:text-slate-400">{t('umrah.costPerPerson')}</p>
                        <p className="font-medium text-slate-900 dark:text-white">{formatCurrency(tripCost)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Status & Payment */}
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <CreditCard size={20} />
                  {t('umrah.statusAndPayment')}
                </h3>
                <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('umrah.visaStatus')}</p>
                      <span
                        className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getVisaStatusColor(
                          pilgrim.visa_status
                        )}`}
                      >
                        {pilgrim.visa_status || 'not_started'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('umrah.paymentStatus')}</p>
                      <span
                        className={`inline-block px-3 py-1 text-sm font-medium rounded-full ${getPaymentStatusColor(
                          pilgrim.payment_status
                        )}`}
                      >
                        {pilgrim.payment_status || 'pending'}
                      </span>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-slate-600 dark:text-slate-400 mb-2">{t('umrah.paymentProgress')}</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 bg-slate-200 dark:bg-slate-600 rounded-full h-3">
                        <div
                          className={`h-3 rounded-full transition-all ${
                            progressPercent >= 100
                              ? 'bg-emerald-600 dark:bg-emerald-500'
                              : progressPercent > 0
                              ? 'bg-yellow-500 dark:bg-yellow-400'
                              : 'bg-slate-300 dark:bg-slate-500'
                          }`}
                          style={{ width: `${progressPercent}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-slate-900 dark:text-white w-16 text-right">
                        {progressPercent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">{t('umrah.amountPaid')}</p>
                        <p className="font-semibold text-emerald-600 dark:text-emerald-400">{formatCurrency(amountPaid)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">{t('umrah.remaining')}</p>
                        <p className="font-semibold text-red-600 dark:text-red-400">{formatCurrency(remaining)}</p>
                      </div>
                      <div>
                        <p className="text-slate-600 dark:text-slate-400">{t('umrah.totalCost')}</p>
                        <p className="font-semibold text-slate-900 dark:text-white">{formatCurrency(tripCost)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
