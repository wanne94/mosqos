/**
 * Basic i18n Usage Examples
 *
 * This file demonstrates various ways to use i18next in the Mosque SaaS application.
 * Copy and adapt these examples to your components.
 */

import { useTranslation } from 'react-i18next';
import { LanguageSwitcher, useLanguageSwitcher, useRTL } from '@/lib/i18n';

// Example 1: Basic translation usage
export function BasicTranslationExample() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('common.dashboard')}</h1>
      <p>{t('common.welcome')}</p>
      <button>{t('common.save')}</button>
    </div>
  );
}

// Example 2: Using different namespaces
export function NamespaceExample() {
  const { t } = useTranslation();

  return (
    <div>
      <h1>{t('admin.dashboard')}</h1>
      <h2>{t('member.myProfile')}</h2>
      <p>{t('donation.makeDonation')}</p>
    </div>
  );
}

// Example 3: RTL support
export function RTLExample() {
  const { t } = useTranslation();
  const { isRTL, direction } = useRTL();

  return (
    <div className={`p-4 ${isRTL ? 'text-right' : 'text-left'}`}>
      <p>Current direction: {direction}</p>
      <p>{t('common.welcome')}</p>
    </div>
  );
}

// Example 4: Language switcher in header
export function HeaderExample() {
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between p-4 bg-gray-100">
      <h1 className="text-xl font-bold">{t('common.dashboard')}</h1>
      <LanguageSwitcher className="px-3 py-2 border rounded-lg bg-white" />
    </header>
  );
}

// Example 5: Custom language switcher using the hook
export function CustomLanguageSwitcher() {
  const { t } = useTranslation();
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguageSwitcher();

  return (
    <div className="space-y-2">
      <p className="font-semibold">
        {t('common.select')} Language: {currentLanguage}
      </p>
      <div className="flex gap-2">
        {availableLanguages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`px-4 py-2 rounded ${
              currentLanguage === lang.code
                ? 'bg-blue-500 text-white'
                : 'bg-gray-200'
            }`}
          >
            {lang.nativeName}
          </button>
        ))}
      </div>
    </div>
  );
}

// Example 6: Interpolation (variables in translations)
export function InterpolationExample() {
  const { t } = useTranslation();
  const userName = 'Ahmad';

  return (
    <div>
      {/* For this to work, add to locale files: "greeting": "Hello, {{name}}!" */}
      <p>{t('common.welcome')}, {userName}</p>
    </div>
  );
}

// Example 7: Conditional rendering based on language
export function ConditionalLanguageExample() {
  const { i18n } = useTranslation();

  return (
    <div>
      {i18n.language === 'ar' && (
        <p>Arabic-specific content</p>
      )}
      {i18n.language === 'en' && (
        <p>English-specific content</p>
      )}
      {i18n.language === 'tr' && (
        <p>Turkish-specific content</p>
      )}
    </div>
  );
}

// Example 8: Using translation with form labels
export function FormExample() {
  const { t } = useTranslation();

  return (
    <form className="space-y-4">
      <div>
        <label htmlFor="name" className="block mb-1">
          {t('common.name')}
        </label>
        <input
          id="name"
          type="text"
          placeholder={t('common.name')}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <div>
        <label htmlFor="email" className="block mb-1">
          {t('common.email')}
        </label>
        <input
          id="email"
          type="email"
          placeholder={t('common.email')}
          className="w-full px-3 py-2 border rounded"
        />
      </div>
      <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">
        {t('common.submit')}
      </button>
    </form>
  );
}
