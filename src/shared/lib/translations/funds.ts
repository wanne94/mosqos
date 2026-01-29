/**
 * Fund Translation Utilities
 *
 * Provides type-safe translation functions for fund names across multiple languages.
 * Supports English (en), Turkish (tr), and Arabic (ar).
 */

/**
 * Fund type enum representing all possible fund types
 */
export type FundType =
  | 'Operations'
  | 'Sadaqah'
  | 'Sadaqa'
  | 'Zakat'
  | 'Education'
  | 'Umrah'
  | 'Hajj & Umrah';

/**
 * Supported language codes
 */
export type Language = 'en' | 'tr' | 'ar';

/**
 * Translation mapping for fund names
 */
const fundTranslations: Record<Language, Record<FundType, string>> = {
  en: {
    'Operations': 'Operations',
    'Sadaqah': 'Sadaqah',
    'Sadaqa': 'Sadaqah',
    'Zakat': 'Zakat',
    'Education': 'Education',
    'Umrah': 'Umrah',
    'Hajj & Umrah': 'Hajj & Umrah',
  },
  tr: {
    'Operations': 'İşletme',
    'Sadaqah': 'Sadaka',
    'Sadaqa': 'Sadaka',
    'Zakat': 'Zekat',
    'Education': 'Eğitim',
    'Umrah': 'Umre',
    'Hajj & Umrah': 'Hac ve Umre',
  },
  ar: {
    'Operations': 'العمليات',
    'Sadaqah': 'صدقة',
    'Sadaqa': 'صدقة',
    'Zakat': 'زكاة',
    'Education': 'التعليم',
    'Umrah': 'عمرة',
    'Hajj & Umrah': 'الحج والعمرة',
  },
};

/**
 * Translates a fund name to the specified language
 *
 * @param fundName - The fund name to translate
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns The translated fund name, or the original if no translation exists
 *
 * @example
 * ```typescript
 * translateFundName('Zakat', 'tr') // Returns: 'Zekat'
 * translateFundName('Operations', 'ar') // Returns: 'العمليات'
 * translateFundName('Education') // Returns: 'Education' (default en)
 * ```
 */
export function translateFundName(
  fundName: string | null | undefined,
  language: Language = 'en'
): string {
  if (!fundName) return '';

  // Check if the fund name exists in our translations
  if (fundName in fundTranslations[language]) {
    return fundTranslations[language][fundName as FundType];
  }

  // Return original if no translation exists
  return fundName;
}

/**
 * Gets all available fund types with their translations for a specific language
 *
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns Object mapping fund types to their translated names
 *
 * @example
 * ```typescript
 * const funds = getAllFundTranslations('tr');
 * // Returns: { 'Operations': 'İşletme', 'Zakat': 'Zekat', ... }
 * ```
 */
export function getAllFundTranslations(language: Language = 'en'): Record<string, string> {
  return fundTranslations[language];
}

/**
 * Gets all available fund types (keys)
 *
 * @returns Array of all fund type identifiers
 *
 * @example
 * ```typescript
 * const types = getFundTypes();
 * // Returns: ['Operations', 'Sadaqah', 'Zakat', ...]
 * ```
 */
export function getFundTypes(): FundType[] {
  return Object.keys(fundTranslations.en) as FundType[];
}
