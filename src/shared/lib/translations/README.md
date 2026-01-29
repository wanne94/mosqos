# Translation Utilities

Type-safe translation utilities for the Mosque SaaS application. Provides functions for translating funds, categories, and schedules across multiple languages.

## Supported Languages

- English (`en`)
- Turkish (`tr`)
- Arabic (`ar`)

## Usage

### Fund Translations

```typescript
import { translateFundName, getAllFundTranslations, getFundTypes } from '@/shared/lib/translations';

// Translate a single fund name
const fundName = translateFundName('Zakat', 'tr'); // Returns: 'Zekat'

// Get all fund translations for a language
const allFunds = getAllFundTranslations('ar');
// Returns: { 'Operations': 'العمليات', 'Zakat': 'زكاة', ... }

// Get all available fund types
const types = getFundTypes();
// Returns: ['Operations', 'Sadaqah', 'Zakat', ...]
```

### Category Translations

```typescript
import { translateCategory, getAllCategoryTranslations, getCategoryTypes } from '@/shared/lib/translations';

// Translate a single category
const category = translateCategory('Utilities', 'tr'); // Returns: 'Faturalar'

// Get all category translations for a language
const allCategories = getAllCategoryTranslations('ar');
// Returns: { 'Utilities': 'المرافق', 'Medical': 'طبي', ... }

// Get all available category types
const types = getCategoryTypes();
// Returns: ['Utilities', 'Salary', 'Maintenance', ...]
```

### Schedule Translations

```typescript
import {
  translateSchedule,
  expandDayAbbreviations,
  translateDay,
  translateSchedulePattern,
  getAllSchedulePatterns,
  getAllDayTranslations
} from '@/shared/lib/translations';

// Expand day abbreviations
const expanded = expandDayAbbreviations('Mon 10:00 AM');
// Returns: 'Monday 10:00 AM'

// Translate a day name
const day = translateDay('Monday', 'tr'); // Returns: 'Pazartesi'

// Translate a schedule pattern
const pattern = translateSchedulePattern('Every Monday', 'tr');
// Returns: 'Her Pazartesi'

// Comprehensive schedule translation
const schedule1 = translateSchedule('Every Monday', 'tr');
// Returns: 'Her Pazartesi'

const schedule2 = translateSchedule('Mon 10:00 AM', 'tr');
// Returns: 'Pazartesi 10:00 AM'

// Get all schedule patterns for a language
const patterns = getAllSchedulePatterns('ar');
// Returns: { 'Every Monday': 'كل يوم اثنين', ... }

// Get all day translations
const days = getAllDayTranslations('tr');
// Returns: { 'Monday': 'Pazartesi', 'Tuesday': 'Salı', ... }
```

## Type Safety

All translation functions are fully type-safe with TypeScript:

```typescript
type FundType = 'Operations' | 'Sadaqah' | 'Zakat' | ...;
type CategoryType = 'Utilities' | 'Salary' | 'Maintenance' | ...;
type SchedulePattern = 'Every Sunday' | 'Every Monday' | ...;
type Language = 'en' | 'tr' | 'ar';
```

## Migration Notes

These utilities were migrated from MosqOS with the following improvements:

1. **TypeScript Conversion**: Converted from JavaScript to TypeScript with full type safety
2. **Multiple Language Support**: Built-in translations for English, Turkish, and Arabic
3. **Standalone Functions**: No dependency on i18n library - can be used independently
4. **Enhanced Schedule Utilities**: Combined MosqOS schedule translations with Mosque SaaS day abbreviation expansion
5. **JSDoc Documentation**: Comprehensive documentation with examples for all functions

## Original Source

Migrated from:
- `/home/wanne/React projekti/MosqOS/src/utils/fundTranslations.js`
- `/home/wanne/React projekti/MosqOS/src/utils/categoryTranslations.js`
- `/home/wanne/React projekti/MosqOS/src/utils/scheduleTranslations.js`

Combined with existing:
- `/home/wanne/React projekti/Mosque SaaS/src/features/education/utils/scheduleTranslations.ts`
