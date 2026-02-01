import { useState } from 'react'
import { Plus, Search, Filter, Download, Upload, Edit, Trash2 } from 'lucide-react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useMembers } from '../hooks'

export default function MembersPage() {
  const { currentOrganization } = useOrganization()
  const [searchQuery, setSearchQuery] = useState('')

  // Use members hook
  const {
    members,
    isLoading,
    error,
    stats,
  } = useMembers({
    organizationId: currentOrganization?.id,
    filters: {
      search: searchQuery || undefined,
    },
  })

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Members</h1>
          <p className="text-muted-foreground">
            Manage your community members
          </p>
        </div>
        <button className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium hover:opacity-90 transition">
          <Plus className="w-4 h-4" />
          Add Member
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search members..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>
        <div className="flex gap-2">
          <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition">
            <Upload className="w-4 h-4" />
            Import
          </button>
          <button className="inline-flex items-center gap-2 px-4 py-2 border rounded-md hover:bg-muted transition">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-xl bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Status</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {/* Loading state */}
              {isLoading && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-muted-foreground">Loading members...</div>
                  </td>
                </tr>
              )}

              {/* Error state */}
              {error && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-destructive">
                      Error loading members. Please try again.
                    </div>
                  </td>
                </tr>
              )}

              {/* Empty state */}
              {!isLoading && !error && members.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="text-muted-foreground">
                      <p className="font-medium">No members yet</p>
                      <p className="text-sm">
                        Add your first member to get started
                      </p>
                      <button className="mt-4 inline-flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover:opacity-90 transition">
                        <Plus className="w-4 h-4" />
                        Add Member
                      </button>
                    </div>
                  </td>
                </tr>
              )}

              {/* Members list */}
              {!isLoading && !error && members.map((member) => (
                <tr key={member.id} className="hover:bg-muted/50 transition">
                  <td className="px-4 py-3">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {member.first_name} {member.last_name}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {member.email || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {member.phone || '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      member.membership_status === 'active'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : member.membership_status === 'inactive'
                        ? 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                    }`}>
                      {member.membership_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-muted-foreground">
                    {new Date(member.joined_date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button
                        className="p-1 hover:bg-muted rounded transition"
                        title="Edit member"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        className="p-1 hover:bg-destructive/10 text-destructive rounded transition"
                        title="Delete member"
                      >
                        <Trash2 className="w-4 h-4" />
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
        <p className="text-sm text-muted-foreground">
          Showing {members.length} of {stats?.total || members.length} members
        </p>
        <div className="flex gap-2">
          <button
            disabled
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <button
            disabled
            className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  )
}
