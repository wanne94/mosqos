/**
 * Date Range Generator
 * Generates realistic date ranges for historical data
 */

import { subYears, subMonths, addDays, addMonths, startOfMonth, endOfMonth, format } from 'date-fns';
import { TEMPORAL_CONFIG } from '../../config.js';

/**
 * Get historical start date (2-3 years ago)
 */
export function getHistoricalStartDate(): Date {
  return subYears(new Date(), TEMPORAL_CONFIG.historicalYears);
}

/**
 * Get future end date (3 months ahead)
 */
export function getFutureEndDate(): Date {
  return addMonths(new Date(), TEMPORAL_CONFIG.futureMonths);
}

/**
 * Generate random date within range
 */
export function randomDateBetween(start: Date, end: Date): Date {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const randomTime = startTime + Math.random() * (endTime - startTime);

  return new Date(randomTime);
}

/**
 * Generate array of dates for monthly data
 */
export function generateMonthlyDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let current = startOfMonth(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current = addMonths(current, 1);
  }

  return dates;
}

/**
 * Generate array of dates for weekly data
 */
export function generateWeeklyDates(startDate: Date, endDate: Date): Date[] {
  const dates: Date[] = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    dates.push(new Date(current));
    current = addDays(current, 7);
  }

  return dates;
}

/**
 * Generate random recent date (last 30 days)
 */
export function randomRecentDate(): Date {
  const end = new Date();
  const start = subMonths(end, 1);
  return randomDateBetween(start, end);
}

/**
 * Generate random date in past year
 */
export function randomDateInPastYear(): Date {
  const end = new Date();
  const start = subYears(end, 1);
  return randomDateBetween(start, end);
}

/**
 * Generate random future date (next 3 months)
 */
export function randomFutureDate(): Date {
  const start = new Date();
  const end = getFutureEndDate();
  return randomDateBetween(start, end);
}

/**
 * Format date for database (YYYY-MM-DD)
 */
export function formatDbDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Format datetime for database (ISO 8601)
 */
export function formatDbDateTime(date: Date): string {
  return date.toISOString();
}
