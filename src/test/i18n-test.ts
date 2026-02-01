import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Simple i18n instance for testing
i18n.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  resources: {
    en: {
      common: {
        loading: 'Loading...',
        error: 'Error',
        save: 'Save',
        cancel: 'Cancel',
        delete: 'Delete',
        edit: 'Edit',
        create: 'Create',
        search: 'Search',
        filter: 'Filter',
        noData: 'No data available',
        actions: 'Actions',
        confirm: 'Confirm',
        yes: 'Yes',
        no: 'No',
        submit: 'Submit',
        close: 'Close',
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

export default i18n
