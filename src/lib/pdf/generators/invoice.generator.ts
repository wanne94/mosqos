/**
 * Invoice PDF Generator
 */

import { jsPDF } from 'jspdf';
import type { InvoiceData, PDFHeaderConfig } from '../types';
import {
  createPDFDocument,
  addHeader,
  addFooter,
  addTitle,
  addKeyValueSection,
  addTable,
  addTextBlock,
  formatCurrency,
  formatDate,
  savePDF,
  previewPDF,
} from '../pdf-utils';

export interface GenerateInvoiceOptions {
  header: PDFHeaderConfig;
  invoice: InvoiceData;
  language?: 'en' | 'ar' | 'tr';
  action?: 'download' | 'preview';
}

/**
 * Generate a donation invoice/receipt PDF
 */
export function generateDonationInvoice(options: GenerateInvoiceOptions): void {
  const { header, invoice, language = 'en', action = 'download' } = options;

  // Create document
  const doc = createPDFDocument({
    metadata: {
      title: `Donation Receipt - ${invoice.invoiceNumber}`,
      subject: 'Donation Receipt',
      author: header.organizationName,
    },
    language,
    isRTL: language === 'ar',
  });

  let currentY = 15;

  // Add organization header
  currentY = addHeader(doc, header, currentY);
  currentY += 5;

  // Add title
  const titles: Record<string, string> = {
    en: 'Donation Receipt',
    ar: 'إيصال التبرع',
    tr: 'Bağış Makbuzu',
  };
  currentY = addTitle(doc, titles[language] || titles.en, undefined, currentY);
  currentY += 5;

  // Receipt details section
  const receiptLabels: Record<string, Record<string, string>> = {
    en: {
      receiptNumber: 'Receipt Number',
      date: 'Date',
      paymentMethod: 'Payment Method',
    },
    ar: {
      receiptNumber: 'رقم الإيصال',
      date: 'التاريخ',
      paymentMethod: 'طريقة الدفع',
    },
    tr: {
      receiptNumber: 'Makbuz Numarası',
      date: 'Tarih',
      paymentMethod: 'Ödeme Yöntemi',
    },
  };

  const labels = receiptLabels[language] || receiptLabels.en;

  currentY = addKeyValueSection(
    doc,
    [
      { label: labels.receiptNumber, value: invoice.invoiceNumber },
      { label: labels.date, value: formatDate(invoice.date) },
      ...(invoice.paymentMethod
        ? [{ label: labels.paymentMethod, value: invoice.paymentMethod }]
        : []),
    ],
    currentY,
    { columns: 2, labelWidth: 45 }
  );

  currentY += 5;

  // Donor information section
  const donorLabels: Record<string, Record<string, string>> = {
    en: {
      donorInfo: 'Donor Information',
      name: 'Name',
      email: 'Email',
      phone: 'Phone',
      address: 'Address',
    },
    ar: {
      donorInfo: 'معلومات المتبرع',
      name: 'الاسم',
      email: 'البريد الإلكتروني',
      phone: 'الهاتف',
      address: 'العنوان',
    },
    tr: {
      donorInfo: 'Bağışçı Bilgileri',
      name: 'Ad Soyad',
      email: 'E-posta',
      phone: 'Telefon',
      address: 'Adres',
    },
  };

  const dLabels = donorLabels[language] || donorLabels.en;

  // Section header
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(dLabels.donorInfo, 15, currentY);
  currentY += 6;

  const donorData: Array<{ label: string; value: string }> = [
    { label: dLabels.name, value: invoice.donor.name },
  ];
  if (invoice.donor.email) {
    donorData.push({ label: dLabels.email, value: invoice.donor.email });
  }
  if (invoice.donor.phone) {
    donorData.push({ label: dLabels.phone, value: invoice.donor.phone });
  }
  if (invoice.donor.address) {
    donorData.push({ label: dLabels.address, value: invoice.donor.address });
  }

  currentY = addKeyValueSection(doc, donorData, currentY, { labelWidth: 35 });
  currentY += 10;

  // Donation items table
  const tableHeaders: Record<string, Record<string, string>> = {
    en: {
      description: 'Description',
      fund: 'Fund',
      type: 'Type',
      amount: 'Amount',
    },
    ar: {
      description: 'الوصف',
      fund: 'الصندوق',
      type: 'النوع',
      amount: 'المبلغ',
    },
    tr: {
      description: 'Açıklama',
      fund: 'Fon',
      type: 'Tür',
      amount: 'Tutar',
    },
  };

  const tHeaders = tableHeaders[language] || tableHeaders.en;
  const zakatLabel = language === 'ar' ? 'زكاة' : language === 'tr' ? 'Zekat' : 'Zakat';
  const sadaqahLabel = language === 'ar' ? 'صدقة' : language === 'tr' ? 'Sadaka' : 'Sadaqah';

  const tableData = invoice.items.map((item) => ({
    description: item.description,
    fund: item.fund || '-',
    type: item.isZakat ? zakatLabel : sadaqahLabel,
    amount: formatCurrency(item.amount, invoice.currency),
  }));

  currentY = addTable(
    doc,
    [
      { header: tHeaders.description, dataKey: 'description', width: 70 },
      { header: tHeaders.fund, dataKey: 'fund', width: 40 },
      { header: tHeaders.type, dataKey: 'type', width: 30, align: 'center' },
      { header: tHeaders.amount, dataKey: 'amount', width: 35, align: 'right' },
    ],
    tableData,
    currentY,
    { alternateRowColors: true }
  );

  currentY += 5;

  // Total
  const totalLabels: Record<string, string> = {
    en: 'Total Amount',
    ar: 'المبلغ الإجمالي',
    tr: 'Toplam Tutar',
  };

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  const totalText = `${totalLabels[language] || totalLabels.en}: ${formatCurrency(invoice.total, invoice.currency)}`;
  const pageWidth = doc.internal.pageSize.getWidth();
  doc.text(totalText, pageWidth - 15, currentY, { align: 'right' });
  currentY += 15;

  // Tax deductible notice
  if (invoice.taxDeductible) {
    const taxNotices: Record<string, string> = {
      en: 'This donation is tax-deductible to the extent allowed by law. Please keep this receipt for your tax records.',
      ar: 'هذا التبرع معفى من الضرائب بالقدر الذي يسمح به القانون. يرجى الاحتفاظ بهذا الإيصال لسجلاتك الضريبية.',
      tr: 'Bu bağış, yasaların izin verdiği ölçüde vergiden düşülebilir. Lütfen bu makbuzu vergi kayıtlarınız için saklayın.',
    };

    doc.setDrawColor(34, 139, 34);
    doc.setFillColor(240, 255, 240);
    doc.roundedRect(15, currentY, pageWidth - 30, 20, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(34, 100, 34);
    const notice = taxNotices[language] || taxNotices.en;
    const lines = doc.splitTextToSize(notice, pageWidth - 40);
    doc.text(lines, 20, currentY + 6);
    doc.setTextColor(0, 0, 0);
    currentY += 25;
  }

  // Notes
  if (invoice.notes) {
    const notesLabels: Record<string, string> = {
      en: 'Notes',
      ar: 'ملاحظات',
      tr: 'Notlar',
    };

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`${notesLabels[language] || notesLabels.en}:`, 15, currentY);
    currentY += 5;

    currentY = addTextBlock(doc, invoice.notes, currentY, { fontSize: 9 });
  }

  // Thank you message
  currentY += 10;
  const thankYouMessages: Record<string, string> = {
    en: 'Thank you for your generous donation. May Allah reward you abundantly.',
    ar: 'شكراً لتبرعكم الكريم. جزاكم الله خيراً.',
    tr: 'Cömert bağışınız için teşekkür ederiz. Allah sizden razı olsun.',
  };

  doc.setFontSize(11);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(80, 80, 80);
  doc.text(thankYouMessages[language] || thankYouMessages.en, pageWidth / 2, currentY, {
    align: 'center',
  });
  doc.setTextColor(0, 0, 0);

  // Add footer
  addFooter(doc, {
    text: header.organizationName,
    showPageNumbers: true,
    showDate: true,
  });

  // Output
  if (action === 'preview') {
    previewPDF(doc);
  } else {
    savePDF(doc, `donation-receipt-${invoice.invoiceNumber}`);
  }
}

