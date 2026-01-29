/**
 * PDF generation utility
 * Provides functionality to generate PDF documents
 *
 * @module pdfGenerator
 * @description PDF generation utilities for invoices, receipts, and reports
 *
 * @requires jspdf - Install with: npm install jspdf
 * @requires jspdf-autotable - Install with: npm install jspdf-autotable
 */

// Type definitions for jsPDF (install @types/jspdf for full types)
type JsPDF = unknown
type AutoTable = unknown

/**
 * Invoice data interface
 */
export interface InvoiceData {
  id: string | number
  date?: string
  dueDate?: string
  invoiceNumber?: string
  amount: number
  items?: InvoiceItem[]
  status?: 'paid' | 'pending' | 'overdue'
  notes?: string
}

/**
 * Invoice item interface
 */
export interface InvoiceItem {
  description: string
  quantity: number
  unitPrice: number
  total: number
}

/**
 * Customer/Donor information
 */
export interface CustomerInfo {
  name: string
  email?: string
  phone?: string
  address?: string
}

/**
 * Organization information
 */
export interface OrganizationInfo {
  name: string
  address?: string
  phone?: string
  email?: string
  website?: string
  logo?: string
}

/**
 * PDF generation options
 */
export interface PDFOptions {
  /** Organization information */
  organization?: OrganizationInfo
  /** Custom header color (RGB array) */
  headerColor?: [number, number, number]
  /** Custom accent color (RGB array) */
  accentColor?: [number, number, number]
  /** Include logo */
  includeLogo?: boolean
  /** Custom footer text */
  footerText?: string
  /** Page orientation */
  orientation?: 'portrait' | 'landscape'
}

/**
 * Format currency amount
 *
 * @param amount - The amount to format
 * @param currency - Currency code (default: USD)
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  if (!amount && amount !== 0) return '$0.00'
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount)
}

/**
 * Format date
 *
 * @param dateString - Date string or Date object
 * @returns Formatted date string
 */
