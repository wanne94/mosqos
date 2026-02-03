/**
 * Donation Receipt PDF Generator Utility
 */

import { generateDonationInvoice, type PDFHeaderConfig, type InvoiceData } from '@/lib/pdf';
import type { Donation, Fund } from '../types/donations.types';

interface GenerateReceiptOptions {
  donation: Donation;
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string; // Base64 encoded
  };
  language?: 'en' | 'ar' | 'tr';
  action?: 'download' | 'preview';
}

/**
 * Generate a PDF receipt for a donation
 */
export function generateDonationReceipt(options: GenerateReceiptOptions): void {
  const { donation, organization, language = 'en', action = 'download' } = options;

  // Build organization header
  const header: PDFHeaderConfig = {
    organizationName: organization.name,
    organizationLogo: organization.logo,
    organizationAddress: organization.address,
    organizationPhone: organization.phone,
    organizationEmail: organization.email,
    organizationWebsite: organization.website,
  };

  // Build donor info
  const donorName = donation.is_anonymous
    ? 'Anonymous Donor'
    : donation.member
      ? `${donation.member.first_name || ''} ${donation.member.last_name || ''}`.trim()
      : 'Anonymous Donor';

  // Generate unique receipt number
  const receiptNumber = `REC-${donation.donation_date?.replace(/-/g, '').slice(0, 8) || 'XXXXXX'}-${donation.id.slice(0, 8).toUpperCase()}`;

  // Map fund type to Zakat/Sadaqah
  const isZakat = donation.fund?.fund_type === 'zakat';

  // Build invoice data
  const invoice: InvoiceData = {
    invoiceNumber: receiptNumber,
    date: new Date(donation.donation_date || donation.created_at),
    donor: {
      name: donorName,
      email: donation.is_anonymous ? undefined : donation.member?.email || undefined,
    },
    items: [
      {
        description: donation.fund?.name || 'General Donation',
        fund: donation.fund?.name,
        amount: Number(donation.amount),
        isZakat,
      },
    ],
    total: Number(donation.amount),
    currency: donation.currency || 'USD',
    paymentMethod: formatPaymentMethod(donation.payment_method),
    notes: donation.notes || undefined,
    taxDeductible: donation.is_tax_deductible,
  };

  // Generate PDF
  generateDonationInvoice({
    header,
    invoice,
    language,
    action,
  });
}

/**
 * Format payment method for display
 */
function formatPaymentMethod(method: string): string {
  const methodLabels: Record<string, string> = {
    cash: 'Cash',
    check: 'Check',
    card: 'Credit/Debit Card',
    bank_transfer: 'Bank Transfer',
    online: 'Online Payment',
    other: 'Other',
  };

  return methodLabels[method] || method;
}

/**
 * Generate year-end statement for a donor
 */
export function generateDonorYearEndStatement(options: {
  donorName: string;
  donorEmail?: string;
  donorAddress?: string;
  donations: Array<{
    date: Date;
    amount: number;
    fund?: string;
    receiptNumber: string;
    isZakat?: boolean;
  }>;
  year: number;
  organization: {
    name: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string;
  };
  currency?: string;
  language?: 'en' | 'ar' | 'tr';
}): void {
  const {
    donorName,
    donorEmail,
    donorAddress,
    donations,
    year,
    organization,
    currency = 'USD',
    language = 'en',
  } = options;

  // Use the generateYearEndStatement function from the PDF library
  const { generateYearEndStatement, savePDF } = require('@/lib/pdf');

  const header: PDFHeaderConfig = {
    organizationName: organization.name,
    organizationLogo: organization.logo,
    organizationAddress: organization.address,
    organizationPhone: organization.phone,
    organizationEmail: organization.email,
    organizationWebsite: organization.website,
  };

  const doc = generateYearEndStatement(
    header,
    {
      name: donorName,
      email: donorEmail,
      address: donorAddress,
    },
    donations,
    year,
    currency,
    language
  );

  savePDF(doc, `year-end-statement-${year}-${donorName.replace(/\s+/g, '-').toLowerCase()}`);
}
