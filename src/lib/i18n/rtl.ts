import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const RTL_LANGUAGES = ['ar'];

export const isRTL = (language: string): boolean => {
  return RTL_LANGUAGES.includes(language);
};

export const useRTL = () => {
  const { i18n } = useTranslation();

  useEffect(() => {
    const currentLanguage = i18n.language;
    const direction = isRTL(currentLanguage) ? 'rtl' : 'ltr';

    document.documentElement.setAttribute('dir', direction);
    document.documentElement.setAttribute('lang', currentLanguage);
  }, [i18n.language]);

  return {
    isRTL: isRTL(i18n.language),
    direction: isRTL(i18n.language) ? 'rtl' : 'ltr',
  };
};

export const setDocumentDirection = (language: string) => {
  const direction = isRTL(language) ? 'rtl' : 'ltr';
  document.documentElement.setAttribute('dir', direction);
  document.documentElement.setAttribute('lang', language);
};
