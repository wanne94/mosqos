/**
 * Translation Utilities Examples
 *
 * This file demonstrates how to use the translation utilities.
 * You can run this file to test the translations.
 */

import {
  translateFundName,
  getAllFundTranslations,
  getFundTypes,
  translateCategory,
  getAllCategoryTranslations,
  getCategoryTypes,
  translateSchedule,
  expandDayAbbreviations,
  translateDay,
  translateSchedulePattern,
  getAllSchedulePatterns,
  getAllDayTranslations,
} from './index';

// Example 1: Fund Translations
console.log('=== Fund Translations ===');
console.log('Zakat in Turkish:', translateFundName('Zakat', 'tr')); // Zekat
console.log('Operations in Arabic:', translateFundName('Operations', 'ar')); // العمليات
console.log('Education in English:', translateFundName('Education')); // Education

console.log('\nAll fund types:', getFundTypes());

console.log('\nAll Turkish fund translations:');
console.log(getAllFundTranslations('tr'));

// Example 2: Category Translations
console.log('\n=== Category Translations ===');
console.log('Utilities in Turkish:', translateCategory('Utilities', 'tr')); // Faturalar
console.log('Medical in Arabic:', translateCategory('Medical', 'ar')); // طبي
console.log('Education in English:', translateCategory('Education')); // Education

console.log('\nAll category types:', getCategoryTypes());

console.log('\nAll Arabic category translations:');
console.log(getAllCategoryTranslations('ar'));

// Example 3: Schedule Translations
console.log('\n=== Schedule Translations ===');

// Expand abbreviations
console.log('Mon 10:00 AM expanded:', expandDayAbbreviations('Mon 10:00 AM')); // Monday 10:00 AM
console.log('Tue, Thu 2:00 PM expanded:', expandDayAbbreviations('Tue, Thu 2:00 PM')); // Tuesday, Thursday 2:00 PM

// Translate day names
console.log('\nMonday in Turkish:', translateDay('Monday', 'tr')); // Pazartesi
console.log('Friday in Arabic:', translateDay('Friday', 'ar')); // الجمعة

// Translate schedule patterns
console.log('\nEvery Monday in Turkish:', translateSchedulePattern('Every Monday', 'tr')); // Her Pazartesi
console.log('Every weekend in Arabic:', translateSchedulePattern('Every weekend', 'ar')); // كل عطلة نهاية الأسبوع

// Comprehensive schedule translation
console.log('\nComprehensive translations:');
console.log('Every Monday (Turkish):', translateSchedule('Every Monday', 'tr')); // Her Pazartesi
console.log('Mon 10:00 AM (Turkish):', translateSchedule('Mon 10:00 AM', 'tr')); // Pazartesi 10:00 AM
console.log('Every weekend (Arabic):', translateSchedule('Every weekend', 'ar')); // كل عطلة نهاية الأسبوع

console.log('\nAll day translations (Turkish):');
console.log(getAllDayTranslations('tr'));

console.log('\nAll schedule patterns (Arabic):');
console.log(getAllSchedulePatterns('ar'));

// Example 4: Error Handling
console.log('\n=== Error Handling ===');
console.log('Non-existent fund:', translateFundName('NonExistent', 'tr')); // Returns: NonExistent
console.log('Null fund:', translateFundName(null, 'tr')); // Returns: ''
console.log('Undefined category:', translateCategory(undefined, 'ar')); // Returns: ''

// Example 5: Type Safety Demo
console.log('\n=== Type Safety ===');
// These would cause TypeScript errors if uncommented:
// translateFundName('Zakat', 'fr'); // Error: 'fr' is not assignable to type Language
// const day: DayName = 'Moonday'; // Error: 'Moonday' is not assignable to type DayName
