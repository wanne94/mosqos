import { useTranslation } from 'react-i18next';
import { setDocumentDirection } from './rtl';

export const AVAILABLE_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية' },
] as const;

export type LanguageCode = typeof AVAILABLE_LANGUAGES[number]['code'];

export const useLanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const changeLanguage = async (languageCode: LanguageCode) => {
    try {
      await i18n.changeLanguage(languageCode);
      setDocumentDirection(languageCode);
      localStorage.setItem('i18nextLng', languageCode);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return {
    currentLanguage: i18n.language as LanguageCode,
    changeLanguage,
    availableLanguages: AVAILABLE_LANGUAGES,
  };
};

interface LanguageSwitcherProps {
  className?: string;
}

export const LanguageSwitcher: React.FC<LanguageSwitcherProps> = ({ className }) => {
  const { currentLanguage, changeLanguage, availableLanguages } = useLanguageSwitcher();

  return (
    <select
      value={currentLanguage}
      onChange={(e) => changeLanguage(e.target.value as LanguageCode)}
      className={className}
      aria-label="Select language"
    >
      {availableLanguages.map((lang) => (
        <option key={lang.code} value={lang.code}>
          {lang.nativeName}
        </option>
      ))}
    </select>
  );
};
