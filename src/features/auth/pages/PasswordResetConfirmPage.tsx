import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase/client'
import { Eye, EyeOff, Lock, CheckCircle2, XCircle } from 'lucide-react'

const schema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  })

type FormData = z.infer<typeof schema>

interface PasswordStrength {
  score: number
  label: string
  color: string
}

function calculatePasswordStrength(password: string): PasswordStrength {
  let score = 0

  if (password.length >= 8) score++
  if (password.length >= 12) score++
  if (/[a-z]/.test(password)) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++

  if (score <= 2) return { score, label: 'Weak', color: 'bg-red-500' }
  if (score <= 4) return { score, label: 'Fair', color: 'bg-yellow-500' }
  if (score <= 5) return { score, label: 'Good', color: 'bg-blue-500' }
  return { score, label: 'Strong', color: 'bg-green-500' }
}

export default function PasswordResetConfirmPage() {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [password, setPassword] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const passwordStrength = calculatePasswordStrength(password)

  const onSubmit = async (data: FormData) => {
    setIsLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: data.password,
      })

      if (error) {
        if (error.message.includes('token') || error.message.includes('expired')) {
          toast.error('Password reset link is invalid or expired. Please request a new one.')
        } else {
          toast.error(error.message)
        }
      } else {
        toast.success('Password reset successfully!')
        setTimeout(() => {
          navigate('/login')
        }, 1500)
      }
    } catch (err) {
      toast.error('An unexpected error occurred. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create new password</h1>
        <p className="text-muted-foreground">
          Please enter your new password. Make sure it's strong and secure.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            New password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              {...register('password', {
                onChange: (e) => setPassword(e.target.value),
              })}
              className="w-full pl-10 pr-10 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter new password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              tabIndex={-1}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.password.message}
            </p>
          )}

          {password && (
            <div className="mt-2">
              <div className="flex items-center gap-2 mb-1">
                <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${passwordStrength.color} transition-all duration-300`}
                    style={{ width: `${(passwordStrength.score / 6) * 100}%` }}
                  />
                </div>
                <span className="text-xs font-medium">{passwordStrength.label}</span>
              </div>
            </div>
          )}
        </div>

        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm password
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              id="confirmPassword"
              type={showConfirmPassword ? 'text' : 'password'}
              {...register('confirmPassword')}
              className="w-full pl-10 pr-10 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Confirm new password"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="mt-1 text-sm text-red-600 dark:text-red-400">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>

        <div className="p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
          <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
            Password requirements:
          </p>
          <ul className="space-y-1 text-xs text-blue-700 dark:text-blue-300">
            <li className="flex items-center gap-2">
              {password.length >= 8 ? (
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              At least 8 characters
            </li>
            <li className="flex items-center gap-2">
              {/[A-Z]/.test(password) ? (
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              One uppercase letter
            </li>
            <li className="flex items-center gap-2">
              {/[a-z]/.test(password) ? (
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              One lowercase letter
            </li>
            <li className="flex items-center gap-2">
              {/[0-9]/.test(password) ? (
                <CheckCircle2 className="h-3 w-3 text-green-600 dark:text-green-400" />
              ) : (
                <XCircle className="h-3 w-3 text-gray-400" />
              )}
              One number
            </li>
          </ul>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {isLoading ? 'Resetting password...' : 'Reset password'}
        </button>
      </form>
    </div>
  )
}
