/**
 * Excel export utility
 * Provides functionality to export data to Excel/CSV files
 *
 * @module excelExport
 * @description Export utilities for generating Excel files from data
 */

import * as XLSX from 'xlsx'

/**
 * Column definition for Excel export
 */
export interface ExcelColumn {
  /** The data key to extract from each row */
  key: string
  /** The column header label */
  label: string
  /** Optional custom formatter function */
  formatter?: (value: unknown) => string | number
}

/**
 * Export options
 */
export interface ExcelExportOptions {
  /** Name of the file without extension (default: 'export') */
  filename?: string
  /** Name of the worksheet (default: 'Sheet1') */
  sheetName?: string
  /** Include timestamp in filename (default: true) */
  includeTimestamp?: boolean
  /** Custom date format for timestamps */
  dateFormat?: 'ISO' | 'local'
  /** Minimum column width (default: 10) */
  minColumnWidth?: number
  /** Maximum column width (default: 50) */
  maxColumnWidth?: number
}

/**
 * Format a value for Excel cell
 *
 * @param value - The value to format
 * @returns Formatted string or number
 */
function formatCellValue(value: unknown): string | number {
  // Handle null/undefined
  if (value == null) {
    return ''
  }

  // Handle dates
  if (value instanceof Date) {
    return value.toLocaleDateString()
  }

  // Handle arrays
  if (Array.isArray(value)) {
    return value.join(', ')
  }

  // Handle nested objects
  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  // Handle booleans
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No'
  }

  // Handle numbers
  if (typeof value === 'number') {
    return value
  }

  // Handle strings
  return String(value)
}

/**
 * Export data to Excel file
 *
 * @param data - Array of objects to export
 * @param columns - Array of column definitions
 * @param options - Export options
 *
 * @example
 * ```typescript
 * const data = [
 *   { name: 'John Doe', email: 'john@example.com', age: 30 },
 *   { name: 'Jane Smith', email: 'jane@example.com', age: 25 }
 * ]
 *
 * const columns = [
 *   { key: 'name', label: 'Full Name' },
 *   { key: 'email', label: 'Email Address' },
 *   { key: 'age', label: 'Age' }
 * ]
 *
 * exportToExcel(data, columns, { filename: 'users' })
 * ```
 */
export function exportToExcel(
  data: Record<string, unknown>[],
  columns: ExcelColumn[],
  options: ExcelExportOptions = {}
): void {
  const {
    filename = 'export',
    sheetName = 'Sheet1',
    includeTimestamp = true,
    dateFormat = 'ISO',
    minColumnWidth = 10,
    maxColumnWidth = 50,
  } = options

  // Validate data
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Create worksheet data with headers
  const worksheetData: (string | number)[][] = [columns.map((col) => col.label)]

  // Add data rows
  data.forEach((row) => {
    const rowData = columns.map((col) => {
      const value = row[col.key]

      // Use custom formatter if provided
      if (col.formatter) {
        return col.formatter(value)
      }

      return formatCellValue(value)
    })
    worksheetData.push(rowData)
  })

  // Create workbook and worksheet
  const wb = XLSX.utils.book_new()
  const ws = XLSX.utils.aoa_to_sheet(worksheetData)

  // Set column widths based on content
  const colWidths = columns.map((col, index) => {
    const maxLength = Math.max(
      col.label.length,
      ...data.map((row) => {
        const value = row[col.key]
        if (value == null) return 0
        const str = String(value)
        return str.length
      })
    )
    return { wch: Math.min(Math.max(maxLength, minColumnWidth), maxColumnWidth) }
  })
  ws['!cols'] = colWidths

  // Add worksheet to workbook
  XLSX.utils.book_append_sheet(wb, ws, sheetName)

  // Generate filename with optional timestamp
  let finalFilename = filename
  if (includeTimestamp) {
    const timestamp =
      dateFormat === 'ISO'
        ? new Date().toISOString().split('T')[0]
        : new Date().toLocaleDateString().replace(/\//g, '-')
    finalFilename = `${filename}_${timestamp}`
  }
  finalFilename = `${finalFilename}.xlsx`

  // Write file
  XLSX.writeFile(wb, finalFilename)
}

/**
 * Export data to CSV file
 *
 * @param data - Array of objects to export
 * @param columns - Array of column definitions
 * @param options - Export options
 *
 * @example
 * ```typescript
 * exportToCSV(data, columns, { filename: 'users' })
 * ```
 */
export function exportToCSV(
  data: Record<string, unknown>[],
  columns: ExcelColumn[],
  options: ExcelExportOptions = {}
): void {
  const {
    filename = 'export',
    includeTimestamp = true,
    dateFormat = 'ISO',
  } = options

  // Validate data
  if (!data || data.length === 0) {
    alert('No data to export')
    return
  }

  // Create CSV content
  const headers = columns.map((col) => col.label).join(',')
  const rows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key]
        const formatted = col.formatter ? col.formatter(value) : formatCellValue(value)
        // Escape values containing commas or quotes
        const stringValue = String(formatted)
        if (stringValue.includes(',') || stringValue.includes('"')) {
          return `"${stringValue.replace(/"/g, '""')}"`
        }
        return stringValue
      })
      .join(',')
  )

  const csvContent = [headers, ...rows].join('\n')

  // Generate filename with optional timestamp
  let finalFilename = filename
  if (includeTimestamp) {
    const timestamp =
      dateFormat === 'ISO'
        ? new Date().toISOString().split('T')[0]
        : new Date().toLocaleDateString().replace(/\//g, '-')
    finalFilename = `${filename}_${timestamp}`
  }
  finalFilename = `${finalFilename}.csv`

  // Create blob and download
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)

  link.setAttribute('href', url)
  link.setAttribute('download', finalFilename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/**
 * Export multiple sheets to a single Excel file
 *
 * @param sheets - Array of sheet data with names, data, and columns
 * @param filename - Name of the file without extension
 *
 * @example
 * ```typescript
 * exportMultipleSheets([
 *   {
 *     name: 'Users',
 *     data: usersData,
 *     columns: usersColumns
 *   },
 *   {
 *     name: 'Orders',
 *     data: ordersData,
 *     columns: ordersColumns
 *   }
 * ], 'report')
 * ```
 */
export function exportMultipleSheets(
  sheets: Array<{
    name: string
    data: Record<string, unknown>[]
    columns: ExcelColumn[]
  }>,
  filename = 'export'
): void {
  if (!sheets || sheets.length === 0) {
    alert('No data to export')
    return
  }

  const wb = XLSX.utils.book_new()

  sheets.forEach(({ name, data, columns }) => {
    if (data.length === 0) return

    // Create worksheet data
    const worksheetData: (string | number)[][] = [columns.map((col) => col.label)]

    data.forEach((row) => {
      const rowData = columns.map((col) => {
        const value = row[col.key]
        return col.formatter ? col.formatter(value) : formatCellValue(value)
      })
      worksheetData.push(rowData)
    })

    // Create worksheet
    const ws = XLSX.utils.aoa_to_sheet(worksheetData)

    // Set column widths
    const colWidths = columns.map((col) => {
      const maxLength = Math.max(
        col.label.length,
        ...data.map((row) => String(row[col.key] || '').length)
      )
      return { wch: Math.min(Math.max(maxLength, 10), 50) }
    })
    ws['!cols'] = colWidths

    // Add to workbook
    XLSX.utils.book_append_sheet(wb, ws, name)
  })

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().split('T')[0]
  const finalFilename = `${filename}_${timestamp}.xlsx`

  // Write file
  XLSX.writeFile(wb, finalFilename)
}
