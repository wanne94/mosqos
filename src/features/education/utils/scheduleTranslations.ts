/**
 * Utility function to translate schedule strings
 * Converts day abbreviations and time formats to readable text
 */

export function translateSchedule(schedule: string | null | undefined): string {
  if (!schedule) return ''

  // Simple translation - can be enhanced with i18n later
  let translated = schedule

  // Replace day abbreviations
  const dayMap: Record<string, string> = {
    'Mon': 'Monday',
    'Tue': 'Tuesday',
    'Wed': 'Wednesday',
    'Thu': 'Thursday',
    'Fri': 'Friday',
    'Sat': 'Saturday',
    'Sun': 'Sunday',
  }

  Object.entries(dayMap).forEach(([abbr, full]) => {
    translated = translated.replace(new RegExp(abbr, 'g'), full)
  })

  return translated
}
