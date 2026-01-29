/**
 * Schedule Translation Utilities
 *
 * Provides type-safe translation functions for schedule patterns, days, and periods.
 * Supports English (en), Turkish (tr), and Arabic (ar).
 * Includes utilities for converting day abbreviations and translating schedule patterns.
 */

/**
 * Day abbreviations type
 */
export type DayAbbreviation = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

/**
 * Full day names type
 */
export type DayName = 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';

/**
 * Schedule pattern type
 */
export type SchedulePattern =
  | 'Every Sunday'
  | 'Every Monday'
  | 'Every Tuesday'
  | 'Every Wednesday'
  | 'Every Thursday'
  | 'Every Friday'
  | 'Every Saturday'
  | 'Every week days'
  | 'Every weekend'
  | 'Mondays & Wednesdays'
  | 'Tuesdays & Thursdays';

/**
 * Supported language codes
 */
export type Language = 'en' | 'tr' | 'ar';

/**
 * Day abbreviation to full name mapping
 */
const dayMap: Record<DayAbbreviation, DayName> = {
  'Mon': 'Monday',
  'Tue': 'Tuesday',
  'Wed': 'Wednesday',
  'Thu': 'Thursday',
  'Fri': 'Friday',
  'Sat': 'Saturday',
  'Sun': 'Sunday',
};

/**
 * Day name translations
 */
const dayTranslations: Record<Language, Record<DayName, string>> = {
  en: {
    'Monday': 'Monday',
    'Tuesday': 'Tuesday',
    'Wednesday': 'Wednesday',
    'Thursday': 'Thursday',
    'Friday': 'Friday',
    'Saturday': 'Saturday',
    'Sunday': 'Sunday',
  },
  tr: {
    'Monday': 'Pazartesi',
    'Tuesday': 'Salı',
    'Wednesday': 'Çarşamba',
    'Thursday': 'Perşembe',
    'Friday': 'Cuma',
    'Saturday': 'Cumartesi',
    'Sunday': 'Pazar',
  },
  ar: {
    'Monday': 'الاثنين',
    'Tuesday': 'الثلاثاء',
    'Wednesday': 'الأربعاء',
    'Thursday': 'الخميس',
    'Friday': 'الجمعة',
    'Saturday': 'السبت',
    'Sunday': 'الأحد',
  },
};

/**
 * Schedule pattern translations
 */
const schedulePatternTranslations: Record<Language, Record<SchedulePattern, string>> = {
  en: {
    'Every Sunday': 'Every Sunday',
    'Every Monday': 'Every Monday',
    'Every Tuesday': 'Every Tuesday',
    'Every Wednesday': 'Every Wednesday',
    'Every Thursday': 'Every Thursday',
    'Every Friday': 'Every Friday',
    'Every Saturday': 'Every Saturday',
    'Every week days': 'Every week days',
    'Every weekend': 'Every weekend',
    'Mondays & Wednesdays': 'Mondays & Wednesdays',
    'Tuesdays & Thursdays': 'Tuesdays & Thursdays',
  },
  tr: {
    'Every Sunday': 'Her Pazar',
    'Every Monday': 'Her Pazartesi',
    'Every Tuesday': 'Her Salı',
    'Every Wednesday': 'Her Çarşamba',
    'Every Thursday': 'Her Perşembe',
    'Every Friday': 'Her Cuma',
    'Every Saturday': 'Her Cumartesi',
    'Every week days': 'Her hafta içi',
    'Every weekend': 'Her hafta sonu',
    'Mondays & Wednesdays': 'Pazartesi ve Çarşamba',
    'Tuesdays & Thursdays': 'Salı ve Perşembe',
  },
  ar: {
    'Every Sunday': 'كل يوم أحد',
    'Every Monday': 'كل يوم اثنين',
    'Every Tuesday': 'كل يوم ثلاثاء',
    'Every Wednesday': 'كل يوم أربعاء',
    'Every Thursday': 'كل يوم خميس',
    'Every Friday': 'كل يوم جمعة',
    'Every Saturday': 'كل يوم سبت',
    'Every week days': 'كل أيام الأسبوع',
    'Every weekend': 'كل عطلة نهاية الأسبوع',
    'Mondays & Wednesdays': 'الاثنين والأربعاء',
    'Tuesdays & Thursdays': 'الثلاثاء والخميس',
  },
};

/**
 * Converts day abbreviations to full day names
 *
 * @param schedule - The schedule string containing day abbreviations
 * @returns Schedule string with full day names
 *
 * @example
 * ```typescript
 * expandDayAbbreviations('Mon 10:00 AM') // Returns: 'Monday 10:00 AM'
 * expandDayAbbreviations('Tue, Thu 2:00 PM') // Returns: 'Tuesday, Thursday 2:00 PM'
 * ```
 */
