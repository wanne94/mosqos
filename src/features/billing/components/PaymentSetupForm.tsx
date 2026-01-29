import { useState } from 'react'
import { Globe, Lock, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useOrganization } from '@/hooks/useOrganization'

interface PaymentSetupFormProps {
  onComplete: () => void
  onSkip: () => void
}

interface PaymentConfig {
  // Stripe fields
  stripe_account_id: string
  stripe_secret_key: string
  stripe_publishable_key: string
  // iyzico fields (Turkey)
  iyzico_api_key: string
  iyzico_secret_key: string
  iyzico_merchant_id: string
}

/**
 * PaymentSetupForm - Configure payment provider (Stripe or iyzico)
 *
 * Shows different fields based on organization country:
 * - Turkey (TR): iyzico
 * - Other countries: Stripe
 */
export default function PaymentSetupForm({ onComplete, onSkip }: PaymentSetupFormProps) {
  const { currentOrganizationId } = useOrganization()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Determine country (default to US if not set)
  const [organizationCountry] = useState('US')
  const isIyzico = organizationCountry === 'TR'

  // Payment config state
  const [paymentConfig, setPaymentConfig] = useState<PaymentConfig>({
    stripe_account_id: '',
    stripe_secret_key: '',
    stripe_publishable_key: '',
    iyzico_api_key: '',
    iyzico_secret_key: '',
    iyzico_merchant_id: '',
  })

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      if (!currentOrganizationId) {
        setError('No organization selected')
        return
      }

      // Determine provider based on country
      const provider = isIyzico ? 'iyzico' : 'stripe'

      // Validate required fields
      if (isIyzico) {
        if (!paymentConfig.iyzico_api_key || !paymentConfig.iyzico_secret_key || !paymentConfig.iyzico_merchant_id) {
          setError('Please fill in all iyzico fields')
          setSaving(false)
          return
        }
      } else {
        if (!paymentConfig.stripe_account_id || !paymentConfig.stripe_secret_key || !paymentConfig.stripe_publishable_key) {
          setError('Please fill in all Stripe fields')
          setSaving(false)
          return
        }
      }

      const updateData = {
        payment_provider: provider,
        stripe_account_id: paymentConfig.stripe_account_id || null,
        stripe_secret_key: paymentConfig.stripe_secret_key || null,
        stripe_publishable_key: paymentConfig.stripe_publishable_key || null,
        iyzico_api_key: paymentConfig.iyzico_api_key || null,
        iyzico_secret_key: paymentConfig.iyzico_secret_key || null,
        iyzico_merchant_id: paymentConfig.iyzico_merchant_id || null,
      }

      const { error: updateError } = await supabase
        .from('organization_settings')
        .update(updateData as any)
        .eq('id', currentOrganizationId)

      if (updateError) throw updateError

      onComplete()
    } catch (err) {
      console.error('Error saving payment config:', err)
      setError(err instanceof Error ? err.message : 'Failed to save payment configuration')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-slate-300 dark:text-slate-400 mb-4">
          Configure your payment provider to start accepting online donations and tuition payments.
        </p>

        {/* Country indicator */}
        <div className="mb-6 p-3 bg-slate-700/50 dark:bg-slate-800/50 rounded-lg border border-slate-600 dark:border-slate-700 flex items-center gap-2">
          <Globe size={16} className="text-slate-400 dark:text-slate-500" />
          <span className="text-sm text-slate-300 dark:text-slate-400">
            Payment provider for your country:
            <span className="font-medium text-white dark:text-slate-200 ml-1">
              {isIyzico ? 'Turkey (iyzico)' : `${organizationCountry} (Stripe)`}
            </span>
          </span>
        </div>
      </div>

      {/* Conditional rendering based on country */}
      {isIyzico ? (
        /* iyzico Form for Turkey */
        <div className="p-4 bg-blue-600/10 dark:bg-blue-900/20 rounded-lg border border-blue-600/30 dark:border-blue-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white dark:text-slate-100">iyzico</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Türkiye'nin lider ödeme altyapısı</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-400 mb-2">API Key</label>
              <input
                type="text"
                value={paymentConfig.iyzico_api_key}
                onChange={(e) => setPaymentConfig(prev => ({ ...prev, iyzico_api_key: e.target.value }))}
                placeholder="sandbox-..."
                className="w-full px-3 py-2 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-lg text-white placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-400 mb-2">Secret Key</label>
              <input
                type="password"
                value={paymentConfig.iyzico_secret_key}
                onChange={(e) => setPaymentConfig(prev => ({ ...prev, iyzico_secret_key: e.target.value }))}
                placeholder="sandbox-..."
                className="w-full px-3 py-2 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-lg text-white placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-600 mt-1 flex items-center gap-1">
                <Lock size={10} />
                Your secret key is encrypted and stored securely
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-400 mb-2">Merchant ID (Üye İşyeri No)</label>
              <input
                type="text"
                value={paymentConfig.iyzico_merchant_id}
                onChange={(e) => setPaymentConfig(prev => ({ ...prev, iyzico_merchant_id: e.target.value }))}
                placeholder="12345678"
                className="w-full px-3 py-2 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-lg text-white placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
            </div>

            <div className="pt-3 border-t border-blue-600/30 dark:border-blue-800">
              <p className="text-xs text-blue-400 dark:text-blue-300">
                iyzico hesabınız yok mu?{' '}
                <a
                  href="https://www.iyzico.com/uye-isyeri-basvurusu"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-blue-300 dark:hover:text-blue-200"
                >
                  Buradan başvurun
                </a>
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Stripe Form for other countries */
        <div className="p-4 bg-purple-600/10 dark:bg-purple-900/20 rounded-lg border border-purple-600/30 dark:border-purple-800">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 bg-purple-600 dark:bg-purple-500 rounded-lg flex items-center justify-center">
              <CreditCard className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-white dark:text-slate-100">Stripe</h3>
              <p className="text-xs text-slate-400 dark:text-slate-500">Global payment processing</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-400 mb-2">Account ID</label>
              <input
                type="text"
                value={paymentConfig.stripe_account_id}
                onChange={(e) => setPaymentConfig(prev => ({ ...prev, stripe_account_id: e.target.value }))}
                placeholder="acct_..."
                className="w-full px-3 py-2 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-lg text-white placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-400 mb-2">Publishable Key</label>
              <input
                type="text"
                value={paymentConfig.stripe_publishable_key}
                onChange={(e) => setPaymentConfig(prev => ({ ...prev, stripe_publishable_key: e.target.value }))}
                placeholder="pk_..."
                className="w-full px-3 py-2 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-lg text-white placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 dark:text-slate-400 mb-2">Secret Key</label>
              <input
                type="password"
                value={paymentConfig.stripe_secret_key}
                onChange={(e) => setPaymentConfig(prev => ({ ...prev, stripe_secret_key: e.target.value }))}
                placeholder="sk_..."
                className="w-full px-3 py-2 bg-slate-900 dark:bg-slate-950 border border-slate-700 dark:border-slate-800 rounded-lg text-white placeholder-slate-500 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
              />
              <p className="text-xs text-slate-500 dark:text-slate-600 mt-1 flex items-center gap-1">
                <Lock size={10} />
                Your secret key is encrypted and stored securely
              </p>
            </div>

            <div className="pt-3 border-t border-purple-600/30 dark:border-purple-800">
              <p className="text-xs text-purple-400 dark:text-purple-300">
                Don't have a Stripe account?{' '}
                <a
                  href="https://dashboard.stripe.com/register"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium underline hover:text-purple-300 dark:hover:text-purple-200"
                >
                  Sign up here
                </a>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-700 dark:border-slate-800">
        <button
          onClick={onSkip}
          className="px-4 py-2 text-slate-400 dark:text-slate-500 hover:text-white dark:hover:text-slate-300 transition-colors"
        >
          Skip for now
        </button>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-purple-600 hover:bg-purple-700 dark:bg-purple-500 dark:hover:bg-purple-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          {saving ? 'Saving...' : 'Save & Continue'}
        </button>
      </div>
    </div>
  )
}
