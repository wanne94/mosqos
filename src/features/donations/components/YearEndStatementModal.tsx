/**
 * Year End Statement Modal
 * Preview and download individual year-end statements
 */

import { useState } from 'react'
import { X, Download, Mail, FileText, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { DonorYearSummary } from '../services/tax-receipts.service'
import { generateYearEndStatement } from '@/lib/pdf/generators/invoice.generator'
import type { PDFHeaderConfig } from '@/lib/pdf/types'
import { savePDF, previewPDF } from '@/lib/pdf/pdf-utils'

interface YearEndStatementModalProps {
  isOpen: boolean
  onClose: () => void
  donor: DonorYearSummary | null
  year: number
  organization: {
    name: string
    address?: string
    phone?: string
    email?: string
    website?: string
    logo?: string
  }
  language?: 'en' | 'ar' | 'tr'
  onReceiptSent?: (donationIds: string[]) => void
}

export function YearEndStatementModal({
  isOpen,
  onClose,
  donor,
  year,
  organization,
  language = 'en',
  onReceiptSent,
}: YearEndStatementModalProps) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSending, setIsSending] = useState(false)

  if (!isOpen || !donor) return null

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(date)
  }

  const handleDownload = async () => {
    setIsGenerating(true)
    try {
      const header: PDFHeaderConfig = {
        organizationName: organization.name,
        organizationAddress: organization.address,
        organizationPhone: organization.phone,
        organizationEmail: organization.email,
        organizationWebsite: organization.website,
        organizationLogo: organization.logo,
      }

      const donorInfo = {
        name: donor.donorName,
        email: donor.donorEmail || undefined,
        address: donor.donorAddress || undefined,
      }

      const donations = donor.donations.map(d => ({
        date: d.date,
        amount: d.amount,
        fund: d.fund || undefined,
        receiptNumber: d.receiptNumber || '',
        isZakat: d.isZakat,
      }))

      const doc = generateYearEndStatement(
        header,
        donorInfo,
        donations,
        year,
        'USD',
        language
      )

      savePDF(doc, `year-end-statement-${year}-${donor.donorName.replace(/\s+/g, '-').toLowerCase()}`)
      toast.success('Statement downloaded successfully')

      // Mark receipts as sent
      if (onReceiptSent) {
        const donationIds = donor.donations.map(d => d.id)
        onReceiptSent(donationIds)
      }
    } catch (error) {
      console.error('Error generating statement:', error)
      toast.error('Failed to generate statement')
    } finally {
      setIsGenerating(false)
    }
  }

  const handlePreview = async () => {
    setIsGenerating(true)
    try {
      const header: PDFHeaderConfig = {
        organizationName: organization.name,
        organizationAddress: organization.address,
        organizationPhone: organization.phone,
        organizationEmail: organization.email,
        organizationWebsite: organization.website,
        organizationLogo: organization.logo,
      }

      const donorInfo = {
        name: donor.donorName,
        email: donor.donorEmail || undefined,
        address: donor.donorAddress || undefined,
      }

      const donations = donor.donations.map(d => ({
        date: d.date,
        amount: d.amount,
        fund: d.fund || undefined,
        receiptNumber: d.receiptNumber || '',
        isZakat: d.isZakat,
      }))

      const doc = generateYearEndStatement(
        header,
        donorInfo,
        donations,
        year,
        'USD',
        language
      )

      previewPDF(doc)
    } catch (error) {
      console.error('Error previewing statement:', error)
      toast.error('Failed to preview statement')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleSendEmail = async () => {
    if (!donor.donorEmail) {
      toast.error('Donor does not have an email address')
      return
    }

    setIsSending(true)
    try {
      // TODO: Implement email sending via Edge Function
      toast.info('Email sending will be implemented with Edge Functions')

      // For now, just mark as sent
      if (onReceiptSent) {
        const donationIds = donor.donations.map(d => d.id)
        onReceiptSent(donationIds)
      }
    } catch (error) {
      console.error('Error sending email:', error)
      toast.error('Failed to send email')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Year-End Statement - {year}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X size={20} className="text-slate-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* Donor Info */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Donor Information
            </h3>
            <div className="bg-slate-50 dark:bg-slate-700/50 rounded-lg p-4">
              <p className="font-semibold text-slate-900 dark:text-white">{donor.donorName}</p>
              {donor.donorEmail && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{donor.donorEmail}</p>
              )}
              {donor.donorPhone && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{donor.donorPhone}</p>
              )}
              {donor.donorAddress && (
                <p className="text-sm text-slate-600 dark:text-slate-400">{donor.donorAddress}</p>
              )}
            </div>
          </div>

          {/* Summary */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Summary
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-emerald-600 dark:text-emerald-400 uppercase">Total</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-300">
                  {formatCurrency(donor.totalAmount)}
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-blue-600 dark:text-blue-400 uppercase">Tax Deductible</p>
                <p className="text-lg font-bold text-blue-700 dark:text-blue-300">
                  {formatCurrency(donor.taxDeductibleAmount)}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400 uppercase">Zakat</p>
                <p className="text-lg font-bold text-purple-700 dark:text-purple-300">
                  {formatCurrency(donor.zakatAmount)}
                </p>
              </div>
              <div className="bg-slate-50 dark:bg-slate-700 rounded-lg p-3 text-center">
                <p className="text-xs text-slate-600 dark:text-slate-400 uppercase">Donations</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">
                  {donor.donationCount}
                </p>
              </div>
            </div>
          </div>

          {/* Donations List */}
          <div>
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
              Donations ({donor.donations.length})
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                      Date
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                      Receipt #
                    </th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                      Fund
                    </th>
                    <th className="px-3 py-2 text-center text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                      Type
                    </th>
                    <th className="px-3 py-2 text-right text-xs font-medium text-slate-600 dark:text-slate-400 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                  {donor.donations.map((donation) => (
                    <tr key={donation.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                      <td className="px-3 py-2 whitespace-nowrap text-slate-900 dark:text-white">
                        {formatDate(donation.date)}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400 font-mono text-xs">
                        {donation.receiptNumber}
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-slate-600 dark:text-slate-400">
                        {donation.fund || '-'}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            donation.isZakat
                              ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                              : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                          }`}
                        >
                          {donation.isZakat ? 'Zakat' : 'Sadaqah'}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-right font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(donation.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-700 font-semibold">
                  <tr>
                    <td colSpan={4} className="px-3 py-2 text-right text-slate-900 dark:text-white">
                      Total:
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-600 dark:text-emerald-400">
                      {formatCurrency(donor.totalAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={handlePreview}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <FileText size={18} />
            )}
            Preview
          </button>
          {donor.donorEmail && (
            <button
              onClick={handleSendEmail}
              disabled={isSending}
              className="flex items-center gap-2 px-4 py-2 text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors disabled:opacity-50"
            >
              {isSending ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Mail size={18} />
              )}
              Send Email
            </button>
          )}
          <button
            onClick={handleDownload}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50"
          >
            {isGenerating ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Download size={18} />
            )}
            Download PDF
          </button>
        </div>
      </div>
    </div>
  )
}
