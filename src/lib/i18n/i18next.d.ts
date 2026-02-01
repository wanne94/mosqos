import 'i18next';

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'translation';
    // Allow any string as translation key during development
    // This is necessary as translation keys are spread across multiple files
    allowObjectInHTMLChildren: true;
  }
}

// Override TFunction to accept any string key
declare module 'react-i18next' {
  interface UseTranslationResponse {
    t: (key: string, options?: Record<string, unknown>) => string;
  }
}
