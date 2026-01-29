import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Copy, Trash2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ConfirmDeleteModal } from '@/shared/components/ConfirmDeleteModal'

interface DiscountCode {
  id: string
  code: string
  discount_percent: number
  max_uses: number | null
  expires_at: string | null
  is_active: boolean
  uses_count: number
  created_at: string
}

interface FormData {
  code: string
  discount_percent: string
  max_uses: string
  expires_at: string
}

export default function DiscountCodesPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    code: '',
    discount_percent: '',
    max_uses: '',
    expires_at: ''
  })

  // Fetch discount codes
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['platform-discount-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('discount_codes')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as DiscountCode[]
    },
  })

  // Create discount code mutation
  const createCodeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await (supabase
        .from('discount_codes') as any)
        .insert([{
          code: data.code.toUpperCase(),
          discount_percent: parseFloat(data.discount_percent),
          max_uses: data.max_uses ? parseInt(data.max_uses) : null,
          expires_at: data.expires_at || null,
          is_active: true,
          uses_count: 0
        }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-discount-codes'] })
      setShowCreateModal(false)
      setFormData({ code: '', discount_percent: '', max_uses: '', expires_at: '' })
    },
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await (supabase
        .from('discount_codes') as any)
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-discount-codes'] })
    },
  })

  // Delete mutation
  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from('discount_codes')
        .delete()
        .eq('id', codeId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-discount-codes'] })
      setDeleteCodeId(null)
    },
  })

  const generateCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let result = ''
    for (let i = 0; i < 8; i++) {
      result += characters.charAt(Math.floor(Math.random() * characters.length))
    }
    setFormData({ ...formData, code: result })
  }

  const handleCreateCode = () => {
    if (!formData.code || !formData.discount_percent) return
    createCodeMutation.mutate(formData)
  }

  const handleToggleActive = (code: DiscountCode) => {
    toggleActiveMutation.mutate({ id: code.id, isActive: code.is_active })
  }

  const handleDeleteCode = (codeId: string) => {
    deleteCodeMutation.mutate(codeId)
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    )
  }

  const stats = {
    total: codes.length,
    active: codes.filter(c => c.is_active).length,
    totalUses: codes.reduce((sum, c) => sum + (c.uses_count || 0), 0),
    expired: codes.filter(c => c.expires_at && new Date(c.expires_at) < new Date()).length
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Discount Codes</h1>
          <p className="text-muted-foreground mt-1">Generate and manage discount codes for your clients</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
        >
          <Plus size={20} />
          Create Code
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-4">
          <div className="text-muted-foreground text-sm">Total Codes</div>
          <div className="text-2xl font-bold mt-1">{stats.total}</div>
        </div>
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-4">
          <div className="text-muted-foreground text-sm">Active Codes</div>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{stats.active}</div>
        </div>
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-4">
          <div className="text-muted-foreground text-sm">Total Uses</div>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{stats.totalUses}</div>
        </div>
        <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-4">
          <div className="text-muted-foreground text-sm">Expired Codes</div>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{stats.expired}</div>
        </div>
      </div>

      {/* Codes Table */}
      <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border dark:border-slate-700">
                <th className="text-left p-4 text-muted-foreground font-medium">Code</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Discount</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Uses</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Max Uses</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Expires</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No discount codes yet. Create your first one!
                  </td>
                </tr>
              ) : (
                codes.map(code => {
                  const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
                  const isMaxedOut = code.max_uses && code.uses_count >= code.max_uses

                  return (
                    <tr key={code.id} className="border-b border-border dark:border-slate-700/50">
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold">{code.code}</span>
                          <button
                            onClick={() => copyToClipboard(code.code)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title="Copy to clipboard"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                          {code.discount_percent}%
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span>{code.uses_count || 0}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-muted-foreground">
                          {code.max_uses || 'Unlimited'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`text-sm ${isExpired ? 'text-red-600 dark:text-red-400' : 'text-muted-foreground'}`}>
                          {code.expires_at
                            ? new Date(code.expires_at).toLocaleDateString()
                            : 'Never'}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={() => handleToggleActive(code)}
                          className={`px-2 py-1 text-xs rounded-full ${
                            code.is_active && !isExpired && !isMaxedOut
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                              : 'bg-red-500/20 text-red-600 dark:text-red-400'
                          }`}
                        >
                          {code.is_active && !isExpired && !isMaxedOut ? 'Active' : 'Inactive'}
                        </button>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleToggleActive(code)}
                            className="text-muted-foreground hover:text-primary transition-colors"
                            title={code.is_active ? 'Deactivate' : 'Activate'}
                          >
                            {code.is_active ? <X size={18} /> : <Check size={18} />}
                          </button>
                          <button
                            onClick={() => setDeleteCodeId(code.id)}
                            className="text-muted-foreground hover:text-red-600 dark:hover:text-red-400 transition-colors"
                            title="Delete code"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card dark:bg-slate-800 rounded-xl border dark:border-slate-700 p-6 w-full max-w-md mx-4">
            <h3 className="text-xl font-bold mb-4">Create Discount Code</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Code
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                    className="flex-1 px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg font-mono focus:ring-2 focus:ring-primary focus:border-transparent"
                    placeholder="SUMMER2024"
                  />
                  <button
                    onClick={generateCode}
                    className="px-4 py-2 bg-muted dark:bg-slate-700 rounded-lg hover:bg-muted/80 dark:hover:bg-slate-600 transition-colors"
                  >
                    Generate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Discount Percentage
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  step="1"
                  value={formData.discount_percent}
                  onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="20"
                />
                <p className="text-xs text-muted-foreground mt-1">Enter a value between 1 and 100</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Max Uses (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.max_uses}
                  onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Unlimited"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for unlimited uses</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Expires At (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <p className="text-xs text-muted-foreground mt-1">Leave empty for no expiration</p>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={handleCreateCode}
                  disabled={!formData.code || !formData.discount_percent || createCodeMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCodeMutation.isPending ? 'Creating...' : 'Create Code'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ code: '', discount_percent: '', max_uses: '', expires_at: '' })
                  }}
                  className="flex-1 px-4 py-2 bg-muted dark:bg-slate-700 rounded-lg hover:bg-muted/80 dark:hover:bg-slate-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteCodeId}
        onClose={() => setDeleteCodeId(null)}
        onConfirm={() => deleteCodeId && handleDeleteCode(deleteCodeId)}
        title="Delete Discount Code"
        message="Are you sure you want to delete this discount code? This action cannot be undone."
        isLoading={deleteCodeMutation.isPending}
      />
    </div>
  )
}
