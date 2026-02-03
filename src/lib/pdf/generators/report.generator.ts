/**
 * Report PDF Generator
 */

import { jsPDF } from 'jspdf';
import type { ReportData, PDFHeaderConfig, PDFTableColumn } from '../types';
import {
  createPDFDocument,
  addHeader,
  addFooter,
  addTitle,
  addTable,
  addKeyValueSection,
  formatDate,
  savePDF,
  previewPDF,
  getPDFBlob,
} from '../pdf-utils';

export interface GenerateReportOptions {
  header: PDFHeaderConfig;
  report: ReportData;
  language?: 'en' | 'ar' | 'tr';
  action?: 'download' | 'preview' | 'blob';
}

/**
 * Generate a data report PDF
 */
export function generateReport(options: GenerateReportOptions): jsPDF | Blob | void {
  const { header, report, language = 'en', action = 'download' } = options;

  // Determine orientation based on column count
  const orientation = report.columns.length > 5 ? 'landscape' : 'portrait';

  const doc = createPDFDocument({
    metadata: {
      title: report.title,
      subject: report.subtitle || 'Report',
      author: header.organizationName,
    },
    orientation,
    language,
  });

  let currentY = 15;

  // Add organization header
  currentY = addHeader(doc, header, currentY);
  currentY += 5;

  // Add report title
  let subtitle = report.subtitle;
  if (report.dateRange) {
    const fromDate = formatDate(report.dateRange.from);
    const toDate = formatDate(report.dateRange.to);
    subtitle = `${subtitle ? subtitle + ' | ' : ''}${fromDate} - ${toDate}`;
  }

  currentY = addTitle(doc, report.title, subtitle, currentY);
  currentY += 10;

  // Add data table
  currentY = addTable(
    doc,
    report.columns,
    report.data as Record<string, unknown>[],
    currentY,
    { alternateRowColors: true }
  );

  currentY += 10;

  // Add summary section if provided
  if (report.summary && Object.keys(report.summary).length > 0) {
    const summaryLabels: Record<string, string> = {
      en: 'Summary',
      ar: 'ملخص',
      tr: 'Özet',
    };

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(summaryLabels[language] || summaryLabels.en, 15, currentY);
    currentY += 6;

    const summaryData = Object.entries(report.summary).map(([label, value]) => ({
      label,
      value: String(value),
    }));

    currentY = addKeyValueSection(doc, summaryData, currentY, { columns: 2 });
  }

  // Add footer
  addFooter(doc, {
    text: header.organizationName,
    showPageNumbers: true,
    showDate: true,
  });

  // Output
  if (action === 'preview') {
    previewPDF(doc);
  } else if (action === 'blob') {
    return getPDFBlob(doc);
  } else {
    const filename = report.title.toLowerCase().replace(/\s+/g, '-');
    savePDF(doc, filename);
  }
}

/**
 * Generate a financial summary report
 */
