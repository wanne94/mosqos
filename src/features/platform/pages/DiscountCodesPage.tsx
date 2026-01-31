import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Copy, Trash2, Check, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { ConfirmDeleteModal } from '@/shared/components/ConfirmDeleteModal'

type DiscountType = 'percentage' | 'fixed' | 'trial_extension' | 'free_months'

interface Coupon {
  id: string
  code: string
  name: string
  description: string | null
  discount_type: DiscountType
  discount_value: number
  duration_months: number | null
  currency: string
  usage_limit: number | null
  usage_limit_per_org: number
  current_usage: number
  is_active: boolean
  starts_at: string | null
  expires_at: string | null
  created_at: string
}

interface FormData {
  code: string
  name: string
  discount_type: DiscountType
  discount_value: string
  usage_limit: string
  expires_at: string
}

const DISCOUNT_TYPE_LABELS: Record<DiscountType, string> = {
  percentage: 'Percentage Off',
  fixed: 'Fixed Amount Off',
  trial_extension: 'Trial Extension (Days)',
  free_months: 'Free Months'
}

export default function DiscountCodesPage() {
  const queryClient = useQueryClient()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [deleteCodeId, setDeleteCodeId] = useState<string | null>(null)
  const [formData, setFormData] = useState<FormData>({
    code: '',
    name: '',
    discount_type: 'percentage',
    discount_value: '',
    usage_limit: '',
    expires_at: ''
  })

  // Fetch coupons
  const { data: codes = [], isLoading } = useQuery({
    queryKey: ['platform-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Coupon[]
    },
  })

  // Create coupon mutation
  const createCodeMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const { error } = await supabase
        .from('coupons')
        .insert([{
          code: data.code.toUpperCase(),
          name: data.name || data.code.toUpperCase(),
          discount_type: data.discount_type,
          discount_value: parseFloat(data.discount_value),
          usage_limit: data.usage_limit ? parseInt(data.usage_limit) : null,
          expires_at: data.expires_at || null,
          is_active: true,
          current_usage: 0,
          usage_limit_per_org: 1,
          currency: 'USD'
        }])

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-coupons'] })
      setShowCreateModal(false)
      setFormData({ code: '', name: '', discount_type: 'percentage', discount_value: '', usage_limit: '', expires_at: '' })
    },
  })

  // Toggle active mutation
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active: !isActive })
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-coupons'] })
    },
  })

  // Delete mutation
  const deleteCodeMutation = useMutation({
    mutationFn: async (codeId: string) => {
      const { error } = await supabase
        .from('coupons')
        .delete()
        .eq('id', codeId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-coupons'] })
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
    if (!formData.code || !formData.discount_value) return
    createCodeMutation.mutate(formData)
  }

  const handleToggleActive = (code: Coupon) => {
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

  const formatDiscountValue = (coupon: Coupon): string => {
    switch (coupon.discount_type) {
      case 'percentage':
        return `${coupon.discount_value}%`
      case 'fixed':
        return `$${coupon.discount_value}`
      case 'trial_extension':
        return `${coupon.discount_value} days`
      case 'free_months':
        return `${coupon.discount_value} months`
      default:
        return `${coupon.discount_value}`
    }
  }

  const getDiscountValuePlaceholder = (type: DiscountType): string => {
    switch (type) {
      case 'percentage':
        return '20'
      case 'fixed':
        return '10.00'
      case 'trial_extension':
        return '14'
      case 'free_months':
        return '1'
      default:
        return ''
    }
  }

  const getDiscountValueLabel = (type: DiscountType): string => {
    switch (type) {
      case 'percentage':
        return 'Discount Percentage'
      case 'fixed':
        return 'Discount Amount ($)'
      case 'trial_extension':
        return 'Trial Extension (Days)'
      case 'free_months':
        return 'Free Months'
      default:
        return 'Discount Value'
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
    totalUses: codes.reduce((sum, c) => sum + (c.current_usage || 0), 0),
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
                <th className="text-left p-4 text-muted-foreground font-medium">Name</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Type</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Discount</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Uses</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Limit</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Expires</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Status</th>
                <th className="text-center p-4 text-muted-foreground font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {codes.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-muted-foreground">
                    No discount codes yet. Create your first one!
                  </td>
                </tr>
              ) : (
                codes.map(code => {
                  const isExpired = code.expires_at && new Date(code.expires_at) < new Date()
                  const isMaxedOut = code.usage_limit && code.current_usage >= code.usage_limit

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
                      <td className="p-4">
                        <span className="text-sm">{code.name}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-xs px-2 py-1 bg-muted dark:bg-slate-700 rounded-full">
                          {code.discount_type.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-green-600 dark:text-green-400 font-bold text-lg">
                          {formatDiscountValue(code)}
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        <span>{code.current_usage || 0}</span>
                      </td>
                      <td className="p-4 text-center">
                        <span className="text-muted-foreground">
                          {code.usage_limit || 'Unlimited'}
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
                  Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Summer Sale 2024"
                />
                <p className="text-xs text-muted-foreground mt-1">A friendly name for this coupon</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Discount Type
                </label>
                <select
                  value={formData.discount_type}
                  onChange={(e) => setFormData({ ...formData, discount_type: e.target.value as DiscountType, discount_value: '' })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  {Object.entries(DISCOUNT_TYPE_LABELS).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  {getDiscountValueLabel(formData.discount_type)}
                </label>
                <input
                  type="number"
                  min="1"
                  max={formData.discount_type === 'percentage' ? '100' : undefined}
                  step={formData.discount_type === 'fixed' ? '0.01' : '1'}
                  value={formData.discount_value}
                  onChange={(e) => setFormData({ ...formData, discount_value: e.target.value })}
                  className="w-full px-4 py-2 bg-background dark:bg-slate-700 border border-border dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder={getDiscountValuePlaceholder(formData.discount_type)}
                />
                {formData.discount_type === 'percentage' && (
                  <p className="text-xs text-muted-foreground mt-1">Enter a value between 1 and 100</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Usage Limit (Optional)
                </label>
                <input
                  type="number"
                  min="1"
                  value={formData.usage_limit}
                  onChange={(e) => setFormData({ ...formData, usage_limit: e.target.value })}
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
                  disabled={!formData.code || !formData.discount_value || createCodeMutation.isPending}
                  className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {createCodeMutation.isPending ? 'Creating...' : 'Create Code'}
                </button>
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setFormData({ code: '', name: '', discount_type: 'percentage', discount_value: '', usage_limit: '', expires_at: '' })
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
