/**
 * Ramadan Dashboard Page
 * Overview of Ramadan activities and settings
 */

'use client'

import { useState } from 'react'
import { useOrganization } from '@/app/providers/OrganizationProvider'
import { useTheme } from '@/app/providers/ThemeProvider'
import { Link, useParams } from 'react-router-dom'
import {
  Moon,
  Settings,
  Calculator,
  Calendar,
  Clock,
  Users,
  DollarSign,
  Loader2,
  Check,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { useRamadanSettings, useIftarEvents, useZakatStats } from '../hooks'
import { RamadanCountdown } from '../components/RamadanCountdown'
import { IftarSchedule } from '../components/IftarSchedule'

export default function RamadanDashboardPage() {
  const { currentOrganization } = useOrganization()
  const { slug } = useParams()
  const { ramadanMode, setRamadanMode } = useTheme()

  const {
    settings,
    isLoading,
    currentDay,
    totalDays,
    daysRemaining,
    isRamadan,
    toggleActive,
    isToggling,
  } = useRamadanSettings(currentOrganization?.id)

  const { data: iftarEvents = [], isLoading: loadingIftars } = useIftarEvents(
    currentOrganization?.id,
    5
  )

  const { data: zakatStats } = useZakatStats(currentOrganization?.id)

  const handleToggleRamadanMode = async () => {
    setRamadanMode(!ramadanMode)
    toast.success(ramadanMode ? 'Ramadan mode disabled' : 'Ramadan mode enabled')
  }

  const handleToggleSettings = async () => {
    if (!settings) return
    try {
      await toggleActive({ id: settings.id, isActive: !settings.is_active })
      toast.success(settings.is_active ? 'Ramadan settings deactivated' : 'Ramadan settings activated')
    } catch {
      toast.error('Failed to update settings')
    }
  }

  const formatTime = (timeString: string | null) => {
    if (!timeString) return '--:--'
    const [hours, minutes] = timeString.split(':')
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const displayHour = hour % 12 || 12
    return `${displayHour}:${minutes} ${ampm}`
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <Loader2 size={32} className="text-purple-500 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-page-enter">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Moon size={32} className="text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">
                Ramadan Dashboard
              </h1>
              <p className="text-slate-600 dark:text-slate-400 mt-1 text-sm sm:text-base">
                Manage Ramadan activities and settings
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Ramadan Mode Toggle */}
            <button
              onClick={handleToggleRamadanMode}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                ramadanMode
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
              }`}
            >
              <Moon size={18} />
              <span className="hidden sm:inline">
                {ramadanMode ? 'Ramadan Mode On' : 'Ramadan Mode Off'}
              </span>
            </button>

            <Link
              to={`/${slug}/admin/ramadan/zakat`}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <Calculator size={18} />
              <span className="hidden sm:inline">Zakat Calculator</span>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Countdown */}
          <RamadanCountdown
            currentDay={currentDay}
            totalDays={totalDays}
            daysRemaining={daysRemaining}
            isRamadan={isRamadan}
          />

          {/* Prayer Times Card */}
          {settings && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Clock size={20} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                    Daily Schedule
                  </h3>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    settings.is_active
                      ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400'
                  }`}
                >
                  {settings.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-lg">
                  <div className="text-3xl mb-2">🌙</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Suhoor
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatTime(settings.suhoor_time)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-lg">
                  <div className="text-3xl mb-2">☀️</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Iftar
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatTime(settings.iftar_time)}
                  </div>
                </div>
                <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg">
                  <div className="text-3xl mb-2">🌟</div>
                  <div className="text-sm text-slate-500 dark:text-slate-400 mb-1">
                    Taraweeh
                  </div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white">
                    {formatTime(settings.taraweeh_time)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Iftar Events */}
          <IftarSchedule events={iftarEvents} isLoading={loadingIftars} />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Zakat Stats */}
          {zakatStats && (
            <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <DollarSign size={20} className="text-emerald-600 dark:text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Zakat Overview
                </h3>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Collected</span>
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                    {formatCurrency(zakatStats.totalCollected)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Distributed</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {formatCurrency(zakatStats.totalDisbursed)}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600 dark:text-slate-400">Recipients</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {zakatStats.recipientCount}
                  </span>
                </div>
              </div>
              <Link
                to={`/${slug}/admin/ramadan/zakat`}
                className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              >
                <Calculator size={16} />
                Calculate Zakat
              </Link>
            </div>
          )}

          {/* Quick Settings */}
          <div className="bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-slate-100 dark:bg-slate-700 rounded-lg">
                <Settings size={20} className="text-slate-600 dark:text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                Quick Settings
              </h3>
            </div>
            <div className="space-y-3">
              <button
                onClick={handleToggleRamadanMode}
                className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
              >
                <span className="text-slate-700 dark:text-slate-300">Ramadan Theme</span>
                <div
                  className={`w-10 h-6 rounded-full transition-colors ${
                    ramadanMode ? 'bg-purple-600' : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                >
                  <div
                    className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                      ramadanMode ? 'translate-x-5' : 'translate-x-1'
                    }`}
                  />
                </div>
              </button>

              {settings && (
                <button
                  onClick={handleToggleSettings}
                  disabled={isToggling}
                  className="w-full flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <span className="text-slate-700 dark:text-slate-300">Schedule Active</span>
                  {isToggling ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <div
                      className={`w-10 h-6 rounded-full transition-colors ${
                        settings.is_active ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                      }`}
                    >
                      <div
                        className={`w-4 h-4 bg-white rounded-full mt-1 transition-transform ${
                          settings.is_active ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </div>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Info Card */}
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-800">
            <h4 className="font-semibold text-purple-800 dark:text-purple-200 mb-2">
              Ramadan Tip
            </h4>
            <p className="text-sm text-purple-700 dark:text-purple-300">
              Remember to increase your charitable giving during Ramadan.
              The rewards for good deeds are multiplied during this blessed month.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