export function generateFinancialReport(
  header: PDFHeaderConfig,
  data: {
    title: string;
    period: { from: Date; to: Date };
    income: Array<{ category: string; amount: number; count: number }>;
    expenses: Array<{ category: string; amount: number; count: number }>;
    currency: string;
  },
  language: 'en' | 'ar' | 'tr' = 'en',
  action: 'download' | 'preview' = 'download'
): void {
  const doc = createPDFDocument({
    metadata: {
      title: data.title,
      subject: 'Financial Report',
      author: header.organizationName,
    },
    language,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  let currentY = 15;

  // Header
  currentY = addHeader(doc, header, currentY);
  currentY += 5;

  // Title
  const periodStr = `${formatDate(data.period.from)} - ${formatDate(data.period.to)}`;
  currentY = addTitle(doc, data.title, periodStr, currentY);
  currentY += 10;

  const labels: Record<string, Record<string, string>> = {
    en: {
      income: 'Income',
      expenses: 'Expenses',
      category: 'Category',
      amount: 'Amount',
      count: 'Transactions',
      total: 'Total',
      netIncome: 'Net Income',
    },
    ar: {
      income: 'الإيرادات',
      expenses: 'المصروفات',
      category: 'الفئة',
      amount: 'المبلغ',
      count: 'المعاملات',
      total: 'الإجمالي',
      netIncome: 'صافي الدخل',
    },
    tr: {
      income: 'Gelir',
      expenses: 'Giderler',
      category: 'Kategori',
      amount: 'Tutar',
      count: 'İşlem Sayısı',
      total: 'Toplam',
      netIncome: 'Net Gelir',
    },
  };

  const l = labels[language] || labels.en;

  const formatAmount = (amount: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: data.currency,
    }).format(amount);

  // Income section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(34, 139, 34);
  doc.text(l.income, 15, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 8;

  const incomeColumns: PDFTableColumn[] = [
    { header: l.category, dataKey: 'category', width: 80 },
    { header: l.count, dataKey: 'count', width: 40, align: 'center' },
    { header: l.amount, dataKey: 'amount', width: 50, align: 'right' },
  ];

  const incomeData = data.income.map((item) => ({
    category: item.category,
    count: item.count,
    amount: formatAmount(item.amount),
  }));

  const totalIncome = data.income.reduce((sum, item) => sum + item.amount, 0);

  currentY = addTable(doc, incomeColumns, incomeData, currentY, {
    showTotals: true,
    totals: {
      category: l.total,
      count: data.income.reduce((sum, item) => sum + item.count, 0),
      amount: formatAmount(totalIncome),
    },
  });

  currentY += 15;

  // Expenses section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 53, 69);
  doc.text(l.expenses, 15, currentY);
  doc.setTextColor(0, 0, 0);
  currentY += 8;

  const expenseData = data.expenses.map((item) => ({
    category: item.category,
    count: item.count,
    amount: formatAmount(item.amount),
  }));

  const totalExpenses = data.expenses.reduce((sum, item) => sum + item.amount, 0);

  currentY = addTable(doc, incomeColumns, expenseData, currentY, {
    showTotals: true,
    totals: {
      category: l.total,
      count: data.expenses.reduce((sum, item) => sum + item.count, 0),
      amount: formatAmount(totalExpenses),
    },
  });

  currentY += 20;

  // Net income box
  const netIncome = totalIncome - totalExpenses;
  const boxColor = netIncome >= 0 ? [240, 255, 240] : [255, 240, 240];
  const textColor = netIncome >= 0 ? [34, 100, 34] : [139, 34, 34];

  doc.setFillColor(boxColor[0], boxColor[1], boxColor[2]);
  doc.setDrawColor(150, 150, 150);
  doc.roundedRect(pageWidth / 2 - 60, currentY, 120, 25, 3, 3, 'FD');

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(textColor[0], textColor[1], textColor[2]);
  doc.text(l.netIncome, pageWidth / 2, currentY + 8, { align: 'center' });

  doc.setFontSize(16);
  doc.text(formatAmount(netIncome), pageWidth / 2, currentY + 18, { align: 'center' });

  doc.setTextColor(0, 0, 0);

  // Footer
  addFooter(doc, {
    text: header.organizationName,
    showPageNumbers: true,
    showDate: true,
  });

  // Output
  if (action === 'preview') {
    previewPDF(doc);
  } else {
    const filename = data.title.toLowerCase().replace(/\s+/g, '-');
    savePDF(doc, filename);
  }
}

/**
 * Generate attendance report
 */
export function generateAttendanceReport(
  header: PDFHeaderConfig,
  data: {
    title: string;
    className: string;
    period: { from: Date; to: Date };
    students: Array<{
      name: string;
      present: number;
      absent: number;
      late: number;
      total: number;
      percentage: number;
    }>;
  },
  language: 'en' | 'ar' | 'tr' = 'en',
  action: 'download' | 'preview' = 'download'
): void {
  const doc = createPDFDocument({
    metadata: {
      title: data.title,
      subject: 'Attendance Report',
      author: header.organizationName,
    },
    language,
  });

  let currentY = 15;

  // Header
  currentY = addHeader(doc, header, currentY);
  currentY += 5;

  // Title
  const periodStr = `${formatDate(data.period.from)} - ${formatDate(data.period.to)}`;
  currentY = addTitle(doc, data.title, `${data.className} | ${periodStr}`, currentY);
  currentY += 10;

  const labels: Record<string, Record<string, string>> = {
    en: {
      student: 'Student',
      present: 'Present',
      absent: 'Absent',
      late: 'Late',
      total: 'Total Classes',
      percentage: 'Attendance %',
    },
    ar: {
      student: 'الطالب',
      present: 'حاضر',
      absent: 'غائب',
      late: 'متأخر',
      total: 'إجمالي الحصص',
      percentage: 'نسبة الحضور',
    },
    tr: {
      student: 'Öğrenci',
      present: 'Mevcut',
      absent: 'Devamsız',
      late: 'Geç',
      total: 'Toplam Ders',
      percentage: 'Devam %',
    },
  };

  const l = labels[language] || labels.en;

  const columns: PDFTableColumn[] = [
    { header: l.student, dataKey: 'name', width: 50 },
    { header: l.present, dataKey: 'present', width: 25, align: 'center' },
    { header: l.absent, dataKey: 'absent', width: 25, align: 'center' },
    { header: l.late, dataKey: 'late', width: 25, align: 'center' },
    { header: l.total, dataKey: 'total', width: 30, align: 'center' },
    { header: l.percentage, dataKey: 'percentage', width: 30, align: 'right' },
  ];

  const tableData = data.students.map((s) => ({
    name: s.name,
    present: s.present,
    absent: s.absent,
    late: s.late,
    total: s.total,
    percentage: `${s.percentage.toFixed(1)}%`,
  }));

  currentY = addTable(doc, columns, tableData, currentY, { alternateRowColors: true });

  // Footer
  addFooter(doc, {
    text: header.organizationName,
    showPageNumbers: true,
    showDate: true,
  });

  // Output
  if (action === 'preview') {
    previewPDF(doc);
  } else {
    savePDF(doc, `attendance-${data.className.toLowerCase().replace(/\s+/g, '-')}`);
  }
}

/**
 * Generate member list report
 */
export function generateMemberListReport(
  header: PDFHeaderConfig,
  data: {
    title: string;
    members: Array<{
      name: string;
      email?: string;
      phone?: string;
      household?: string;
      joinDate?: Date;
      status?: string;
    }>;
    filters?: string;
  },
  language: 'en' | 'ar' | 'tr' = 'en',
  action: 'download' | 'preview' = 'download'
): void {
  const doc = createPDFDocument({
    metadata: {
      title: data.title,
      subject: 'Member List',
      author: header.organizationName,
    },
    orientation: 'landscape',
    language,
  });

  let currentY = 15;

  // Header
  currentY = addHeader(doc, header, currentY);
  currentY += 5;

  // Title
  currentY = addTitle(doc, data.title, data.filters, currentY);
  currentY += 5;

  // Member count
  const countLabels: Record<string, string> = {
    en: 'Total Members',
    ar: 'إجمالي الأعضاء',
    tr: 'Toplam Üye',
  };

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${countLabels[language]}: ${data.members.length}`, 15, currentY);
  currentY += 8;

  const labels: Record<string, Record<string, string>> = {
    en: {
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      household: 'Household',
      joinDate: 'Join Date',
      status: 'Status',
    },
    ar: {
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      household: 'الأسرة',
      joinDate: 'تاريخ الانضمام',
      status: 'الحالة',
    },
    tr: {
      name: 'Ad Soyad',
      email: 'E-posta',
      phone: 'Telefon',
      household: 'Hane',
      joinDate: 'Katılım Tarihi',
      status: 'Durum',
    },
  };

  const l = labels[language] || labels.en;

  const columns: PDFTableColumn[] = [
    { header: l.name, dataKey: 'name', width: 45 },
    { header: l.email, dataKey: 'email', width: 55 },
    { header: l.phone, dataKey: 'phone', width: 35 },
    { header: l.household, dataKey: 'household', width: 40 },
    { header: l.joinDate, dataKey: 'joinDate', width: 30, align: 'center' },
    { header: l.status, dataKey: 'status', width: 25, align: 'center' },
  ];

  const tableData = data.members.map((m) => ({
    name: m.name,
    email: m.email || '-',
    phone: m.phone || '-',
    household: m.household || '-',
    joinDate: m.joinDate ? formatDate(m.joinDate) : '-',
    status: m.status || '-',
  }));

  currentY = addTable(doc, columns, tableData, currentY, { alternateRowColors: true });

  // Footer
  addFooter(doc, {
    text: header.organizationName,
    showPageNumbers: true,
    showDate: true,
  });

  // Output
  if (action === 'preview') {
    previewPDF(doc);
  } else {
    savePDF(doc, 'member-list');
  }
}