export function expandDayAbbreviations(schedule: string | null | undefined): string {
  if (!schedule) return '';

  let expanded = schedule;

  Object.entries(dayMap).forEach(([abbr, full]) => {
    expanded = expanded.replace(new RegExp(abbr, 'g'), full);
  });

  return expanded;
}

/**
 * Translates a day name to the specified language
 *
 * @param day - The day name to translate
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns The translated day name, or the original if no translation exists
 *
 * @example
 * ```typescript
 * translateDay('Monday', 'tr') // Returns: 'Pazartesi'
 * translateDay('Friday', 'ar') // Returns: 'الجمعة'
 * ```
 */
export function translateDay(
  day: string | null | undefined,
  language: Language = 'en'
): string {
  if (!day) return '';

  if (day in dayTranslations[language]) {
    return dayTranslations[language][day as DayName];
  }

  return day;
}

/**
 * Translates a schedule pattern to the specified language
 *
 * @param pattern - The schedule pattern to translate
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns The translated pattern, or the original if no translation exists
 *
 * @example
 * ```typescript
 * translateSchedulePattern('Every Monday', 'tr') // Returns: 'Her Pazartesi'
 * translateSchedulePattern('Every weekend', 'ar') // Returns: 'كل عطلة نهاية الأسبوع'
 * ```
 */
export function translateSchedulePattern(
  pattern: string | null | undefined,
  language: Language = 'en'
): string {
  if (!pattern) return '';

  if (pattern in schedulePatternTranslations[language]) {
    return schedulePatternTranslations[language][pattern as SchedulePattern];
  }

  return pattern;
}

/**
 * Comprehensive schedule translation function
 * Handles both schedule patterns and day abbreviations
 *
 * @param schedule - The schedule text to translate
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns The translated schedule
 *
 * @example
 * ```typescript
 * translateSchedule('Every Monday', 'tr') // Returns: 'Her Pazartesi'
 * translateSchedule('Mon 10:00 AM', 'tr') // Returns: 'Pazartesi 10:00 AM'
 * translateSchedule('Every weekend', 'ar') // Returns: 'كل عطلة نهاية الأسبوع'
 * ```
 */
export function translateSchedule(
  schedule: string | null | undefined,
  language: Language = 'en'
): string {
  if (!schedule) return '';

  // For English, just expand abbreviations
  if (language === 'en') {
    return expandDayAbbreviations(schedule);
  }

  // First, try to translate as a pattern
  const patternTranslation = translateSchedulePattern(schedule, language);
  if (patternTranslation !== schedule) {
    return patternTranslation;
  }

  // If not a pattern, expand abbreviations first
  let translated = expandDayAbbreviations(schedule);

  // Then translate individual day names
  Object.entries(dayTranslations.en).forEach(([enDay]) => {
    const dayName = enDay as DayName;
    const translatedDay = dayTranslations[language][dayName];
    translated = translated.replace(new RegExp(dayName, 'g'), translatedDay);
  });

  return translated;
}

/**
 * Gets all available schedule patterns with translations for a specific language
 *
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns Object mapping schedule patterns to their translated versions
 *
 * @example
 * ```typescript
 * const patterns = getAllSchedulePatterns('tr');
 * // Returns: { 'Every Monday': 'Her Pazartesi', ... }
 * ```
 */
export function getAllSchedulePatterns(language: Language = 'en'): Record<string, string> {
  return schedulePatternTranslations[language];
}

/**
 * Gets all available day translations for a specific language
 *
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns Object mapping day names to their translated versions
 *
 * @example
 * ```typescript
 * const days = getAllDayTranslations('ar');
 * // Returns: { 'Monday': 'الاثنين', ... }
 * ```
 */
export function getAllDayTranslations(language: Language = 'en'): Record<string, string> {
  return dayTranslations[language];
}

/**
 * Gets all day names (English)
 *
 * @returns Array of all day names
 *
 * @example
 * ```typescript
 * const days = getDayNames();
 * // Returns: ['Monday', 'Tuesday', ...]
 * ```
 */
export function getDayNames(): DayName[] {
  return Object.keys(dayTranslations.en) as DayName[];
}

/**
 * Gets all schedule pattern keys
 *
 * @returns Array of all schedule pattern identifiers
 *
 * @example
 * ```typescript
 * const patterns = getSchedulePatternKeys();
 * // Returns: ['Every Sunday', 'Every Monday', ...]
 * ```
 */
export function getSchedulePatternKeys(): SchedulePattern[] {
  return Object.keys(schedulePatternTranslations.en) as SchedulePattern[];
}
