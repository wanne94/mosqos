import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { toast } from 'sonner'
import { getPostLoginRedirectUrl } from '@/features/auth/services/postLoginRedirect'
import { Eye, EyeOff } from 'lucide-react'

const DEV_CREDENTIALS = [
  { email: 'admin@mosqos.com', password: 'password123', role: 'Admin' },
  { email: 'imam@mosqos.com', password: 'imam123', role: 'Imam' },
  { email: 'member@mosqos.com', password: 'member123', role: 'Member' },
]

export default function LoginPage() {
  const navigate = useNavigate()
  const { signIn, isDevMode } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const fillCredentials = (devEmail: string, devPassword: string) => {
    setEmail(devEmail)
    setPassword(devPassword)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const { error } = await signIn(email, password)
      if (error) {
        toast.error(error.message)
      } else {
        toast.success('Welcome back!')
        const redirectUrl = await getPostLoginRedirectUrl(email)
        navigate(redirectUrl)
      }
    } catch (err) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Welcome back</h1>
        <p className="text-muted-foreground">
          Sign in to your account to continue
        </p>
      </div>

      {isDevMode && (
        <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg">
          <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-2">
            Development Mode - Test Credentials:
          </p>
          <div className="space-y-1">
            {DEV_CREDENTIALS.map((cred) => (
              <button
                key={cred.email}
                type="button"
                onClick={() => fillCredentials(cred.email, cred.password)}
                className="block w-full text-left text-xs p-2 rounded hover:bg-amber-100 dark:hover:bg-amber-900 transition"
              >
                <span className="font-medium text-amber-700 dark:text-amber-300">{cred.role}:</span>{' '}
                <span className="text-amber-600 dark:text-amber-400">{cred.email}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 pr-10 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter your password"
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
        </div>

        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-gray-300" />
            Remember me
          </label>
          <Link
            to="/forgot-password"
            className="text-sm text-primary hover:underline"
          >
            Forgot password?
          </Link>
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Don't have an account?{' '}
        <Link to="/signup" className="text-primary hover:underline">
          Sign up
        </Link>
      </p>
    </div>
  )
}
