/**
 * Certificate PDF Generator
 */

import { jsPDF } from 'jspdf';
import type { CertificateData, PDFHeaderConfig } from '../types';
import {
  createPDFDocument,
  addFooter,
  formatDate,
  savePDF,
  previewPDF,
} from '../pdf-utils';

export interface GenerateCertificateOptions {
  header: PDFHeaderConfig;
  certificate: CertificateData;
  language?: 'en' | 'ar' | 'tr';
  action?: 'download' | 'preview';
}

/**
 * Certificate titles by type and language
 */
const CERTIFICATE_TITLES: Record<string, Record<string, string>> = {
  nikah: {
    en: 'Marriage Certificate',
    ar: 'شهادة الزواج',
    tr: 'Nikah Belgesi',
  },
  janazah: {
    en: 'Funeral Service Certificate',
    ar: 'شهادة صلاة الجنازة',
    tr: 'Cenaze Namazı Belgesi',
  },
  shahada: {
    en: 'Declaration of Faith Certificate',
    ar: 'شهادة إعلان الإسلام',
    tr: 'Kelime-i Şehadet Belgesi',
  },
  education: {
    en: 'Certificate of Completion',
    ar: 'شهادة إتمام',
    tr: 'Tamamlama Sertifikası',
  },
  membership: {
    en: 'Membership Certificate',
    ar: 'شهادة العضوية',
    tr: 'Üyelik Belgesi',
  },
};

/**
 * Generate an Islamic service certificate
 */