/**
 * Generate batch donation receipts for year-end statements
 */
export function generateYearEndStatement(
  header: PDFHeaderConfig,
  donorInfo: {
    name: string;
    email?: string;
    address?: string;
  },
  donations: Array<{
    date: Date;
    amount: number;
    fund?: string;
    receiptNumber: string;
    isZakat?: boolean;
  }>,
  year: number,
  currency: string = 'USD',
  language: 'en' | 'ar' | 'tr' = 'en'
): jsPDF {
  const doc = createPDFDocument({
    metadata: {
      title: `Year-End Donation Statement ${year}`,
      subject: 'Annual Donation Summary',
      author: header.organizationName,
    },
    language,
  });

  let currentY = 15;

  // Add header
  currentY = addHeader(doc, header, currentY);
  currentY += 5;

  // Title
  const titles: Record<string, string> = {
    en: `Year-End Donation Statement - ${year}`,
    ar: `بيان التبرعات السنوي - ${year}`,
    tr: `Yıl Sonu Bağış Beyanı - ${year}`,
  };
  currentY = addTitle(doc, titles[language] || titles.en, undefined, currentY);
  currentY += 10;

  // Donor info
  const donorLabels: Record<string, string> = {
    en: 'Donor',
    ar: 'المتبرع',
    tr: 'Bağışçı',
  };

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text(`${donorLabels[language]}: ${donorInfo.name}`, 15, currentY);
  currentY += 5;

  if (donorInfo.address) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(donorInfo.address, 15, currentY);
    currentY += 5;
  }

  currentY += 10;

  // Donations table
  const tableHeaders: Record<string, Record<string, string>> = {
    en: { date: 'Date', receipt: 'Receipt #', fund: 'Fund', type: 'Type', amount: 'Amount' },
    ar: { date: 'التاريخ', receipt: 'رقم الإيصال', fund: 'الصندوق', type: 'النوع', amount: 'المبلغ' },
    tr: { date: 'Tarih', receipt: 'Makbuz #', fund: 'Fon', type: 'Tür', amount: 'Tutar' },
  };

  const tHeaders = tableHeaders[language] || tableHeaders.en;
  const zakatLabel = language === 'ar' ? 'زكاة' : language === 'tr' ? 'Zekat' : 'Zakat';
  const sadaqahLabel = language === 'ar' ? 'صدقة' : language === 'tr' ? 'Sadaka' : 'Sadaqah';

  const tableData = donations.map((d) => ({
    date: formatDate(d.date),
    receipt: d.receiptNumber,
    fund: d.fund || '-',
    type: d.isZakat ? zakatLabel : sadaqahLabel,
    amount: formatCurrency(d.amount, currency),
  }));

  const total = donations.reduce((sum, d) => sum + d.amount, 0);

  currentY = addTable(
    doc,
    [
      { header: tHeaders.date, dataKey: 'date', width: 35 },
      { header: tHeaders.receipt, dataKey: 'receipt', width: 35 },
      { header: tHeaders.fund, dataKey: 'fund', width: 40 },
      { header: tHeaders.type, dataKey: 'type', width: 25, align: 'center' },
      { header: tHeaders.amount, dataKey: 'amount', width: 35, align: 'right' },
    ],
    tableData,
    currentY,
    {
      showTotals: true,
      totals: { amount: formatCurrency(total, currency) },
      alternateRowColors: true,
    }
  );

  currentY += 15;

  // Tax notice
  const taxNotices: Record<string, string> = {
    en: `This letter certifies that ${donorInfo.name} made the above charitable contributions to ${header.organizationName} during the calendar year ${year}. No goods or services were provided in exchange for these contributions. ${header.organizationName} is a 501(c)(3) tax-exempt organization. Please retain this statement for your tax records.`,
    ar: `تشهد هذه الرسالة أن ${donorInfo.name} قدم المساهمات الخيرية المذكورة أعلاه إلى ${header.organizationName} خلال السنة التقويمية ${year}. لم يتم تقديم أي سلع أو خدمات مقابل هذه المساهمات. يرجى الاحتفاظ بهذا البيان لسجلاتك الضريبية.`,
    tr: `Bu mektup, ${donorInfo.name}'ın ${year} takvim yılı boyunca ${header.organizationName}'a yukarıda belirtilen hayır katkılarını yaptığını onaylar. Bu katkılar karşılığında herhangi bir mal veya hizmet sağlanmamıştır. Lütfen bu beyanı vergi kayıtlarınız için saklayın.`,
  };

  currentY = addTextBlock(doc, taxNotices[language] || taxNotices.en, currentY, {
    fontSize: 9,
  });

  // Footer
  addFooter(doc, {
    text: header.organizationName,
    showPageNumbers: true,
    showDate: true,
  });

  return doc;
}
