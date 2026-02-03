/**
 * Batch Export Progress Modal
 * Shows progress when generating multiple year-end statements
 */

import { useState, useEffect, useCallback } from 'react'
import { X, Loader2, CheckCircle, XCircle, Download, FileArchive } from 'lucide-react'
import { toast } from 'sonner'
import type { DonorYearSummary } from '../services/tax-receipts.service'
import { generateYearEndStatement } from '@/lib/pdf/generators/invoice.generator'
import type { PDFHeaderConfig } from '@/lib/pdf/types'
import { getPDFBlob } from '@/lib/pdf/pdf-utils'
import JSZip from 'jszip'

interface BatchExportProgressProps {
  isOpen: boolean
  onClose: () => void
  donors: DonorYearSummary[]
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
  onComplete?: (donationIds: string[]) => void
}

interface ExportStatus {
  donorId: string
  donorName: string
  status: 'pending' | 'processing' | 'success' | 'error'
  error?: string
}

export function BatchExportProgress({
  isOpen,
  onClose,
  donors,
  year,
  organization,
  language = 'en',
  onComplete,
}: BatchExportProgressProps) {
  const [exportStatuses, setExportStatuses] = useState<ExportStatus[]>([])
  const [isExporting, setIsExporting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)
  const [zipBlob, setZipBlob] = useState<Blob | null>(null)
  const [progress, setProgress] = useState(0)

  // Initialize export statuses when modal opens
  useEffect(() => {
    if (isOpen && donors.length > 0) {
      setExportStatuses(
        donors.map((d) => ({
          donorId: d.donorId,
          donorName: d.donorName,
          status: 'pending',
        }))
      )
      setIsExporting(false)
      setIsComplete(false)
      setZipBlob(null)
      setProgress(0)
    }
  }, [isOpen, donors])

  const generateStatements = useCallback(async () => {
    if (donors.length === 0) return

    setIsExporting(true)
    const zip = new JSZip()
    const allDonationIds: string[] = []

    const header: PDFHeaderConfig = {
      organizationName: organization.name,
      organizationAddress: organization.address,
      organizationPhone: organization.phone,
      organizationEmail: organization.email,
      organizationWebsite: organization.website,
      organizationLogo: organization.logo,
    }

    for (let i = 0; i < donors.length; i++) {
      const donor = donors[i]

      // Update status to processing
      setExportStatuses((prev) =>
        prev.map((s) =>
          s.donorId === donor.donorId ? { ...s, status: 'processing' } : s
        )
      )

      try {
        const donorInfo = {
          name: donor.donorName,
          email: donor.donorEmail || undefined,
          address: donor.donorAddress || undefined,
        }

        const donations = donor.donations.map((d) => ({
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

        const blob = getPDFBlob(doc)
        const filename = `${donor.donorName.replace(/[^a-zA-Z0-9]/g, '_')}_${year}.pdf`
        zip.file(filename, blob)

        // Collect donation IDs
        allDonationIds.push(...donor.donations.map((d) => d.id))

        // Update status to success
        setExportStatuses((prev) =>
          prev.map((s) =>
            s.donorId === donor.donorId ? { ...s, status: 'success' } : s
          )
        )
      } catch (error) {
        console.error(`Error generating statement for ${donor.donorName}:`, error)
        setExportStatuses((prev) =>
          prev.map((s) =>
            s.donorId === donor.donorId
              ? { ...s, status: 'error', error: 'Failed to generate PDF' }
              : s
          )
        )
      }

      // Update progress
      setProgress(Math.round(((i + 1) / donors.length) * 100))

      // Small delay to prevent UI freezing
      await new Promise((resolve) => setTimeout(resolve, 50))
    }

    // Generate ZIP file
    try {
      const zipContent = await zip.generateAsync({ type: 'blob' })
      setZipBlob(zipContent)
      setIsComplete(true)

      // Notify parent about completed donations
      if (onComplete && allDonationIds.length > 0) {
        onComplete(allDonationIds)
      }

      toast.success(`Generated ${donors.length} statements`)
    } catch (error) {
      console.error('Error creating ZIP:', error)
      toast.error('Failed to create ZIP file')
    }

    setIsExporting(false)
  }, [donors, year, organization, language, onComplete])

  const handleDownloadZip = () => {
    if (!zipBlob) return

    const url = URL.createObjectURL(zipBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `year-end-statements-${year}.zip`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  if (!isOpen) return null

  const successCount = exportStatuses.filter((s) => s.status === 'success').length
  const errorCount = exportStatuses.filter((s) => s.status === 'error').length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={isExporting ? undefined : onClose} />
      <div className="relative bg-white dark:bg-slate-800 rounded-lg shadow-xl max-w-lg w-full mx-4 max-h-[80vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div>
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
              Batch Export - {year}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {donors.length} statement{donors.length !== 1 ? 's' : ''} to generate
            </p>
          </div>
          {!isExporting && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X size={20} className="text-slate-500" />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        {isExporting && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                Generating statements...
              </span>
              <span className="text-sm text-slate-500">{progress}%</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
              <div
                className="bg-emerald-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Status List */}
        <div className="p-4 overflow-y-auto flex-1">
          {!isExporting && !isComplete && (
            <div className="text-center py-8">
              <FileArchive size={48} className="mx-auto text-slate-400 mb-4" />
              <p className="text-slate-600 dark:text-slate-400 mb-4">
                Ready to generate {donors.length} year-end statement{donors.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={generateStatements}
                className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-medium"
              >
                Start Export
              </button>
            </div>
          )}

          {(isExporting || isComplete) && (
            <div className="space-y-2">
              {exportStatuses.map((status) => (
                <div
                  key={status.donorId}
                  className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg"
                >
                  <span className="text-sm text-slate-900 dark:text-white truncate max-w-[200px]">
                    {status.donorName}
                  </span>
                  <div className="flex items-center gap-2">
                    {status.status === 'pending' && (
                      <span className="text-xs text-slate-500">Waiting...</span>
                    )}
                    {status.status === 'processing' && (
                      <Loader2 size={18} className="text-blue-500 animate-spin" />
                    )}
                    {status.status === 'success' && (
                      <CheckCircle size={18} className="text-emerald-500" />
                    )}
                    {status.status === 'error' && (
                      <div className="flex items-center gap-2">
                        <XCircle size={18} className="text-red-500" />
                        <span className="text-xs text-red-500">{status.error}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {isComplete && (
          <div className="p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center justify-between mb-3">
              <div className="text-sm text-slate-600 dark:text-slate-400">
                <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                  {successCount} successful
                </span>
                {errorCount > 0 && (
                  <>
                    {' • '}
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      {errorCount} failed
                    </span>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={onClose}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-600 transition-colors"
              >
                Close
              </button>
              {zipBlob && (
                <button
                  onClick={handleDownloadZip}
                  className="flex items-center gap-2 px-4 py-2 text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  <Download size={18} />
                  Download ZIP
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
