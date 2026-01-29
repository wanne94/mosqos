/**
 * Translation Utilities Index
 *
 * Central export point for all translation utilities in the Mosque SaaS application.
 * Provides type-safe translation functions for funds, categories, and schedules
 * across multiple languages (English, Turkish, Arabic).
 */

// Fund translations
export {
  translateFundName,
  getAllFundTranslations,
  getFundTypes,
  type FundType,
} from './funds';

// Category translations
export {
  translateCategory,
  getCategoryTranslationKey,
  getAllCategoryTranslations,
  getCategoryTypes,
  type CategoryType,
} from './categories';

// Schedule translations
export {
  expandDayAbbreviations,
  translateDay,
  translateSchedulePattern,
  translateSchedule,
  getAllSchedulePatterns,
  getAllDayTranslations,
  getDayNames,
  getSchedulePatternKeys,
  type DayAbbreviation,
  type DayName,
  type SchedulePattern,
} from './schedule';

// Common language type
export type { Language } from './funds';
