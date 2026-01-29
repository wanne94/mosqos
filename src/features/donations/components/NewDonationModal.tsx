import { useState, useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useFormDirty } from '@/shared/hooks/useFormDirty'
import { useEscapeKey } from '@/shared/hooks/useEscapeKey'
import { useFunds } from '../hooks/useFunds'
import type { PaymentMethod } from '../types/donations.types'
import { DonationInvoice } from './DonationInvoice'

interface Member {
  id: string
  first_name: string
  last_name: string
  household_id: string | null
}

interface DonationFormData {
  member_id: string
  household_id: string
  fund_id: string
  amount: string
  payment_method: PaymentMethod
  donation_date: string
}

interface SavedDonation {
  id: string
  amount: number
  payment_method: PaymentMethod
  donation_date: string
  created_at: string
}

interface Household {
  id: string
  name: string
}

interface Fund {
  id: string
  name: string
}

interface NewDonationModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: () => void
  prefillMemberId?: string
}

const initialFormData: DonationFormData = {
  member_id: '',
  household_id: '',
  fund_id: '',
  amount: '',
  payment_method: 'cash' as PaymentMethod,
  donation_date: new Date().toISOString().split('T')[0],
}

export function NewDonationModal({
  isOpen,
  onClose,
  onSave,
  prefillMemberId,
}: NewDonationModalProps) {
  const { currentOrganization } = useOrganization()
  const { funds } = useFunds({ organizationId: currentOrganization?.id })
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(false)
  const [savedDonation, setSavedDonation] = useState<SavedDonation | null>(null)
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null)
  const [selectedFund, setSelectedFund] = useState<Fund | null>(null)
  const [showInvoice, setShowInvoice] = useState(false)
  const [formData, setFormData] = useState<DonationFormData>(initialFormData)
  const [error, setError] = useState<string | null>(null)
  const isDirty = useFormDirty(formData, initialFormData)

  useEscapeKey(onClose, {
    requireConfirmation: isDirty,
    confirmMessage: 'You have unsaved changes. Are you sure you want to close?',
    enabled: isOpen,
  })

  const handleClose = useCallback(() => {
    if (isDirty) {
      if (window.confirm('You have unsaved changes. Are you sure you want to close?')) {
        onClose()
      }
    } else {
      onClose()
    }
  }, [isDirty, onClose])

  useEffect(() => {
    if (isOpen && currentOrganization) {
      fetchMembers()

      if (prefillMemberId) {
        fetchMemberHousehold(prefillMemberId)
      } else {
        setFormData(initialFormData)
      }
    }
  }, [isOpen, prefillMemberId, currentOrganization])

  const fetchMemberHousehold = async (memberId: string) => {
    if (!currentOrganization) return

    try {
      const { data: member, error } = await supabase
        .from('organization_members')
        .select('household_id, first_name, last_name')
        .eq('id', memberId)
        .eq('organization_id', currentOrganization.id)
        .single()

      if (error) throw error

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (member && 'household_id' in member && (member as any).household_id) {
        setFormData((prev) => ({
          ...prev,
          household_id: (member as any).household_id,
        }))
      } else {
        setError('Member does not have a household assigned. Please update profile.')
      }
    } catch (err) {
      console.error('Error fetching member household:', err)
      setError('Could not load member information.')
    }
  }

  const fetchMembers = async () => {
    if (!currentOrganization) return

    try {
      const { data, error } = await supabase
        .from('organization_members')
        .select('id, first_name, last_name, household_id')
        .eq('organization_id', currentOrganization.id)
        .order('first_name', { ascending: true })

      if (error) throw error
      setMembers(data || [])
    } catch (err) {
      console.error('Error fetching members:', err)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!currentOrganization) return

    setLoading(true)
    setError(null)

    try {
      if (!formData.amount || parseFloat(formData.amount) <= 0) {
        throw new Error('Please enter a valid amount greater than 0.')
      }

      if (!formData.fund_id) {
        throw new Error('Please select a fund.')
      }

      let memberId = prefillMemberId || formData.member_id || null
      let householdId = formData.household_id || null

      if (memberId && !householdId) {
        const { data: member, error: memberError } = await supabase
          .from('organization_members')
          .select('household_id')
          .eq('id', memberId)
          .eq('organization_id', currentOrganization.id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (memberError || !member || !(member as any).household_id) {
          throw new Error('Member is missing household information.')
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        householdId = (member as any).household_id
      }

      if (householdId && !memberId) {
        const { data: headMember } = await supabase
          .from('organization_members')
          .select('id')
          .eq('household_id', householdId)
          .eq('organization_id', currentOrganization.id)
          .eq('role', 'Head')
          .maybeSingle()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (headMember && (headMember as any).id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          memberId = (headMember as any).id
        } else {
          const { data: firstMember } = await supabase
            .from('organization_members')
            .select('id')
            .eq('household_id', householdId)
            .eq('organization_id', currentOrganization.id)
            .limit(1)
            .maybeSingle()

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if (firstMember && (firstMember as any).id) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            memberId = (firstMember as any).id
          }
        }
      }

      const donationData = {
        organization_id: currentOrganization.id,
        household_id: householdId,
        member_id: memberId,
        fund_id: formData.fund_id,
        amount: parseFloat(formData.amount),
        payment_method: formData.payment_method,
        donation_date: formData.donation_date,
        donation_type: 'one_time' as const,
        status: 'completed' as const,
        currency: 'USD',
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('donations')
        .insert([donationData])
        .select()
        .single()

      if (error) throw error

      // Fetch household and fund details for invoice
      let householdData = null
      let fundData = null

      if (formData.household_id) {
        const { data: hData } = await supabase
          .from('households')
          .select('*')
          .eq('id', formData.household_id)
          .single()
        householdData = hData
      }

      if (formData.fund_id) {
        const fundMatch = funds.find((f) => f.id === formData.fund_id)
        if (fundMatch) {
          fundData = fundMatch
        }
      }

      setSavedDonation(data)
      setSelectedHousehold(householdData)
      setSelectedFund(fundData)

      setFormData(initialFormData)

      if (onSave) {
        setTimeout(() => {
          onSave()
        }, 500)
      }

      window.dispatchEvent(new CustomEvent('donationCreated'))

      onClose()
      setShowInvoice(true)
    } catch (err) {
      console.error('Error saving donation:', err)
      setError(err instanceof Error ? err.message : 'Failed to save donation.')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    const newFormData = {
      ...formData,
      [name]: value,
    }

    if (name === 'member_id' && value && currentOrganization) {
      try {
        const { data: member, error } = await supabase
          .from('organization_members')
          .select('household_id')
          .eq('id', value)
          .eq('organization_id', currentOrganization.id)
          .single()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (!error && member && (member as any).household_id) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          newFormData.household_id = (member as any).household_id
        } else {
          newFormData.household_id = ''
        }
      } catch (err) {
        console.error('Error fetching member household:', err)
        newFormData.household_id = ''
      }
    }

    setFormData(newFormData)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md mx-4">
          <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">New Donation</h2>
            <button
              onClick={handleClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 text-sm text-red-800 dark:text-red-200">
                {error}
              </div>
            )}

            {prefillMemberId ? (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name
                </label>
                <input
                  type="text"
                  value={
                    members.find((m) => m.id === prefillMemberId)
                      ? `${members.find((m) => m.id === prefillMemberId)!.first_name} ${
                          members.find((m) => m.id === prefillMemberId)!.last_name
                        }`
                      : 'Loading...'
                  }
                  readOnly
                  disabled
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-600 dark:text-slate-400 cursor-not-allowed"
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  Name
                </label>
                <select
                  name="member_id"
                  value={formData.member_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                >
                  <option value="">Select member</option>
                  {members.map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.first_name} {member.last_name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                  Household will be automatically updated
                </p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Fund <span className="text-red-500">*</span>
              </label>
              <select
                name="fund_id"
                value={formData.fund_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              >
                <option value="">Select fund</option>
                {funds.map((fund) => (
                  <option key={fund.id} value={fund.id}>
                    {fund.name || `Fund ${fund.id}`}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="amount"
                value={formData.amount}
                onChange={handleChange}
                step="0.01"
                min="0"
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
                placeholder="0.00"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Donation Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="donation_date"
                value={formData.donation_date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Payment Method <span className="text-red-500">*</span>
              </label>
              <select
                name="payment_method"
                value={formData.payment_method}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400"
              >
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="card">Card</option>
              </select>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || !formData.amount || !formData.fund_id}
                className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {showInvoice && savedDonation && (
        <DonationInvoice
          isOpen={showInvoice}
          onClose={() => setShowInvoice(false)}
          donation={savedDonation}
          household={selectedHousehold}
          fund={selectedFund}
        />
      )}
    </>
  )
}
