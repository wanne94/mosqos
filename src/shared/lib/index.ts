/**
 * Shared library utilities
 * Core utilities for the Mosque SaaS application
 *
 * @module shared/lib
 */

// Logger utility
export { logger } from './logger'
export type { default as Logger } from './logger'

// Error handling
export {
  handleError,
  withErrorHandling,
  handleValidationErrors,
  isSupabaseError,
} from './errorHandler'
export type { ErrorHandlerOptions, ErrorHandlingResult } from './errorHandler'

// Excel export
export {
  exportToExcel,
  exportToCSV,
  exportMultipleSheets,
} from './excelExport'
export type { ExcelColumn, ExcelExportOptions } from './excelExport'

// PDF generation
export {
  generateInvoice,
  generateReceipt,
  generateReport,
  formatCurrency,
  formatDate,
  isPDFAvailable,
} from './pdfGenerator'
export type {
  InvoiceData,
  InvoiceItem,
  CustomerInfo,
  OrganizationInfo,
  PDFOptions,
} from './pdfGenerator'

// Re-export existing utilities if any
export * from './utils'
