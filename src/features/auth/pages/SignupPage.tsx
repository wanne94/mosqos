import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/app/providers/AuthProvider'
import { useCountries, useCreateOrganization, useAddOrganizationOwner } from '@/features/organizations/hooks/useOrganizations'
import { signupWithOrganizationSchema, type SignupWithOrganizationFormData } from '@/features/organizations/types/organization.schemas'

export default function SignupPage() {
  const navigate = useNavigate()
  const { signUp, isDevMode } = useAuth()
  const [isLoading, setIsLoading] = useState(false)

  // Countries for dropdown
  const { data: countries = [], isLoading: countriesLoading } = useCountries()

  // Mutations
  const createOrganization = useCreateOrganization()
  const addOwner = useAddOrganizationOwner()

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<SignupWithOrganizationFormData>({
    resolver: zodResolver(signupWithOrganizationSchema),
    defaultValues: {
      organizationName: '',
      email: '',
      password: '',
      confirmPassword: '',
      countryId: '',
      acceptTerms: false as unknown as true,
    },
  })

  const onSubmit = async (data: SignupWithOrganizationFormData) => {
    setIsLoading(true)

    try {
      // Step 1: Create user account
      const { error: signUpError } = await signUp(data.email, data.password, {
        organization_name: data.organizationName,
      })

      if (signUpError) {
        toast.error(signUpError.message)
        setIsLoading(false)
        return
      }

      // In dev mode, just show success message and redirect to login
      if (isDevMode) {
        toast.success('Account created! Please check your email to verify.')
        navigate('/login')
        return
      }

      // Step 2: Create organization with pending status
      try {
        const organization = await createOrganization.mutateAsync({
          name: data.organizationName,
          country_id: data.countryId,
          contact_email: data.email,
          status: 'pending',
        })

        // Note: Adding owner will be done after email verification
        // For now, the organization is created and linked via created_by

        toast.success('Account created! Please check your email to verify, then your organization will be reviewed.')
        navigate('/login', {
          state: {
            message: 'Please check your email to verify your account. Once verified, your organization application will be reviewed by our team.',
          },
        })
      } catch (orgError) {
        console.error('Error creating organization:', orgError)
        // Account was created but org creation failed
        toast.error('Account created but organization setup failed. Please contact support.')
        navigate('/login')
      }
    } catch (err) {
      console.error('Signup error:', err)
      toast.error('An unexpected error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">Create your account</h1>
        <p className="text-muted-foreground">
          Start managing your mosque community today
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Organization Name */}
        <div>
          <label htmlFor="organizationName" className="block text-sm font-medium mb-1">
            Mosque/Organization Name
          </label>
          <input
            id="organizationName"
            type="text"
            {...register('organizationName')}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="e.g., Green Lane Masjid"
          />
          {errors.organizationName && (
            <p className="text-sm text-red-500 mt-1">{errors.organizationName.message}</p>
          )}
        </div>

        {/* Country */}
        <div>
          <label htmlFor="countryId" className="block text-sm font-medium mb-1">
            Country
          </label>
          <select
            id="countryId"
            {...register('countryId')}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            disabled={countriesLoading}
          >
            <option value="">Select a country</option>
            {countries.map((country) => (
              <option key={country.id} value={country.id}>
                {country.name}
              </option>
            ))}
          </select>
          {errors.countryId && (
            <p className="text-sm text-red-500 mt-1">{errors.countryId.message}</p>
          )}
        </div>

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            {...register('email')}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="you@example.com"
          />
          {errors.email && (
            <p className="text-sm text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            {...register('password')}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Minimum 8 characters"
          />
          {errors.password && (
            <p className="text-sm text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
            Confirm Password
          </label>
          <input
            id="confirmPassword"
            type="password"
            {...register('confirmPassword')}
            className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary"
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && (
            <p className="text-sm text-red-500 mt-1">{errors.confirmPassword.message}</p>
          )}
        </div>

        {/* Terms */}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            {...register('acceptTerms')}
            className="rounded border-gray-300 mt-1"
          />
          <span className="text-muted-foreground">
            I agree to the{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </span>
        </label>
        {errors.acceptTerms && (
          <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
        )}

        {/* Submit */}
        <button
          type="submit"
          disabled={isLoading || countriesLoading}
          className="w-full bg-primary text-primary-foreground py-2 rounded-md font-medium hover:opacity-90 disabled:opacity-50 transition flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Creating account...
            </>
          ) : (
            'Create account'
          )}
        </button>
      </form>

      {/* Info box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-sm text-blue-700 dark:text-blue-300">
        <p className="font-medium mb-1">What happens next?</p>
        <ol className="list-decimal list-inside space-y-1 text-blue-600 dark:text-blue-400">
          <li>Verify your email address</li>
          <li>Our team will review your application</li>
          <li>Once approved, you can start using MosqOS</li>
        </ol>
      </div>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