export function generateCertificate(options: GenerateCertificateOptions): void {
  const { header, certificate, language = 'en', action = 'download' } = options;

  // Create document in landscape for certificates
  const doc = createPDFDocument({
    metadata: {
      title: `${certificate.type} Certificate - ${certificate.certificateNumber}`,
      subject: CERTIFICATE_TITLES[certificate.type]?.[language] || 'Certificate',
      author: header.organizationName,
    },
    orientation: 'landscape',
    language,
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Add decorative border
  addDecorativeBorder(doc, pageWidth, pageHeight);

  let currentY = 25;

  // Organization logo and name
  if (header.organizationLogo) {
    try {
      const logoSize = 20;
      doc.addImage(
        header.organizationLogo,
        'PNG',
        pageWidth / 2 - logoSize / 2,
        currentY,
        logoSize,
        logoSize
      );
      currentY += logoSize + 5;
    } catch {
      // Skip logo if invalid
    }
  }

  // Organization name
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(70, 70, 70);
  doc.text(header.organizationName, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Certificate title
  const title = CERTIFICATE_TITLES[certificate.type]?.[language] || 'Certificate';
  doc.setFontSize(28);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(title, pageWidth / 2, currentY, { align: 'center' });
  currentY += 15;

  // Certificate number
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  const certNumLabel = language === 'ar' ? 'رقم الشهادة' : language === 'tr' ? 'Belge No' : 'Certificate No';
  doc.text(`${certNumLabel}: ${certificate.certificateNumber}`, pageWidth / 2, currentY, {
    align: 'center',
  });
  currentY += 15;

  // Main content based on certificate type
  doc.setTextColor(0, 0, 0);

  switch (certificate.type) {
    case 'nikah':
      currentY = addNikahContent(doc, certificate, header, language, currentY, pageWidth);
      break;
    case 'janazah':
      currentY = addJanazahContent(doc, certificate, header, language, currentY, pageWidth);
      break;
    case 'shahada':
      currentY = addShahadaContent(doc, certificate, header, language, currentY, pageWidth);
      break;
    case 'education':
      currentY = addEducationContent(doc, certificate, header, language, currentY, pageWidth);
      break;
    default:
      currentY = addGenericContent(doc, certificate, header, language, currentY, pageWidth);
  }

  // Date section
  currentY += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');

  const dateLabel = language === 'ar' ? 'التاريخ' : language === 'tr' ? 'Tarih' : 'Date';
  const dateStr = formatDate(certificate.date);
  let dateText = `${dateLabel}: ${dateStr}`;

  if (certificate.hijriDate) {
    const hijriLabel = language === 'ar' ? 'التاريخ الهجري' : language === 'tr' ? 'Hicri Tarih' : 'Hijri Date';
    dateText += ` | ${hijriLabel}: ${certificate.hijriDate}`;
  }

  doc.text(dateText, pageWidth / 2, currentY, { align: 'center' });
  currentY += 20;

  // Signatures section
  addSignatureSection(doc, certificate, header, language, pageHeight, pageWidth);

  // Footer
  addFooter(doc, {
    text: header.organizationName,
    showDate: false,
    showPageNumbers: false,
  });

  // Output
  if (action === 'preview') {
    previewPDF(doc);
  } else {
    savePDF(doc, `${certificate.type}-certificate-${certificate.certificateNumber}`);
  }
}

/**
 * Add decorative border to certificate
 */
function addDecorativeBorder(doc: jsPDF, pageWidth: number, pageHeight: number): void {
  // Outer border
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // Inner border
  doc.setDrawColor(189, 195, 199);
  doc.setLineWidth(0.5);
  doc.rect(15, 15, pageWidth - 30, pageHeight - 30);

  // Corner decorations
  const cornerSize = 15;
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(1);

  // Top-left
  doc.line(10, 10 + cornerSize, 10, 10);
  doc.line(10, 10, 10 + cornerSize, 10);

  // Top-right
  doc.line(pageWidth - 10 - cornerSize, 10, pageWidth - 10, 10);
  doc.line(pageWidth - 10, 10, pageWidth - 10, 10 + cornerSize);

  // Bottom-left
  doc.line(10, pageHeight - 10 - cornerSize, 10, pageHeight - 10);
  doc.line(10, pageHeight - 10, 10 + cornerSize, pageHeight - 10);

  // Bottom-right
  doc.line(pageWidth - 10 - cornerSize, pageHeight - 10, pageWidth - 10, pageHeight - 10);
  doc.line(pageWidth - 10, pageHeight - 10 - cornerSize, pageWidth - 10, pageHeight - 10);
}

/**
 * Add Nikah (Marriage) certificate content
 */
function addNikahContent(
  doc: jsPDF,
  cert: CertificateData,
  _header: PDFHeaderConfig,
  language: string,
  startY: number,
  pageWidth: number
): number {
  let y = startY;

  const texts: Record<string, Record<string, string>> = {
    en: {
      certify: 'This is to certify that the marriage between',
      and: 'and',
      solemnized: 'was solemnized in accordance with Islamic law',
      on: 'on',
    },
    ar: {
      certify: 'نشهد بأن الزواج بين',
      and: 'و',
      solemnized: 'تم عقده وفقاً للشريعة الإسلامية',
      on: 'بتاريخ',
    },
    tr: {
      certify: 'Aşağıda isimleri geçen çiftin nikahının',
      and: 've',
      solemnized: 'İslami usullere göre kıyıldığını tasdik ederiz',
      on: 'tarihinde',
    },
  };

  const t = texts[language] || texts.en;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(t.certify, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Groom name
  doc.setFontSize(20);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(cert.details.groomName || cert.recipientName, pageWidth / 2, y, { align: 'center' });
  y += 10;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(t.and, pageWidth / 2, y, { align: 'center' });
  y += 10;

  // Bride name
  doc.setFontSize(20);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(cert.details.brideName || '', pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(t.solemnized, pageWidth / 2, y, { align: 'center' });

  return y + 10;
}

/**
 * Add Janazah (Funeral) certificate content
 */
function addJanazahContent(
  doc: jsPDF,
  cert: CertificateData,
  _header: PDFHeaderConfig,
  language: string,
  startY: number,
  pageWidth: number
): number {
  let y = startY;

  const texts: Record<string, Record<string, string>> = {
    en: {
      certify: 'This is to certify that the funeral prayer (Salat al-Janazah) for',
      performed: 'was performed at our mosque',
      inna: 'Inna lillahi wa inna ilayhi rajiun',
    },
    ar: {
      certify: 'نشهد بأن صلاة الجنازة على',
      performed: 'قد أقيمت في مسجدنا',
      inna: 'إنا لله وإنا إليه راجعون',
    },
    tr: {
      certify: 'Aşağıda ismi geçen kişinin cenaze namazının',
      performed: 'camimizde kılındığını tasdik ederiz',
      inna: 'İnna lillahi ve inna ileyhi raciun',
    },
  };

  const t = texts[language] || texts.en;

  // Arabic Quran verse
  doc.setFontSize(16);
  doc.setFont('times', 'italic');
  doc.setTextColor(100, 100, 100);
  doc.text(t.inna, pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(t.certify, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Deceased name
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(cert.recipientName, pageWidth / 2, y, { align: 'center' });

  if (cert.recipientNameArabic) {
    y += 10;
    doc.setFontSize(18);
    doc.text(cert.recipientNameArabic, pageWidth / 2, y, { align: 'center' });
  }
  y += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(t.performed, pageWidth / 2, y, { align: 'center' });

  return y + 10;
}

/**
 * Add Shahada (Conversion) certificate content
 */
function addShahadaContent(
  doc: jsPDF,
  cert: CertificateData,
  _header: PDFHeaderConfig,
  language: string,
  startY: number,
  pageWidth: number
): number {
  let y = startY;

  const texts: Record<string, Record<string, string>> = {
    en: {
      certify: 'This is to certify that',
      declared: 'has declared the Shahada (Islamic declaration of faith)',
      shahada: 'La ilaha illa Allah, Muhammad rasul Allah',
      meaning: 'There is no god but Allah, and Muhammad is the messenger of Allah',
      embraced: 'and has embraced Islam',
    },
    ar: {
      certify: 'نشهد بأن',
      declared: 'قد نطق بالشهادتين',
      shahada: 'أشهد أن لا إله إلا الله وأشهد أن محمداً رسول الله',
      meaning: '',
      embraced: 'ودخل في دين الإسلام',
    },
    tr: {
      certify: 'Aşağıda ismi geçen kişinin',
      declared: 'Kelime-i Şehadet getirdiğini',
      shahada: 'Eşhedü en la ilahe illallah ve eşhedü enne Muhammeden abdühü ve resulühü',
      meaning: "Allah'tan başka ilah yoktur ve Muhammed O'nun kulu ve elçisidir",
      embraced: 've İslam dinine girdiğini tasdik ederiz',
    },
  };

  const t = texts[language] || texts.en;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(t.certify, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Convert name
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(cert.recipientName, pageWidth / 2, y, { align: 'center' });

  if (cert.recipientNameArabic) {
    y += 10;
    doc.setFontSize(18);
    doc.text(cert.recipientNameArabic, pageWidth / 2, y, { align: 'center' });
  }
  y += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(t.declared, pageWidth / 2, y, { align: 'center' });
  y += 12;

  // Shahada in Arabic/transliteration
  doc.setFontSize(16);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(t.shahada, pageWidth / 2, y, { align: 'center' });
  y += 10;

  if (t.meaning) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 100, 100);
    doc.text(`(${t.meaning})`, pageWidth / 2, y, { align: 'center' });
    y += 10;
  }

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(t.embraced, pageWidth / 2, y, { align: 'center' });

  return y + 10;
}

/**
 * Add Education certificate content
 */
function addEducationContent(
  doc: jsPDF,
  cert: CertificateData,
  _header: PDFHeaderConfig,
  language: string,
  startY: number,
  pageWidth: number
): number {
  let y = startY;

  const texts: Record<string, Record<string, string>> = {
    en: {
      certify: 'This is to certify that',
      completed: 'has successfully completed',
      program: 'the following program:',
    },
    ar: {
      certify: 'نشهد بأن',
      completed: 'قد أتم بنجاح',
      program: 'البرنامج التالي:',
    },
    tr: {
      certify: 'Aşağıda ismi geçen kişinin',
      completed: 'aşağıdaki programı başarıyla tamamladığını',
      program: 'tasdik ederiz:',
    },
  };

  const t = texts[language] || texts.en;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(t.certify, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Student name
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(cert.recipientName, pageWidth / 2, y, { align: 'center' });
  y += 15;

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  doc.text(`${t.completed} ${t.program}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Program name
  if (cert.details.programName) {
    doc.setFontSize(18);
    doc.setFont('times', 'bold');
    doc.setTextColor(41, 128, 185);
    doc.text(cert.details.programName, pageWidth / 2, y, { align: 'center' });
  }

  return y + 10;
}

/**
 * Add generic certificate content
 */
function addGenericContent(
  doc: jsPDF,
  cert: CertificateData,
  _header: PDFHeaderConfig,
  language: string,
  startY: number,
  pageWidth: number
): number {
  let y = startY;

  const texts: Record<string, string> = {
    en: 'This is to certify that',
    ar: 'نشهد بأن',
    tr: 'Aşağıda ismi geçen kişinin',
  };

  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text(texts[language] || texts.en, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // Recipient name
  doc.setFontSize(22);
  doc.setFont('times', 'bold');
  doc.setTextColor(41, 128, 185);
  doc.text(cert.recipientName, pageWidth / 2, y, { align: 'center' });

  if (cert.recipientNameArabic) {
    y += 10;
    doc.setFontSize(18);
    doc.text(cert.recipientNameArabic, pageWidth / 2, y, { align: 'center' });
  }

  return y + 10;
}

/**
 * Add signature section to certificate
 */
function addSignatureSection(
  doc: jsPDF,
  cert: CertificateData,
  header: PDFHeaderConfig,
  language: string,
  pageHeight: number,
  pageWidth: number
): void {
  const y = pageHeight - 45;

  const labels: Record<string, Record<string, string>> = {
    en: { officiant: 'Officiant', witness: 'Witness', seal: 'Official Seal' },
    ar: { officiant: 'المأذون', witness: 'الشاهد', seal: 'الختم الرسمي' },
    tr: { officiant: 'İmam', witness: 'Şahit', seal: 'Resmi Mühür' },
  };

  const l = labels[language] || labels.en;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);

  // Officiant signature
  const officiantX = 50;
  doc.line(officiantX - 20, y, officiantX + 40, y);
  doc.text(cert.officiantName || header.organizationName, officiantX + 10, y - 3, { align: 'center' });
  doc.text(l.officiant, officiantX + 10, y + 5, { align: 'center' });

  // Seal placeholder
  doc.setDrawColor(150, 150, 150);
  doc.setLineWidth(0.5);
  doc.circle(pageWidth / 2, y - 10, 15);
  doc.setFontSize(8);
  doc.text(l.seal, pageWidth / 2, y - 8, { align: 'center' });

  // Witness signatures (if applicable)
  if (cert.witnesses && cert.witnesses.length > 0) {
    const witnessX = pageWidth - 50;
    doc.line(witnessX - 40, y, witnessX + 20, y);
    doc.text(cert.witnesses[0], witnessX - 10, y - 3, { align: 'center' });
    doc.text(`${l.witness} 1`, witnessX - 10, y + 5, { align: 'center' });

    if (cert.witnesses.length > 1) {
      doc.line(witnessX - 40, y + 15, witnessX + 20, y + 15);
      doc.text(cert.witnesses[1], witnessX - 10, y + 12, { align: 'center' });
      doc.text(`${l.witness} 2`, witnessX - 10, y + 20, { align: 'center' });
    }
  }
}
