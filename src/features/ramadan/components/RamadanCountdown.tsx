/**
 * Ramadan Countdown Component
 * Shows days remaining/current day in Ramadan
 */

import { Moon, Sun, Calendar } from 'lucide-react'

interface RamadanCountdownProps {
  currentDay: number
  totalDays: number
  daysRemaining: number
  isRamadan: boolean
}

export function RamadanCountdown({
  currentDay,
  totalDays,
  daysRemaining,
  isRamadan,
}: RamadanCountdownProps) {
  const progress = isRamadan ? (currentDay / totalDays) * 100 : 0

  return (
    <div className="bg-gradient-to-br from-purple-600 to-indigo-700 rounded-xl p-6 text-white shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
            <Moon size={28} className="text-amber-300" />
          </div>
          <div>
            <h3 className="text-lg font-bold">Ramadan Mubarak</h3>
            <p className="text-purple-200 text-sm">
              {isRamadan ? `Day ${currentDay} of ${totalDays}` : 'Coming Soon'}
            </p>
          </div>
        </div>
        <Sun size={24} className="text-amber-300 animate-pulse" />
      </div>

      {/* Progress Bar */}
      {isRamadan && (
        <div className="mb-4">
          <div className="w-full bg-white/20 rounded-full h-3 backdrop-blur-sm">
            <div
              className="bg-gradient-to-r from-amber-400 to-amber-300 h-3 rounded-full transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Main Counter */}
      <div className="text-center py-4">
        <div className="text-6xl font-bold mb-2">{daysRemaining}</div>
        <div className="text-purple-200">
          {isRamadan ? 'Days Remaining' : 'Days Until Ramadan'}
        </div>
      </div>

      {/* Stats Grid */}
      {isRamadan && (
        <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/20">
          <div className="text-center">
            <div className="text-2xl font-bold">{currentDay}</div>
            <div className="text-xs text-purple-200">Current Day</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(progress)}%</div>
            <div className="text-xs text-purple-200">Complete</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{daysRemaining}</div>
            <div className="text-xs text-purple-200">Remaining</div>
          </div>
        </div>
      )}
    </div>
  )
}
