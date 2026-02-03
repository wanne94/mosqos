/**
 * PDF Utility Functions
 */

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type {
  PDFDocumentConfig,
  PDFHeaderConfig,
  PDFFooterConfig,
  PDFTableColumn,
} from './types';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: typeof autoTable;
    lastAutoTable: {
      finalY: number;
    };
  }
}

/**
 * Create a new PDF document with standard configuration
 */
export function createPDFDocument(config: PDFDocumentConfig): jsPDF {
  const doc = new jsPDF({
    orientation: config.orientation || 'portrait',
    unit: 'mm',
    format: config.pageSize || 'a4',
  });

  // Set document metadata
  doc.setProperties({
    title: config.metadata.title,
    subject: config.metadata.subject || '',
    author: config.metadata.author || 'MosqOS',
    creator: config.metadata.creator || 'MosqOS',
  });

  return doc;
}

/**
 * Add organization header to PDF
 */
export function addHeader(
  doc: jsPDF,
  config: PDFHeaderConfig,
  y: number = 15
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = y;

  // Add logo if provided
  if (config.organizationLogo) {
    try {
      doc.addImage(config.organizationLogo, 'PNG', 15, currentY, 25, 25);
      currentY += 5;
    } catch {
      // Skip logo if invalid
    }
  }

  // Organization name
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  const nameX = config.organizationLogo ? 45 : 15;
  doc.text(config.organizationName, nameX, currentY + 5);
  currentY += 10;

  // Organization details
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);

  const details: string[] = [];
  if (config.organizationAddress) details.push(config.organizationAddress);
  if (config.organizationPhone) details.push(`Tel: ${config.organizationPhone}`);
  if (config.organizationEmail) details.push(config.organizationEmail);
  if (config.organizationWebsite) details.push(config.organizationWebsite);

  details.forEach((detail, index) => {
    doc.text(detail, nameX, currentY + 5 + index * 4);
  });

  currentY += details.length * 4 + 10;

  // Reset text color
  doc.setTextColor(0, 0, 0);

  // Add horizontal line
  doc.setDrawColor(200, 200, 200);
  doc.setLineWidth(0.5);
  doc.line(15, currentY, pageWidth - 15, currentY);

  return currentY + 5;
}

/**
 * Add footer to PDF pages
 */
export function addFooter(doc: jsPDF, config: PDFFooterConfig): void {
  const pageCount = doc.internal.pages.length - 1;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(128, 128, 128);

    const footerY = pageHeight - 10;

    // Custom text
    if (config.text) {
      doc.text(config.text, 15, footerY);
    }

    // Page numbers
    if (config.showPageNumbers) {
      const pageText = `Page ${i} of ${pageCount}`;
      const textWidth = doc.getTextWidth(pageText);
      doc.text(pageText, pageWidth - 15 - textWidth, footerY);
    }

    // Date
    if (config.showDate) {
      const dateText = `Generated: ${new Date().toLocaleDateString()}`;
      const centerX = pageWidth / 2 - doc.getTextWidth(dateText) / 2;
      doc.text(dateText, centerX, footerY);
    }
  }

  // Reset text color
  doc.setTextColor(0, 0, 0);
}

/**
 * Add a title section
 */
export function addTitle(
  doc: jsPDF,
  title: string,
  subtitle?: string,
  y: number = 40
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = y;

  // Main title
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 8;

  // Subtitle
  if (subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    doc.text(subtitle, pageWidth / 2, currentY, { align: 'center' });
    doc.setTextColor(0, 0, 0);
    currentY += 6;
  }

  return currentY + 5;
}

/**
 * Add a data table to PDF
 */
