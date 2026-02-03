/**
 * PDF Generation Types
 */

export interface PDFMetadata {
  title: string;
  subject?: string;
  author?: string;
  creator?: string;
}

export interface PDFHeaderConfig {
  organizationName: string;
  organizationLogo?: string; // Base64 encoded image
  organizationAddress?: string;
  organizationPhone?: string;
  organizationEmail?: string;
  organizationWebsite?: string;
}

export interface PDFFooterConfig {
  text?: string;
  showPageNumbers?: boolean;
  showDate?: boolean;
}

export interface PDFTableColumn {
  header: string;
  dataKey: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface PDFDocumentConfig {
  metadata: PDFMetadata;
  header?: PDFHeaderConfig;
  footer?: PDFFooterConfig;
  isRTL?: boolean;
  language?: 'en' | 'ar' | 'tr';
  pageSize?: 'a4' | 'letter';
  orientation?: 'portrait' | 'landscape';
}

export interface InvoiceData {
  invoiceNumber: string;
  date: Date;
  dueDate?: Date;
  donor: {
    name: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  items: Array<{
    description: string;
    fund?: string;
    amount: number;
    isZakat?: boolean;
  }>;
  total: number;
  currency: string;
  paymentMethod?: string;
  notes?: string;
  taxDeductible?: boolean;
}

export interface CertificateData {
  certificateNumber: string;
  type: 'nikah' | 'janazah' | 'shahada' | 'education' | 'membership';
  date: Date;
  hijriDate?: string;
  recipientName: string;
  recipientNameArabic?: string;
  details: Record<string, string>;
  officiantName?: string;
  witnesses?: string[];
}

export interface ReportData {
  title: string;
  subtitle?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
  columns: PDFTableColumn[];
  data: Record<string, unknown>[];
  summary?: Record<string, string | number>;
}
