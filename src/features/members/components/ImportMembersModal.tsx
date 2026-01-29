import { useState } from 'react'
import { X, Upload } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useEscapeKey } from '@/shared/hooks'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import type { CreateMemberInput } from '../types/members.types'

export interface ImportMembersModalProps {
  /** Controls modal visibility */
  isOpen: boolean
  /** Called when modal is closed */
  onClose: () => void
  /** Called after successful import */
  onSave?: () => void
}

interface PreviewRow {
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  role?: string
  status?: string
  date_of_birth?: string
  tags?: string
  notes?: string
}

/**
 * Modal for importing members from CSV file
 *
 * @example
 * <ImportMembersModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onSave={handleRefresh}
 * />
 */
export function ImportMembersModal({ isOpen, onClose, onSave }: ImportMembersModalProps) {
  const { currentOrganization } = useOrganization()
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<PreviewRow[]>([])
  const [error, setError] = useState('')

  useEscapeKey(onClose, { enabled: isOpen })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (!selectedFile) return

    if (!selectedFile.name.endsWith('.csv')) {
      setError('Please select a CSV file')
      return
    }

    setFile(selectedFile)
    setError('')

    // Read and preview the file
    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result as string
      const lines = text.split('\n').filter((line) => line.trim())
      const headers = lines[0].split(',').map((h) => h.replace(/"/g, '').trim())
      const rows = lines.slice(1, 6).map((line) => {
        const values = line.split(',').map((v) => v.replace(/"/g, '').trim())
        const row: PreviewRow = {}
        headers.forEach((header, index) => {
          const key = header.toLowerCase().replace(/\s+/g, '_') as keyof PreviewRow
          row[key] = values[index] || ''
        })
        return row
      })
      setPreview(rows)
    }
    reader.readAsText(selectedFile)
  }

  const handleImport = async () => {
    if (!file || !currentOrganization?.id) return

    setLoading(true)
    setError('')

    try {
      const text = await file.text()
      const lines = text.split('\n').filter((line) => line.trim())
      const headers = lines[0]
        .split(',')
        .map((h) => h.replace(/"/g, '').trim().toLowerCase().replace(/\s+/g, '_'))

      const members: CreateMemberInput[] = []
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map((v) => v.replace(/"/g, '').trim())
        if (values.every((v) => !v)) continue // Skip empty rows

        const member: Partial<CreateMemberInput> = {
          organization_id: currentOrganization.id,
        }

        headers.forEach((header, index) => {
          const value = values[index] || ''
          if (header === 'first_name' || header === 'firstname') {
            member.first_name = value
          } else if (header === 'last_name' || header === 'lastname') {
            member.last_name = value
          } else if (header === 'email') {
            member.email = value || null
          } else if (header === 'phone') {
            member.phone = value || null
          } else if (header === 'date_of_birth' || header === 'dob') {
            member.date_of_birth = value || null
          } else if (header === 'notes') {
            member.notes = value || null
          }
        })

        if (member.first_name && member.last_name) {
          // Set defaults
          member.membership_status = 'active'
          member.membership_type = 'individual'
          member.self_registered = false
          member.joined_date = new Date().toISOString().split('T')[0]
          members.push(member as CreateMemberInput)
        }
      }

      if (members.length === 0) {
        setError('No valid members found in the CSV file')
        setLoading(false)
        return
      }

      // Insert members in batches
      const batchSize = 100
      for (let i = 0; i < members.length; i += batchSize) {
        const batch = members.slice(i, i + batchSize)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: insertError } = await (supabase as any).from('members').insert(batch)
        if (insertError) throw insertError
      }

      if (onSave) {
        onSave()
      }

      onClose()
      setFile(null)
      setPreview([])
      alert(`Successfully imported ${members.length} members!`)
    } catch (error) {
      console.error('Error importing members:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      setError(`Failed to import members: ${errorMessage}`)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700 sticky top-0 bg-white dark:bg-slate-800">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Import Members from CSV
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
              Select CSV File
            </label>
            <div className="flex items-center gap-4">
              <label className="flex-1 cursor-pointer">
                <input
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors">
                  <Upload size={20} className="text-slate-400 dark:text-slate-500" />
                  <span className="text-slate-600 dark:text-slate-400">
                    {file ? file.name : 'Choose CSV file'}
                  </span>
                </div>
              </label>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
              CSV should include columns: first_name, last_name, email, phone, date_of_birth, notes
            </p>
          </div>

          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {preview.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Preview (first 5 rows):
              </h3>
              <div className="border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 dark:bg-slate-900">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">
                        First Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">
                        Last Name
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">
                        Email
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-slate-600 dark:text-slate-400">
                        Phone
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                    {preview.map((row, index) => (
                      <tr key={index} className="dark:text-slate-300">
                        <td className="px-3 py-2">{row.first_name || '—'}</td>
                        <td className="px-3 py-2">{row.last_name || '—'}</td>
                        <td className="px-3 py-2">{row.email || '—'}</td>
                        <td className="px-3 py-2">{row.phone || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleImport}
              disabled={loading || !file}
              className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Importing...' : 'Import Members'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ImportMembersModal
