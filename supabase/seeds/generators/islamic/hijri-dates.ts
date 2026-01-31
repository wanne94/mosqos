/**
 * Hijri Date Utilities
 * Handle Islamic calendar conversions and patterns
 */

import moment from 'moment-hijri';
import { addDays, subDays, format } from 'date-fns';

/**
 * Get Hijri month for a Gregorian date
 */
export function getHijriMonth(gregorianDate: Date): number {
  const m = moment(gregorianDate);
  return m.iMonth() + 1; // moment-hijri months are 0-indexed
}

/**
 * Get Hijri year for a Gregorian date
 */
export function getHijriYear(gregorianDate: Date): number {
  const m = moment(gregorianDate);
  return m.iYear();
}

/**
 * Check if a date is in Ramadan
 */
export function isRamadan(gregorianDate: Date): boolean {
  return getHijriMonth(gregorianDate) === 9;
}

/**
 * Check if a date is in Dhul Hijjah
 */
export function isDhulHijjah(gregorianDate: Date): boolean {
  return getHijriMonth(gregorianDate) === 12;
}

/**
 * Get Ramadan dates for a Gregorian year
 */
export function getRamadanDates(gregorianYear: number): { start: Date; end: Date } {
  // Approximate Ramadan start (this varies by moon sighting)
  // Using rough calculation: Ramadan in 2024 started around March 11
  // Each year, Islamic calendar shifts ~11 days earlier

  const yearDiff = gregorianYear - 2024;
  const daysShift = yearDiff * 11;

  const baseStart = new Date(2024, 2, 11); // March 11, 2024
  const start = subDays(baseStart, daysShift);
  const end = addDays(start, 29);

  return { start, end };
}

/**
 * Get Dhul Hijjah dates for a Gregorian year
 */
export function getDhulHijjahDates(gregorianYear: number): { start: Date; end: Date } {
  // Approximate Dhul Hijjah start
  // Using rough calculation: shifts ~11 days earlier each year

  const yearDiff = gregorianYear - 2024;
  const daysShift = yearDiff * 11;

  const baseStart = new Date(2024, 5, 7); // June 7, 2024 (approximate)
  const start = subDays(baseStart, daysShift);
  const end = addDays(start, 29);

  return { start, end };
}

/**
 * Get all Friday dates in a date range
 */
export function getFridays(startDate: Date, endDate: Date): Date[] {
  const fridays: Date[] = [];
  let current = new Date(startDate);

  // Adjust to next Friday if not starting on Friday
  const dayOfWeek = current.getDay();
  if (dayOfWeek !== 5) {
    const daysUntilFriday = (5 - dayOfWeek + 7) % 7;
    current = addDays(current, daysUntilFriday);
  }

  while (current <= endDate) {
    fridays.push(new Date(current));
    current = addDays(current, 7);
  }

  return fridays;
}

/**
 * Format Hijri date
 */
export function formatHijriDate(gregorianDate: Date): string {
  const m = moment(gregorianDate);
  return m.format('iDD/iMM/iYYYY');
}

/**
 * Get Islamic month name in English
 */
export function getIslamicMonthName(month: number): string {
  const months = [
    'Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani',
    'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', 'Shaban',
    'Ramadan', 'Shawwal', 'Dhul Qidah', 'Dhul Hijjah',
  ];

  return months[month - 1] || 'Unknown';
}

/**
 * Check if date is a significant Islamic date
 */
export function getIslamicSignificance(gregorianDate: Date): string | null {
  const hijriMonth = getHijriMonth(gregorianDate);
  const m = moment(gregorianDate);
  const hijriDay = m.iDate();

  // Ramadan
  if (hijriMonth === 9) {
    if (hijriDay === 1) return 'First Day of Ramadan';
    if (hijriDay >= 21 && hijriDay <= 29 && hijriDay % 2 === 1) {
      return 'Laylat al-Qadr (possible night)';
    }
  }

  // Eid al-Fitr
  if (hijriMonth === 10 && hijriDay === 1) return 'Eid al-Fitr';

  // Dhul Hijjah
  if (hijriMonth === 12) {
    if (hijriDay >= 1 && hijriDay <= 10) return 'First 10 Days of Dhul Hijjah';
    if (hijriDay === 9) return 'Day of Arafah';
    if (hijriDay === 10) return 'Eid al-Adha';
  }

  // Muharram
  if (hijriMonth === 1) {
    if (hijriDay === 1) return 'Islamic New Year';
    if (hijriDay === 10) return 'Day of Ashura';
  }

  // Rabi al-Awwal
  if (hijriMonth === 3 && hijriDay === 12) return 'Mawlid al-Nabi (Prophet\'s Birthday)';

  return null;
}
