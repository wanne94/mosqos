# Shared Library Utilities

Core utility functions migrated from MosqOS and enhanced for Mosque SaaS.

## Overview

This directory contains essential utilities used across the application:

- **logger.ts** - Production-safe logging utility
- **errorHandler.ts** - Centralized error handling
- **excelExport.ts** - Excel/CSV export functionality
- **pdfGenerator.ts** - PDF generation for invoices and reports

## Installation

Some utilities require additional dependencies:

```bash
# For Excel export functionality
npm install xlsx

# For PDF generation functionality
npm install jspdf jspdf-autotable

# Optional: Type definitions
npm install -D @types/jspdf
```

## Usage

### Logger

Production-safe logging that automatically disables console logs in production builds.

```typescript
import { logger } from '@/shared/lib'

// General logging (disabled in production)
logger.log('Debug information')
logger.info('Informational message')
logger.debug('Debug details')
logger.warn('Warning message')
logger.table(data) // Display data as table

// Error logging (always enabled, even in production)
logger.error('Critical error', error)
```

### Error Handler

Centralized error handling with toast notifications and validation support.

```typescript
import { handleError, withErrorHandling, handleValidationErrors } from '@/shared/lib'

// Basic error handling
try {
  await someOperation()
} catch (error) {
  handleError(error, 'Operation failed')
}

// With custom options
handleError(error, 'Custom message', {
  showToast: true,
  logToConsole: true,
  onError: (err, msg) => {
    // Custom handling
  }
})

// Async wrapper with automatic error handling
const { data, error } = await withErrorHandling(
  fetchUserData(userId),
  'Failed to load user data'
)

if (error) {
  // Handle error
  return
}

// Use data
console.log(data)

// Validation errors
const errors = {
  email: 'Invalid email format',
  password: 'Password too short'
}
handleValidationErrors(errors, 'Please fix the following errors')
```

### Excel Export

Export data to Excel or CSV files with automatic formatting.

```typescript
import { exportToExcel, exportToCSV, exportMultipleSheets } from '@/shared/lib'
import type { ExcelColumn } from '@/shared/lib'

// Define columns
const columns: ExcelColumn[] = [
  { key: 'name', label: 'Full Name' },
  { key: 'email', label: 'Email Address' },
  {
    key: 'amount',
    label: 'Amount',
    formatter: (value) => `$${Number(value).toFixed(2)}`
  }
]

// Export to Excel
exportToExcel(data, columns, {
  filename: 'users',
  includeTimestamp: true,
  sheetName: 'User List'
})

// Export to CSV
exportToCSV(data, columns, {
  filename: 'users',
  includeTimestamp: true
})

// Export multiple sheets
exportMultipleSheets([
  {
    name: 'Users',
    data: usersData,
    columns: usersColumns
  },
  {
    name: 'Orders',
    data: ordersData,
    columns: ordersColumns
  }
], 'report')
```

### PDF Generator

Generate professional PDF documents for invoices, receipts, and reports.

```typescript
import {
  generateInvoice,
  generateReceipt,
  generateReport,
  isPDFAvailable
} from '@/shared/lib'
import type { InvoiceData, CustomerInfo, PDFOptions } from '@/shared/lib'

// Check if PDF generation is available
if (await isPDFAvailable()) {
  // Invoice data
  const invoice: InvoiceData = {
    id: '12345',
    date: '2024-01-29',
    amount: 150.00,
    items: [
      {
        description: 'Service Fee',
        quantity: 1,
        unitPrice: 150,
        total: 150
      }
    ],
    status: 'paid'
  }

  // Customer information
  const customer: CustomerInfo = {
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0123'
  }

  // PDF options
  const options: PDFOptions = {
    organization: {
      name: 'My Mosque',
      address: '123 Main St',
      email: 'info@mymosque.org'
    },
    headerColor: [16, 185, 129], // RGB color
    footerText: 'Thank you for your support.'
  }

  // Generate invoice
  await generateInvoice(invoice, customer, options)

  // Generate receipt
  await generateReceipt(invoice, customer, options)

  // Generate report
  await generateReport(
    'Monthly Report',
    reportData,
    [
      { key: 'date', label: 'Date' },
      { key: 'description', label: 'Description' },
      { key: 'amount', label: 'Amount' }
    ],
    options
  )
}
```

## TypeScript Support

All utilities are fully typed with TypeScript:

- Proper type definitions for all functions
- Generic types for flexible usage
- JSDoc comments for IDE autocomplete
- Type exports for external use

## Browser and Server Compatibility

These utilities are designed to work in both client and server environments:

- **logger**: Works in browser (Vite) and Node.js
- **errorHandler**: Client-side with optional toast notifications
- **excelExport**: Browser-only (requires DOM for file download)
- **pdfGenerator**: Browser-only (requires jsPDF)

## Migration Notes

Migrated from MosqOS with the following improvements:

1. **TypeScript Conversion**: All utilities converted from JavaScript to TypeScript
2. **Type Safety**: Added proper TypeScript types and interfaces
3. **Documentation**: Enhanced JSDoc comments for better IDE support
4. **Flexibility**: Made utilities more configurable with options
5. **Error Handling**: Improved error messages and edge case handling
6. **Environment Detection**: Better handling of browser vs Node.js environments

## Contributing

When adding new utilities:

1. Create a new `.ts` file in this directory
2. Add proper TypeScript types
3. Include JSDoc comments
4. Export from `index.ts`
5. Update this README with usage examples
6. Test in both development and production builds
