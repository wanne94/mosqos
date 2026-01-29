/**
 * Category Translation Utilities
 *
 * Provides type-safe translation functions for expense/donation categories across multiple languages.
 * Supports English (en), Turkish (tr), and Arabic (ar).
 */

/**
 * Category type enum representing all possible category types
 */
export type CategoryType =
  | 'Utilities'
  | 'Salary'
  | 'Maintenance'
  | 'Event Cost'
  | 'Charity Distribution'
  | 'Operations'
  | 'Financial Assistance (Zakat)'
  | 'Food Pantry'
  | 'Housing'
  | 'Medical'
  | 'Marriage (Nikkah)'
  | 'Funeral (Janazah)'
  | 'Education'
  | 'Counseling';

/**
 * Supported language codes
 */
export type Language = 'en' | 'tr' | 'ar';

/**
 * Translation mapping for category names
 */
const categoryTranslations: Record<Language, Record<CategoryType, string>> = {
  en: {
    'Utilities': 'Utilities',
    'Salary': 'Salary',
    'Maintenance': 'Maintenance',
    'Event Cost': 'Event Cost',
    'Charity Distribution': 'Charity Distribution',
    'Operations': 'Operations',
    'Financial Assistance (Zakat)': 'Financial Assistance (Zakat)',
    'Food Pantry': 'Food Pantry',
    'Housing': 'Housing',
    'Medical': 'Medical',
    'Marriage (Nikkah)': 'Marriage (Nikkah)',
    'Funeral (Janazah)': 'Funeral (Janazah)',
    'Education': 'Education',
    'Counseling': 'Counseling',
  },
  tr: {
    'Utilities': 'Faturalar',
    'Salary': 'Maaş',
    'Maintenance': 'Bakım',
    'Event Cost': 'Etkinlik Maliyeti',
    'Charity Distribution': 'Hayır Dağıtımı',
    'Operations': 'İşletme',
    'Financial Assistance (Zakat)': 'Mali Yardım (Zekat)',
    'Food Pantry': 'Gıda Yardımı',
    'Housing': 'Konut',
    'Medical': 'Tıbbi',
    'Marriage (Nikkah)': 'Evlilik (Nikah)',
    'Funeral (Janazah)': 'Cenaze (Cenaze)',
    'Education': 'Eğitim',
    'Counseling': 'Danışmanlık',
  },
  ar: {
    'Utilities': 'المرافق',
    'Salary': 'الراتب',
    'Maintenance': 'الصيانة',
    'Event Cost': 'تكلفة الحدث',
    'Charity Distribution': 'توزيع الصدقات',
    'Operations': 'العمليات',
    'Financial Assistance (Zakat)': 'المساعدة المالية (الزكاة)',
    'Food Pantry': 'بنك الطعام',
    'Housing': 'الإسكان',
    'Medical': 'طبي',
    'Marriage (Nikkah)': 'الزواج (النكاح)',
    'Funeral (Janazah)': 'الجنازة (الجنازة)',
    'Education': 'التعليم',
    'Counseling': 'الإرشاد',
  },
};

/**
 * Translates a category name to the specified language
 *
 * @param category - The category name to translate
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns The translated category name, or the original if no translation exists
 *
 * @example
 * ```typescript
 * translateCategory('Utilities', 'tr') // Returns: 'Faturalar'
 * translateCategory('Medical', 'ar') // Returns: 'طبي'
 * translateCategory('Education') // Returns: 'Education' (default en)
 * ```
 */
export function translateCategory(
  category: string | null | undefined,
  language: Language = 'en'
): string {
  if (!category) return '';

  // Check if the category exists in our translations
  if (category in categoryTranslations[language]) {
    return categoryTranslations[language][category as CategoryType];
  }

  // Return original if no translation exists
  return category;
}

/**
 * Gets the translation key for a category
 * This function is useful when working with i18n systems that use keys
 *
 * @param category - The category name
 * @returns The category name as-is (used as translation key)
 *
 * @example
 * ```typescript
 * getCategoryTranslationKey('Financial Assistance (Zakat)')
 * // Returns: 'Financial Assistance (Zakat)'
 * ```
 */
export function getCategoryTranslationKey(category: string | null | undefined): string {
  if (!category) return '';
  return category;
}

/**
 * Gets all available category translations for a specific language
 *
 * @param language - Target language code (en, tr, ar). Defaults to 'en'
 * @returns Object mapping category types to their translated names
 *
 * @example
 * ```typescript
 * const categories = getAllCategoryTranslations('tr');
 * // Returns: { 'Utilities': 'Faturalar', 'Salary': 'Maaş', ... }
 * ```
 */
export function getAllCategoryTranslations(language: Language = 'en'): Record<string, string> {
  return categoryTranslations[language];
}

/**
 * Gets all available category types (keys)
 *
 * @returns Array of all category type identifiers
 *
 * @example
 * ```typescript
 * const types = getCategoryTypes();
 * // Returns: ['Utilities', 'Salary', 'Maintenance', ...]
 * ```
 */
export function getCategoryTypes(): CategoryType[] {
  return Object.keys(categoryTranslations.en) as CategoryType[];
}
