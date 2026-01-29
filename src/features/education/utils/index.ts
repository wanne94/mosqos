// Education Utilities
export { translateSchedule } from './scheduleTranslations'
export { exportToExcel } from './excelExport'

// Re-export shared translation utilities for convenience
export {
  translateSchedule as translateScheduleMultiLang,
  expandDayAbbreviations,
  translateDay,
  translateSchedulePattern,
} from '@/shared/lib/translations'
