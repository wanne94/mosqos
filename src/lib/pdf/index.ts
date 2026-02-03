/**
 * PDF Generation Module
 *
 * Provides PDF generation utilities for:
 * - Donation invoices/receipts
 * - Year-end statements
 * - Islamic service certificates (Nikah, Janazah, Shahada)
 * - Education certificates
 * - Financial reports
 * - Attendance reports
 * - Member lists
 */

// Types
export type {
  PDFMetadata,
  PDFHeaderConfig,
  PDFFooterConfig,
  PDFTableColumn,
  PDFDocumentConfig,
  InvoiceData,
  CertificateData,
  ReportData,
} from './types';

// Utility functions
export {
  createPDFDocument,
  addHeader,
  addFooter,
  addTitle,
  addTable,
  addKeyValueSection,
  addTextBlock,
  formatCurrency,
  formatDate,
  savePDF,
  getPDFBlob,
  getPDFBase64,
  previewPDF,
} from './pdf-utils';

// Invoice generator
export {
  generateDonationInvoice,
  generateYearEndStatement,
  type GenerateInvoiceOptions,
} from './generators/invoice.generator';

// Certificate generator
export {
  generateCertificate,
  type GenerateCertificateOptions,
} from './generators/certificate.generator';

// Report generators
export {
  generateReport,
  generateFinancialReport,
  generateAttendanceReport,
  generateMemberListReport,
  type GenerateReportOptions,
} from './generators/report.generator';
