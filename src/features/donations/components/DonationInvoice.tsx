import { X, Download, Mail, Printer } from 'lucide-react'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/app/providers/OrganizationProvider'

interface Donation {
  id: string
  amount: number
  payment_method: string
  donation_date: string | null
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

interface DonationInvoiceProps {
  isOpen: boolean
  onClose: () => void
  donation: Donation | null
  household: Household | null
  fund: Fund | null
}

export function DonationInvoice({ isOpen, onClose, donation, household, fund }: DonationInvoiceProps) {
  const { currentOrganization } = useOrganization()
  const [organizationName, setOrganizationName] = useState('')

  useEffect(() => {
    if (isOpen && currentOrganization) {
      fetchOrganizationName()
    }
  }, [isOpen, currentOrganization])

  const fetchOrganizationName = async () => {
    if (!currentOrganization) return

    try {
      // Organization name is available directly from currentOrganization
      setOrganizationName(currentOrganization.name || 'Mosque SaaS')
    } catch (err) {
      console.error('Error fetching organization name:', err)
    }
  }

  if (!isOpen || !donation) return null

  const formatCurrency = (amount: number) => {
    if (!amount) return '$0.00'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string | null) => {
    if (!dateString) return new Date().toLocaleDateString()
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  const generateInvoiceNumber = () => {
    const timestamp = new Date().getTime()
    return `INV-${timestamp.toString().slice(-8)}`
  }

  const handlePrint = () => {
    window.print()
  }

  const handleDownload = () => {
    const invoiceContent = document.getElementById('invoice-content')
    if (!invoiceContent) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) return

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Donation Receipt - ${generateInvoiceNumber()}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #10b981; padding-bottom: 20px; }
            .invoice-number { color: #6b7280; font-size: 14px; }
            .details { margin: 30px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .total { font-size: 24px; font-weight: bold; color: #10b981; margin-top: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          ${invoiceContent.innerHTML}
        </body>
      </html>
    `)
    printWindow.document.close()
    printWindow.print()
  }

  const handleSendEmail = async () => {
    try {
      if (!household?.id || !currentOrganization) {
        alert('No household information available.')
        return
      }

      const { data: members, error } = await supabase
        .from('organization_members')
        .select('email, first_name, last_name')
        .eq('organization_id', currentOrganization.id)
        .eq('household_id', household.id)
        .not('email', 'is', null)

      if (error || !members || members.length === 0) {
        alert('No email addresses found for this household.')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const emails = (members as any[]).map((m: any) => m.email).filter(Boolean)
      if (emails.length === 0) {
        alert('No email addresses found.')
        return
      }

      const subject = encodeURIComponent(`Donation Receipt - ${generateInvoiceNumber()}`)
      const body = encodeURIComponent(
        `Thank you for your donation of ${formatCurrency(donation.amount)}.\n\n` +
          `Date: ${formatDate(donation.donation_date || donation.created_at)}\n` +
          `${household ? `Donor: ${household.name}\n` : ''}` +
          `${fund ? `Fund: ${fund.name}\n` : ''}` +
          `Payment Method: ${donation.payment_method || 'N/A'}\n\n` +
          `Invoice #: ${generateInvoiceNumber()}`
      )

      window.location.href = `mailto:${emails[0]}?subject=${subject}&body=${body}`

      alert(`Invoice ready to send to ${emails[0]}`)
    } catch (err) {
      console.error('Error sending email:', err)
      alert('Failed to prepare email.')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">Donation Receipt</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSendEmail}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              title="Send via Email"
            >
              <Mail size={16} />
              Email
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              title="Download PDF"
            >
              <Download size={16} />
              Download
            </button>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors"
              title="Print"
            >
              <Printer size={16} />
              Print
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors ml-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div id="invoice-content" className="p-8">
          {/* Header */}
          <div className="text-center mb-8 pb-6 border-b-2 border-emerald-500">
            <h1 className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              {organizationName || 'Mosque SaaS'}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">Donation Receipt</p>
            <p className="text-slate-400 dark:text-slate-500 text-sm mt-2">Invoice #{generateInvoiceNumber()}</p>
          </div>

          {/* Details */}
          <div className="mb-6 space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Date:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {formatDate(donation.donation_date || donation.created_at)}
              </span>
            </div>
            {household && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Donor:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{household.name}</span>
              </div>
            )}
            {fund && (
              <div className="flex justify-between">
                <span className="text-slate-600 dark:text-slate-400">Fund:</span>
                <span className="font-medium text-slate-900 dark:text-slate-100">{fund.name}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-slate-600 dark:text-slate-400">Payment Method:</span>
              <span className="font-medium text-slate-900 dark:text-slate-100">
                {donation.payment_method || 'N/A'}
              </span>
            </div>
          </div>

          {/* Amount */}
          <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-medium text-slate-700 dark:text-slate-300">Donation Amount:</span>
              <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(donation.amount)}
              </span>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700 text-center text-slate-500 dark:text-slate-400 text-sm">
            <p className="mb-2">Thank you for your generous donation. May Allah accept it from you.</p>
            <p>This is an automated receipt. Please keep this for your records.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
