import { useState } from 'react'
import { Plus, Search, Download, Edit, Trash2, Users } from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useHouseholds } from '../hooks'

export default function HouseholdsPage() {
  const { currentOrganization } = useOrganization()
  const [searchQuery, setSearchQuery] = useState('')

  // Use households hook
  const {
    households,
    isLoading,
    error,
    stats,
  } = useHouseholds({
    organizationId: currentOrganization?.id,
    filters: {
      search: searchQuery || undefined,
    },
  })

  const handleExport = () => {
    if (households.length === 0) return

    const headers = ['Name', 'Address', 'City', 'State', 'Member Count']
    const rows = households.map(household => [
      household.name || '',
      household.address || '',
      household.city || '',
      household.state || '',
      '0', // TODO: Get actual member count
    ])

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `households_${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Households</h1>
          <p className="text-slate-600 dark:text-slate-400 mt-2 text-sm sm:text-base">
            Manage household information and members
          </p>
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm sm:text-base">
          <Plus size={18} />
          Add Household
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg p-6 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-lg">
                <Users className="text-emerald-600 dark:text-emerald-400" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Total Households</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stats.total || 0}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search households..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition text-slate-700 dark:text-slate-300"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-slate-800 border dark:border-slate-700 rounded-lg overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-100 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                  Address
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                  City
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                  Members
                </th>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-slate-900 dark:text-slate-200 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {/* Loading state */}
              {isLoading && (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-slate-600 dark:text-slate-400">
                    Loading households...
                  </td>
                </tr>
              )}

              {/* Error state */}
              {error && (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-8 text-center text-red-600 dark:text-red-400">
                    Error loading households. Please try again.
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!isLoading && !error && households.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 sm:px-6 py-12 text-center">
                    <Users className="mx-auto text-slate-400 dark:text-slate-500 mb-4" size={48} />
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
                      No households yet
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">
                      Add your first household to get started
                    </p>
                    <button className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors">
                      <Plus size={18} />
                      Add First Household
                    </button>
                  </td>
                </tr>
              )}

              {/* Households list */}
              {!isLoading && !error && households.map((household) => (
                <tr
                  key={household.id}
                  className="hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer transition-colors"
                >
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-semibold text-slate-900 dark:text-slate-200">
                      {household.name}
                    </div>
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {household.address || '—'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {household.city || '—'}
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-400">
                    {/* TODO: Show actual member count */}
                    0 members
                  </td>
                  <td className="px-3 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex items-center gap-2">
                      <button
                        className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="Edit household"
                      >
                        <Edit size={16} />
                      </button>
                      <button
                        className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Delete household"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between mt-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Showing {households.length} of {stats?.total || households.length} households
        </p>
        <div className="flex gap-2">
          <button
            disabled
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled
            className="px-3 py-1 border border-slate-300 dark:border-slate-600 rounded-md text-sm text-slate-700 dark:text-slate-300 disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