export function addTable(
  doc: jsPDF,
  columns: PDFTableColumn[],
  data: Record<string, unknown>[],
  startY: number,
  options?: {
    showTotals?: boolean;
    totals?: Record<string, string | number>;
    alternateRowColors?: boolean;
  }
): number {
  const tableColumns = columns.map((col) => ({
    header: col.header,
    dataKey: col.dataKey,
  }));

  const tableData = data.map((row) => {
    const rowData: Record<string, unknown> = {};
    columns.forEach((col) => {
      rowData[col.dataKey] = row[col.dataKey] ?? '';
    });
    return rowData;
  });

  // Add totals row if needed
  if (options?.showTotals && options.totals) {
    const totalsRow: Record<string, unknown> = {};
    columns.forEach((col, index) => {
      if (index === 0) {
        totalsRow[col.dataKey] = 'TOTAL';
      } else {
        totalsRow[col.dataKey] = options.totals?.[col.dataKey] ?? '';
      }
    });
    tableData.push(totalsRow);
  }

  autoTable(doc, {
    columns: tableColumns,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    body: tableData as any,
    startY,
    theme: 'striped',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 10,
    },
    bodyStyles: {
      fontSize: 9,
    },
    alternateRowStyles: options?.alternateRowColors
      ? { fillColor: [245, 245, 245] }
      : undefined,
    columnStyles: columns.reduce(
      (acc, col, index) => {
        acc[index] = {
          cellWidth: col.width || 'auto',
          halign: (col.align || 'left') as 'left' | 'center' | 'right',
        };
        return acc;
      },
      {} as Record<number, { cellWidth: number | 'auto'; halign: 'left' | 'center' | 'right' }>
    ),
    margin: { left: 15, right: 15 },
    didDrawPage: () => {
      // Can add header/footer on each page if needed
    },
  });

  return doc.lastAutoTable?.finalY || startY + 50;
}

/**
 * Add key-value pairs section
 */
export function addKeyValueSection(
  doc: jsPDF,
  data: Array<{ label: string; value: string }>,
  startY: number,
  options?: {
    columns?: 1 | 2;
    labelWidth?: number;
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const labelWidth = options?.labelWidth || 50;
  const columns = options?.columns || 1;
  const columnWidth = (pageWidth - 30) / columns;
  let currentY = startY;

  doc.setFontSize(10);

  data.forEach((item, index) => {
    const column = columns === 2 ? index % 2 : 0;
    const x = 15 + column * columnWidth;

    if (columns === 2 && column === 0 && index > 0) {
      // Don't increment Y for first column after first row
    } else if (columns === 1 || column === 0) {
      currentY += index === 0 ? 0 : 6;
    }

    // Label
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.label}:`, x, currentY);

    // Value
    doc.setFont('helvetica', 'normal');
    doc.text(item.value, x + labelWidth, currentY);
  });

  return currentY + 10;
}

/**
 * Add a text block with word wrapping
 */
export function addTextBlock(
  doc: jsPDF,
  text: string,
  startY: number,
  options?: {
    fontSize?: number;
    maxWidth?: number;
    align?: 'left' | 'center' | 'right' | 'justify';
    fontStyle?: 'normal' | 'bold' | 'italic';
  }
): number {
  const pageWidth = doc.internal.pageSize.getWidth();
  const maxWidth = options?.maxWidth || pageWidth - 30;
  const fontSize = options?.fontSize || 10;

  doc.setFontSize(fontSize);
  doc.setFont('helvetica', options?.fontStyle || 'normal');

  const lines = doc.splitTextToSize(text, maxWidth);
  doc.text(lines, 15, startY, { align: options?.align || 'left' });

  return startY + lines.length * (fontSize * 0.4) + 5;
}

/**
 * Format currency for display
 */
export function formatCurrency(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date for display
 */
export function formatDate(date: Date, locale: string = 'en-US'): string {
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date);
}

/**
 * Save PDF document
 */
export function savePDF(doc: jsPDF, filename: string): void {
  doc.save(`${filename}.pdf`);
}

/**
 * Get PDF as blob for preview or upload
 */
export function getPDFBlob(doc: jsPDF): Blob {
  return doc.output('blob');
}

/**
 * Get PDF as base64 string
 */
export function getPDFBase64(doc: jsPDF): string {
  return doc.output('datauristring');
}

/**
 * Open PDF in new window for preview
 */
export function previewPDF(doc: jsPDF): void {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
}
