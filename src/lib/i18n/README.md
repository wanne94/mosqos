# i18n Setup Documentation

## Overview
This project uses i18next for internationalization (i18n) with support for English (en), Turkish (tr), and Arabic (ar) languages.

## Configuration

The i18n configuration is located in `/src/lib/i18n/config.ts` and is automatically initialized when the app starts.

### Supported Languages
- **English** (en) - Default
- **Turkish** (tr)
- **Arabic** (ar) - RTL support enabled

## Usage

### Basic Translation Hook

```tsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.dashboard')}</h1>
      <p>{t('common.welcome')}</p>
    </div>
  );
}
```

### Type-Safe Translations

TypeScript autocomplete is enabled for translation keys:

```tsx
// TypeScript will provide autocomplete for these keys
t('common.dashboard')
t('admin.people')
t('donation.makeDonation')
```

### RTL Support

Use the `useRTL` hook to detect RTL languages:

```tsx
import { useRTL } from '@/lib/i18n';

function MyComponent() {
  const { isRTL, direction } = useRTL();

  return (
    <div className={isRTL ? 'text-right' : 'text-left'}>
      Content will be RTL for Arabic
    </div>
  );
}
```

### Language Switcher

Use the LanguageSwitcher component:

```tsx
import { LanguageSwitcher } from '@/lib/i18n';

function Header() {
  return (
    <header>
      <LanguageSwitcher className="px-3 py-2 border rounded" />
    </header>
  );
}
```

Or use the hook directly:

```tsx
import { useLanguageSwitcher } from '@/lib/i18n';

function MyLanguageSwitcher() {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguageSwitcher();

  return (
    <div>
      <p>Current: {currentLanguage}</p>
      {availableLanguages.map(lang => (
        <button key={lang.code} onClick={() => changeLanguage(lang.code)}>
          {lang.nativeName}
        </button>
      ))}
    </div>
  );
}
```

## Translation Files

Translation files are located in `/src/locales/`:
- `en.json` - English translations
- `tr.json` - Turkish translations
- `ar.json` - Arabic translations

### Translation File Structure

```json
{
  "common": {
    "dashboard": "Dashboard",
    "welcome": "Welcome"
  },
  "admin": {
    "dashboard": "Dashboard",
    "people": "People"
  }
}
```

### Adding New Translations

1. Add the key to all three translation files (`en.json`, `tr.json`, `ar.json`)
2. Use the translation key in your component with `t('namespace.key')`

Example:
```json
// en.json
{
  "myFeature": {
    "title": "My Feature Title"
  }
}

// tr.json
{
  "myFeature": {
    "title": "Özellik Başlığım"
  }
}

// ar.json
{
  "myFeature": {
    "title": "عنوان ميزتي"
  }
}
```

## Interpolation

Use variables in translations:

```tsx
// Translation file
{
  "greeting": "Hello, {{name}}!"
}

// Component
t('greeting', { name: 'Ahmad' })
// Output: "Hello, Ahmad!"
```

## Pluralization

```tsx
// Translation file
{
  "itemCount": "{{count}} item",
  "itemCount_plural": "{{count}} items"
}

// Component
t('itemCount', { count: 1 })  // "1 item"
t('itemCount', { count: 5 })  // "5 items"
```

## Best Practices

1. **Namespace Organization**: Use logical namespaces like `common`, `admin`, `member`, etc.
2. **Consistent Keys**: Use camelCase for translation keys
3. **RTL Testing**: Always test Arabic translations to ensure RTL layout works correctly
4. **Complete Translations**: Ensure all languages have the same keys
5. **Type Safety**: Leverage TypeScript autocomplete for translation keys

## RTL CSS Classes

The project includes built-in RTL support in CSS. The document direction is automatically set based on the selected language.

For custom RTL styles:
```css
[dir="rtl"] .my-element {
  /* RTL-specific styles */
}
```

## Language Detection

The app automatically detects the user's language preference from:
1. localStorage (previously selected language)
2. Browser language settings

The selected language is persisted in localStorage.