export function formatDate(dateString: string | Date): string {
  if (!dateString) return new Date().toLocaleDateString()
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

/**
 * Generate an invoice PDF
 *
 * @param invoice - Invoice data
 * @param customer - Customer information
 * @param options - PDF generation options
 *
 * @example
 * ```typescript
 * const invoice = {
 *   id: '12345',
 *   date: '2024-01-29',
 *   amount: 150.00,
 *   items: [
 *     { description: 'Service', quantity: 1, unitPrice: 150, total: 150 }
 *   ]
 * }
 *
 * const customer = {
 *   name: 'John Doe',
 *   email: 'john@example.com'
 * }
 *
 * generateInvoice(invoice, customer, {
 *   organization: { name: 'Mosque SaaS' }
 * })
 * ```
 */
export async function generateInvoice(
  invoice: InvoiceData,
  customer: CustomerInfo,
  options: PDFOptions = {}
): Promise<void> {
  try {
    // Dynamic import to avoid bundling if not needed
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const {
      organization = { name: 'Mosque SaaS' },
      headerColor = [16, 185, 129], // emerald-500
      accentColor = [16, 185, 129],
      footerText = 'Thank you for your support.',
    } = options

    // Create PDF document
    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
    }) as unknown as {
      internal: { pageSize: { getWidth: () => number; getHeight: () => number } }
      setFillColor: (r: number, g: number, b: number) => void
      setTextColor: (r: number, g: number, b: number) => void
      setFontSize: (size: number) => void
      setFont: (font: string, style: string) => void
      text: (text: string, x: number, y: number, options?: { align: string }) => void
      rect: (x: number, y: number, w: number, h: number, style: string) => void
      setDrawColor: (r: number, g: number, b: number) => void
      line: (x1: number, y1: number, x2: number, y2: number) => void
      save: (filename: string) => void
    }

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20
    const contentWidth = pageWidth - 2 * margin

    let yPosition = margin

    // Header Section
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    doc.rect(0, 0, pageWidth, 50, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(24)
    doc.setFont('helvetica', 'bold')
    doc.text(organization.name, pageWidth / 2, 25, { align: 'center' })

    doc.setFontSize(16)
    doc.setFont('helvetica', 'normal')
    doc.text('INVOICE', pageWidth / 2, 40, { align: 'center' })

    yPosition = 70

    // Invoice details
    const invoiceNumber =
      invoice.invoiceNumber ||
      `INV-${invoice.id.toString().slice(-8).toUpperCase()}`

    doc.setTextColor(100, 100, 100)
    doc.setFontSize(10)
    doc.text(`Invoice #: ${invoiceNumber}`, pageWidth / 2, yPosition, {
      align: 'center',
    })

    yPosition += 20

    // Customer and invoice info
    doc.setTextColor(0, 0, 0)
    doc.setFontSize(12)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', margin, yPosition)

    yPosition += 8
    doc.setFont('helvetica', 'normal')
    doc.text(customer.name, margin, yPosition)

    if (customer.email) {
      yPosition += 6
      doc.setFontSize(10)
      doc.text(customer.email, margin, yPosition)
    }

    // Invoice date on the right
    yPosition = 90
    doc.setFontSize(11)
    doc.text('Date:', pageWidth - margin - 60, yPosition)
    doc.text(formatDate(invoice.date || new Date().toISOString()), pageWidth - margin, yPosition, {
      align: 'right',
    })

    if (invoice.dueDate) {
      yPosition += 8
      doc.text('Due Date:', pageWidth - margin - 60, yPosition)
      doc.text(formatDate(invoice.dueDate), pageWidth - margin, yPosition, {
        align: 'right',
      })
    }

    yPosition += 20

    // Items table (if items are provided)
    if (invoice.items && invoice.items.length > 0) {
      ;(autoTable as unknown as (doc: unknown, options: unknown) => void)(doc, {
        startY: yPosition,
        head: [['Description', 'Quantity', 'Unit Price', 'Total']],
        body: invoice.items.map((item) => [
          item.description,
          item.quantity,
          formatCurrency(item.unitPrice),
          formatCurrency(item.total),
        ]),
        theme: 'striped',
        headStyles: {
          fillColor: headerColor,
          textColor: [255, 255, 255],
          fontStyle: 'bold',
        },
        styles: {
          fontSize: 10,
          cellPadding: 3,
        },
      })

      yPosition = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 15
    }

    // Total amount
    doc.setFillColor(249, 250, 251)
    doc.rect(margin, yPosition, contentWidth, 40, 'F')

    yPosition += 15

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text('Total Amount', pageWidth / 2, yPosition, { align: 'center' })

    yPosition += 15

    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.setTextColor(accentColor[0], accentColor[1], accentColor[2])
    doc.text(formatCurrency(invoice.amount), pageWidth / 2, yPosition, {
      align: 'center',
    })

    yPosition += 30

    // Footer
    doc.setDrawColor(200, 200, 200)
    doc.line(margin, yPosition, pageWidth - margin, yPosition)

    yPosition += 15

    doc.setFontSize(11)
    doc.setFont('helvetica', 'normal')
    doc.setTextColor(100, 100, 100)
    doc.text(footerText, pageWidth / 2, yPosition, { align: 'center' })

    // Save PDF
    const filename = `Invoice-${invoiceNumber}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error generating PDF:', error)
    throw new Error(
      'Failed to generate PDF. Make sure jspdf and jspdf-autotable are installed.'
    )
  }
}

/**
 * Generate a receipt PDF
 *
 * @param receipt - Receipt data (similar to invoice)
 * @param customer - Customer information
 * @param options - PDF generation options
 */
export async function generateReceipt(
  receipt: InvoiceData,
  customer: CustomerInfo,
  options: PDFOptions = {}
): Promise<void> {
  // Receipt is similar to invoice but with different styling
  await generateInvoice(receipt, customer, {
    ...options,
    footerText: options.footerText || 'Thank you for your payment.',
  })
}

/**
 * Generate a report PDF with table data
 *
 * @param title - Report title
 * @param data - Array of data objects
 * @param columns - Column definitions
 * @param options - PDF generation options
 */
export async function generateReport(
  title: string,
  data: Record<string, unknown>[],
  columns: Array<{ key: string; label: string }>,
  options: PDFOptions = {}
): Promise<void> {
  try {
    const { default: jsPDF } = await import('jspdf')
    const { default: autoTable } = await import('jspdf-autotable')

    const {
      organization = { name: 'Mosque SaaS' },
      headerColor = [16, 185, 129],
    } = options

    const doc = new jsPDF({
      orientation: options.orientation || 'portrait',
    }) as unknown as {
      internal: { pageSize: { getWidth: () => number } }
      setFillColor: (r: number, g: number, b: number) => void
      setTextColor: (r: number, g: number, b: number) => void
      setFontSize: (size: number) => void
      setFont: (font: string, style: string) => void
      text: (text: string, x: number, y: number, options?: { align: string }) => void
      rect: (x: number, y: number, w: number, h: number, style: string) => void
      save: (filename: string) => void
    }

    const pageWidth = doc.internal.pageSize.getWidth()
    const margin = 20

    // Header
    doc.setFillColor(headerColor[0], headerColor[1], headerColor[2])
    doc.rect(0, 0, pageWidth, 40, 'F')

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont('helvetica', 'bold')
    doc.text(organization.name, pageWidth / 2, 15, { align: 'center' })

    doc.setFontSize(14)
    doc.setFont('helvetica', 'normal')
    doc.text(title, pageWidth / 2, 30, { align: 'center' })

    // Data table
    const tableData = data.map((row) =>
      columns.map((col) => String(row[col.key] || ''))
    )

    ;(autoTable as unknown as (doc: unknown, options: unknown) => void)(doc, {
      startY: 60,
      head: [columns.map((col) => col.label)],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: headerColor,
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      styles: {
        fontSize: 10,
        cellPadding: 3,
      },
    })

    // Save PDF
    const timestamp = new Date().toISOString().split('T')[0]
    const filename = `${title.replace(/\s+/g, '-')}-${timestamp}.pdf`
    doc.save(filename)
  } catch (error) {
    console.error('Error generating report PDF:', error)
    throw new Error(
      'Failed to generate PDF. Make sure jspdf and jspdf-autotable are installed.'
    )
  }
}

/**
 * Check if PDF generation is available
 *
 * @returns True if jsPDF is available
 */
export async function isPDFAvailable(): Promise<boolean> {
  try {
    await import('jspdf')
    await import('jspdf-autotable')
    return true
  } catch {
    return false
  }
}
