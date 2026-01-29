/**
 * Utility function to export data to Excel
 * Simple CSV export that opens in Excel
 */

interface ExportColumn {
  key: string
  label: string
}

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (!data || data.length === 0) {
    console.warn('No data to export')
    return
  }

  // Create CSV content
  const headers = columns.map(col => col.label).join(',')
  const rows = data.map(item => {
    return columns.map(col => {
      const value = item[col.key]
      // Escape quotes and wrap in quotes if contains comma
      if (value === null || value === undefined) return ''
      const stringValue = String(value).replace(/"/g, '""')
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue
    }).join(',')
  })

  const csvContent = [headers, ...rows].join('\n')

  // Create download link
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  URL.revokeObjectURL(url)
}
